import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import type {
  GalleryCategory,
  GalleryItem,
  HeroPreview,
  ShowcaseSlide,
  SiteContent,
} from "@/backend/site-content/types";

const CONTENT_PATH = path.join(process.cwd(), "data", "site-content.json");

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

export async function readSiteContent(): Promise<SiteContent> {
  const raw = await fs.readFile(CONTENT_PATH, "utf8");
  const data = JSON.parse(raw) as unknown;
  if (!isRecord(data)) throw new Error("Invalid content file: root is not an object.");

  const hero = isRecord(data.hero) ? data.hero : null;
  const gallery = isRecord(data.gallery) ? data.gallery : null;
  const previewsRaw = hero && Array.isArray(hero.previews) ? hero.previews : null;
  const itemsRaw = gallery && Array.isArray(gallery.items) ? gallery.items : null;

  if (!previewsRaw || !itemsRaw) {
    throw new Error("Invalid content file: missing hero.previews or gallery.items.");
  }

  const previews = previewsRaw.map(parseHeroPreview).filter(Boolean) as HeroPreview[];
  const items = itemsRaw.map(parseGalleryItem).filter(Boolean) as GalleryItem[];

  const showcaseRaw =
    isRecord(data.showcase) && Array.isArray(data.showcase.slides) ? data.showcase.slides : null;
  let slides = showcaseRaw ? showcaseRaw.map(parseShowcaseSlide).filter(Boolean) as ShowcaseSlide[] : [];
  if (!slides.length) slides = structuredClone(DEFAULT_SHOWCASE_SLIDES);

  return { hero: { previews }, gallery: { items }, showcase: { slides } };
}

export async function writeSiteContent(next: SiteContent) {
  await fs.mkdir(path.dirname(CONTENT_PATH), { recursive: true });
  await fs.writeFile(CONTENT_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
}
