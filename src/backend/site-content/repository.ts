import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { PUBLIC_DEFAULT_SITE_CONTENT } from "@/backend/site-content/default-content";
import type {
  GalleryCategory,
  GalleryItem,
  HeroPreview,
  ShowcaseSlide,
  SiteContent,
} from "@/backend/site-content/types";

const CONTENT_PATH = path.join(/* turbopackIgnore: true */ process.cwd(), "backend", "data", "site-content.json");
const CONTENT_FALLBACK_PATH = path.join(/* turbopackIgnore: true */ process.cwd(), "data", "site-content.json");

const DEFAULT_SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: "show-1",
    title: "Face swap",
    caption:
      "Identity-aware blends that respect lighting, skin tone, and camera angle—built for believable hero shots.",
    videoSrc: "",
  },
  {
    id: "show-2",
    title: "Background genius",
    caption:
      "Replace environments in one pass—studio cyclorama, matte painting, or full CG—with depth-aware separation.",
    videoSrc: "",
  },
  {
    id: "show-3",
    title: "Motion trials",
    caption:
      "Export ultra-short motion snippets for socials and client review without burning full-length credits.",
    videoSrc: "",
  },
];

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function isString(x: unknown): x is string {
  return typeof x === "string";
}

function isCategory(x: unknown): x is GalleryCategory {
  return x === "cinematic" || x === "sci-fi" || x === "art" || x === "realistic";
}

function parseHeroPreview(x: unknown): HeroPreview | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.src) || !isString(x.alt) || !isString(x.prompt)) return null;
  return { id: x.id, src: x.src, alt: x.alt, prompt: x.prompt };
}

function parseGalleryItem(x: unknown): GalleryItem | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.src) || !isString(x.alt) || !isString(x.prompt) || !isCategory(x.category)) {
    return null;
  }
  return { id: x.id, src: x.src, alt: x.alt, prompt: x.prompt, category: x.category };
}

function parseShowcaseSlide(x: unknown): ShowcaseSlide | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.title) || !isString(x.caption)) return null;
  const videoSrc = isString(x.videoSrc) ? x.videoSrc : "";
  return { id: x.id, title: x.title, caption: x.caption, videoSrc };
}

/** Parse JSON payload into `SiteContent` (shared by file read and API response). */
export function parseSiteContentPayload(data: unknown): SiteContent {
  if (!isRecord(data)) throw new Error("Invalid content: root is not an object.");

  const hero = isRecord(data.hero) ? data.hero : null;
  const gallery = isRecord(data.gallery) ? data.gallery : null;
  const previewsRaw = hero && Array.isArray(hero.previews) ? hero.previews : null;
  const itemsRaw = gallery && Array.isArray(gallery.items) ? gallery.items : null;

  if (!previewsRaw || !itemsRaw) {
    throw new Error("Invalid content: missing hero.previews or gallery.items.");
  }

  const previews = previewsRaw.map(parseHeroPreview).filter(Boolean) as HeroPreview[];
  const items = itemsRaw.map(parseGalleryItem).filter(Boolean) as GalleryItem[];

  const showcaseRaw =
    isRecord(data.showcase) && Array.isArray(data.showcase.slides) ? data.showcase.slides : null;
  let slides = showcaseRaw ? (showcaseRaw.map(parseShowcaseSlide).filter(Boolean) as ShowcaseSlide[]) : [];
  if (!slides.length) slides = structuredClone(DEFAULT_SHOWCASE_SLIDES);

  return { hero: { previews }, gallery: { items }, showcase: { slides } };
}

/** True when the CMS payload has no real hero/gallery media (common after empty DB seed). */
function isSparseContent(c: SiteContent): boolean {
  const hasHero = c.hero.previews.length > 0 && c.hero.previews.some((p) => p.src?.trim());
  const hasGallery = c.gallery.items.length > 0 && c.gallery.items.some((i) => i.src?.trim());
  return !hasHero || !hasGallery;
}

async function loadSiteContentFromDisk(): Promise<SiteContent | null> {
  for (const p of [CONTENT_PATH, CONTENT_FALLBACK_PATH]) {
    try {
      const raw = await fs.readFile(p, "utf8");
      return parseSiteContentPayload(JSON.parse(raw) as unknown);
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * Ensures the landing page always has images and showcase clips: fills empty slots from defaults.
 * Local `/media/...` URLs pass through when present.
 */
export function applyPublicSiteDefaults(c: SiteContent): SiteContent {
  const def = PUBLIC_DEFAULT_SITE_CONTENT;
  const videoById = new Map(def.showcase.slides.map((s) => [s.id, s.videoSrc]));

  const heroPreviews = c.hero.previews.filter((p) => p.src?.trim());
  const galleryItems = c.gallery.items.filter((i) => i.src?.trim());

  const slides =
    c.showcase.slides.length === 0
      ? def.showcase.slides
      : c.showcase.slides.map((s, i) => {
          const v = s.videoSrc?.trim();
          if (v) return s;
          const fallback = videoById.get(s.id) ?? def.showcase.slides[i]?.videoSrc ?? "";
          return { ...s, videoSrc: fallback };
        });

  const hasVideo = slides.some((s) => s.videoSrc?.trim());
  const showcaseSlides = hasVideo ? slides : def.showcase.slides;

  return {
    hero: { previews: heroPreviews.length > 0 ? heroPreviews : def.hero.previews },
    gallery: { items: galleryItems.length > 0 ? galleryItems : def.gallery.items },
    showcase: { slides: showcaseSlides },
  };
}

export async function readSiteContent(): Promise<SiteContent> {
  let fromApi: SiteContent | null = null;
  const base = process.env.BACKEND_URL?.trim();
  if (base) {
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/admin/content`, {
        cache: "no-store",
      });
      if (res.ok) {
        try {
          const raw = (await res.json()) as unknown;
          fromApi = parseSiteContentPayload(raw);
        } catch {
          fromApi = null;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const fromDisk = await loadSiteContentFromDisk();

  let merged: SiteContent;
  if (fromApi && fromDisk && isSparseContent(fromApi)) {
    // SQLite often seeds empty hero/gallery; prefer on-disk JSON (your /media/... paths).
    merged = fromDisk;
  } else if (fromApi && !isSparseContent(fromApi)) {
    merged = fromApi;
  } else if (!fromApi && fromDisk) {
    merged = fromDisk;
  } else if (fromApi && !fromDisk) {
    merged = fromApi;
  } else {
    merged = PUBLIC_DEFAULT_SITE_CONTENT;
  }

  return applyPublicSiteDefaults(merged);
}
