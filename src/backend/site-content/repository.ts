import "server-only";

import { connection } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { PUBLIC_DEFAULT_SITE_CONTENT } from "@/backend/site-content/default-content";
import type {
  GalleryCategory,
  GalleryItem,
  HeroBackgroundConfig,
  HeroBackgroundMedia,
  ShowcaseSlide,
  SiteContent,
  SpotlightFeatureItem,
  SpotlightTemplateItem,
  UpcomingFeatureItem,
  VisualizerPreset,
  FeaturesCalibrationConfig,
  PricingPlan,
} from "@/backend/site-content/types";



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

function parseGalleryItem(x: unknown): GalleryItem | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.src) || !isString(x.alt) || !isString(x.prompt) || !isCategory(x.category)) {
    return null;
  }
  return { id: x.id, src: x.src, alt: x.alt, prompt: x.prompt, category: x.category };
}

function parseHeroBackgroundMedia(x: unknown): HeroBackgroundMedia | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.type) || !isString(x.src) || !isString(x.filename)) return null;
  if (x.type !== "image" && x.type !== "video") return null;
  return {
    id: x.id,
    type: x.type as "image" | "video",
    src: x.src,
    thumbnail: isString(x.thumbnail) ? x.thumbnail : undefined,
    filename: x.filename,
  };
}

function parseHeroBackgroundConfig(x: unknown): HeroBackgroundConfig | null {
  if (!isRecord(x)) return null;
  const mediaRaw = Array.isArray(x.media) ? x.media : [];
  const media = mediaRaw.map(parseHeroBackgroundMedia).filter(Boolean) as HeroBackgroundMedia[];
  return {
    media,
    overlayOpacity: typeof x.overlayOpacity === "number" ? x.overlayOpacity : 0.55,
    crossfadeDuration: typeof x.crossfadeDuration === "number" ? x.crossfadeDuration : 6,
    staggerDelay: typeof x.staggerDelay === "number" ? x.staggerDelay : 0.8,
    enableParallax: typeof x.enableParallax === "boolean" ? x.enableParallax : true,
    parallaxIntensity: typeof x.parallaxIntensity === "number" ? x.parallaxIntensity : 10,
  };
}

function parseSpotlightFeature(x: unknown): SpotlightFeatureItem | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.title) || !isString(x.description) || !isString(x.glowColor)) return null;
  return {
    id: x.id,
    title: x.title,
    description: x.description,
    badge: isString(x.badge) ? x.badge : undefined,
    glowColor: x.glowColor,
  };
}

function parseSpotlightTemplate(x: unknown): SpotlightTemplateItem | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.title) || !isString(x.description) || !isString(x.category)) return null;
  return {
    id: x.id,
    title: x.title,
    description: x.description,
    category: x.category,
    demoUrl: isString(x.demoUrl) ? x.demoUrl : undefined,
    imageUrl: isString(x.imageUrl) ? x.imageUrl : undefined,
  };
}

function parseUpcomingFeature(x: unknown): UpcomingFeatureItem | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.title) || !isString(x.description) || !isString(x.timeline)) return null;
  const status = x.status === "planned" || x.status === "in-progress" || x.status === "released" ? x.status : "planned";
  return {
    id: x.id,
    title: x.title,
    description: x.description,
    timeline: x.timeline,
    status,
  };
}

function parseVisualizerPreset(x: unknown): VisualizerPreset | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.name)) return null;
  return {
    id: x.id,
    name: x.name,
    lens: isString(x.lens) ? x.lens : "",
    gap: isString(x.gap) ? x.gap : "",
    iso: isString(x.iso) ? x.iso : "",
    prompt: isString(x.prompt) ? x.prompt : "",
    image: isString(x.image) ? x.image : "",
    resolution: isString(x.resolution) ? x.resolution : "",
  };
}

function parseShowcaseSlide(x: unknown): ShowcaseSlide | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.title) || !isString(x.caption)) return null;
  const videoSrc = isString(x.videoSrc) ? x.videoSrc : "";
  return { id: x.id, title: x.title, caption: x.caption, videoSrc };
}

