import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

export type GalleryCategory = "cinematic" | "sci-fi" | "art" | "realistic";

export type HeroPreview = {
  id: string;
  src: string;
  alt: string;
  prompt: string;
};

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  prompt: string;
  category: GalleryCategory;
};

export type SiteContent = {
  hero: { previews: HeroPreview[] };
  gallery: { items: GalleryItem[] };
};

const CONTENT_PATH = path.join(process.cwd(), "data", "site-content.json");

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

export async function readSiteContent(): Promise<SiteContent> {
  const raw = await fs.readFile(CONTENT_PATH, "utf8");
  const data = JSON.parse(raw) as unknown;
  if (!isRecord(data)) throw new Error("Invalid content file: root is not an object.");

  const hero = isRecord(data.hero) ? data.hero : null;
  const gallery = isRecord(data.gallery) ? data.gallery : null;
  const previewsRaw = hero && Array.isArray(hero.previews) ? hero.previews : null;
  const itemsRaw = gallery && Array.isArray(gallery.items) ? gallery.items : null;

  if (!previewsRaw || !itemsRaw) throw new Error("Invalid content file: missing hero.previews or gallery.items.");

  const previews = previewsRaw.map(parseHeroPreview).filter(Boolean) as HeroPreview[];
  const items = itemsRaw.map(parseGalleryItem).filter(Boolean) as GalleryItem[];

  return { hero: { previews }, gallery: { items } };
}

export async function writeSiteContent(next: SiteContent) {
  await fs.mkdir(path.dirname(CONTENT_PATH), { recursive: true });
  await fs.writeFile(CONTENT_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
}

