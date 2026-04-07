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

export type ShowcaseSlide = {
  id: string;
  title: string;
  caption: string;
  videoSrc: string;
};

export type SiteContent = {
  hero: { previews: HeroPreview[] };
  gallery: { items: GalleryItem[] };
  showcase: { slides: ShowcaseSlide[] };
};