function parseFeaturesCalibrationConfig(x: unknown): FeaturesCalibrationConfig | null {
  if (!isRecord(x)) return null;
  return {
    cinema: isString(x.cinema) ? x.cinema : "",
    landscape: isString(x.landscape) ? x.landscape : "",
    square: isString(x.square) ? x.square : "",
    portrait: isString(x.portrait) ? x.portrait : "",
  };
}

function parsePricingPlan(x: unknown): PricingPlan | null {
  if (!isRecord(x)) return null;
  if (!isString(x.id) || !isString(x.name) || !isString(x.cta)) return null;
  return {
    id: x.id,
    name: x.name,
    monthlyPrice: typeof x.monthlyPrice === "number" ? x.monthlyPrice : 0,
    yearlyPrice: typeof x.yearlyPrice === "number" ? x.yearlyPrice : 0,
    credits: typeof x.credits === "number" ? x.credits : 0,
    features: Array.isArray(x.features) ? x.features.map(String) : [],
    badge: isString(x.badge) ? x.badge : undefined,
    cta: x.cta,
    available: typeof x.available === "boolean" ? x.available : true,
    description: isString(x.description) ? x.description : undefined,
  };
}

/** Parse JSON payload into `SiteContent` (shared by file read and API response). */
export function parseSiteContentPayload(data: unknown): SiteContent {
  if (!isRecord(data)) throw new Error("Invalid content: root is not an object.");

  const hero = isRecord(data.hero) ? data.hero : {};
  const gallery = isRecord(data.gallery) ? data.gallery : null;
  const itemsRaw = gallery && Array.isArray(gallery.items) ? gallery.items : null;

  if (!itemsRaw) {
    throw new Error("Invalid content: missing gallery.items.");
  }

  const items = itemsRaw.map(parseGalleryItem).filter(Boolean) as GalleryItem[];

  const showcaseRaw =
    isRecord(data.showcase) && Array.isArray(data.showcase.slides) ? data.showcase.slides : null;
  let slides = showcaseRaw ? (showcaseRaw.map(parseShowcaseSlide).filter(Boolean) as ShowcaseSlide[]) : [];
  if (!slides.length) slides = structuredClone(DEFAULT_SHOWCASE_SLIDES);

  const heroBackground = parseHeroBackgroundConfig(data.heroBackground) || PUBLIC_DEFAULT_SITE_CONTENT.heroBackground;

  const pillars = Array.isArray(data.pillars) ? data.pillars : PUBLIC_DEFAULT_SITE_CONTENT.pillars;
  const stats = Array.isArray(data.stats) ? data.stats : PUBLIC_DEFAULT_SITE_CONTENT.stats;
  const testimonials = Array.isArray(data.testimonials) ? data.testimonials : PUBLIC_DEFAULT_SITE_CONTENT.testimonials;

  const spotlightFeatures = Array.isArray(data.spotlightFeatures) ? (data.spotlightFeatures.map(parseSpotlightFeature).filter(Boolean) as SpotlightFeatureItem[]) : undefined;
  const spotlightTemplates = Array.isArray(data.spotlightTemplates) ? (data.spotlightTemplates.map(parseSpotlightTemplate).filter(Boolean) as SpotlightTemplateItem[]) : undefined;
  const upcomingFeatures = Array.isArray(data.upcomingFeatures) ? (data.upcomingFeatures.map(parseUpcomingFeature).filter(Boolean) as UpcomingFeatureItem[]) : undefined;
  const visualizerPresets = Array.isArray(data.visualizerPresets) ? (data.visualizerPresets.map(parseVisualizerPreset).filter(Boolean) as VisualizerPreset[]) : undefined;
  const featuresCalibration = parseFeaturesCalibrationConfig(data.featuresCalibration) || undefined;
  const plans = Array.isArray(data.plans) ? (data.plans.map(parsePricingPlan).filter(Boolean) as PricingPlan[]) : undefined;

  return { hero, heroBackground, gallery: { items }, showcase: { slides }, pillars, stats, testimonials, spotlightFeatures, spotlightTemplates, upcomingFeatures, visualizerPresets, featuresCalibration, plans };
}

/** True when the CMS payload has no real gallery media (common after empty DB seed). */
function isSparseContent(c: SiteContent): boolean {
  const hasGallery = c.gallery.items.length > 0 && c.gallery.items.some((i) => i.src?.trim());
  return !hasGallery;
}

async function loadSiteContentFromDisk(): Promise<SiteContent | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "backend/data/site-content.json"), "utf8");
    return parseSiteContentPayload(JSON.parse(raw) as unknown);
  } catch {
    try {
      const rawFallback = await fs.readFile(path.join(process.cwd(), "data/site-content.json"), "utf8");
      return parseSiteContentPayload(JSON.parse(rawFallback) as unknown);
    } catch {
      return null;
    }
  }
}

/**
 * Ensures the landing page always has images and showcase clips: fills empty slots from defaults.
 * Local `/media/...` URLs pass through when present.
 */
export function applyPublicSiteDefaults(c: SiteContent): SiteContent {
  const def = PUBLIC_DEFAULT_SITE_CONTENT;
  const videoById = new Map(def.showcase.slides.map((s) => [s.id, s.videoSrc]));

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

  const heroBackground = c.heroBackground || def.heroBackground;

  const pillars = c.pillars && c.pillars.length > 0 ? c.pillars : def.pillars;
  const stats = c.stats && c.stats.length > 0 ? c.stats : def.stats;
  const testimonials = c.testimonials && c.testimonials.length > 0 ? c.testimonials : def.testimonials;

  const spotlightFeatures = c.spotlightFeatures && c.spotlightFeatures.length > 0 ? c.spotlightFeatures : def.spotlightFeatures;
  const spotlightTemplates = c.spotlightTemplates && c.spotlightTemplates.length > 0 ? c.spotlightTemplates : def.spotlightTemplates;
  const upcomingFeatures = c.upcomingFeatures && c.upcomingFeatures.length > 0 ? c.upcomingFeatures : def.upcomingFeatures;
  const visualizerPresets = c.visualizerPresets && c.visualizerPresets.length > 0 ? c.visualizerPresets : def.visualizerPresets;
  const featuresCalibration = c.featuresCalibration || def.featuresCalibration;
  const plans = c.plans && c.plans.length > 0 ? c.plans : def.plans;

  return {
    hero: c.hero,
    heroBackground,
    gallery: { items: galleryItems.length > 0 ? galleryItems : def.gallery.items },
    showcase: { slides: showcaseSlides },
    pillars,
    stats,
    testimonials,
    spotlightFeatures,
    spotlightTemplates,
    upcomingFeatures,
    visualizerPresets,
    featuresCalibration,
    plans,
  };
}

export async function readSiteContent(): Promise<SiteContent> {
  try {
    await connection();
  } catch {
    /* ignore if called outside request context */
  }

  let fromApi: SiteContent | null = null;
  const rawBase =
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://127.0.0.1:4000";

  const base = (!rawBase || rawBase.includes("ruhgen-1.onrender.com"))
    ? "http://127.0.0.1:4000"
    : rawBase;

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
  if (fromApi && fromDisk) {
    merged = {
      ...fromDisk,
      ...fromApi,
      gallery: fromApi.gallery?.items && fromApi.gallery.items.length > 0 ? fromApi.gallery : fromDisk.gallery,
      showcase: fromApi.showcase?.slides && fromApi.showcase.slides.length > 0 ? fromApi.showcase : fromDisk.showcase,
      plans: fromApi.plans && fromApi.plans.length > 0 ? fromApi.plans : fromDisk.plans,
    };
  } else if (fromApi) {
    merged = fromApi;
  } else if (fromDisk) {
    merged = fromDisk;
  } else {
    merged = PUBLIC_DEFAULT_SITE_CONTENT;
  }

  return applyPublicSiteDefaults(merged);
}
