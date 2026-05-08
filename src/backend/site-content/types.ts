export type GalleryCategory = "cinematic" | "sci-fi" | "art" | "realistic";


export type HeroBackgroundMedia = {
  id: string;
  type: "image" | "video";
  src: string;
  thumbnail?: string;
  filename: string;
};

export type HeroBackgroundConfig = {
  media: HeroBackgroundMedia[];
  overlayOpacity: number;
  crossfadeDuration: number;
  staggerDelay: number;
  enableParallax: boolean;
  parallaxIntensity: number;
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
  hero: {};
  heroBackground: HeroBackgroundConfig;
  gallery: { items: GalleryItem[] };
  showcase: { slides: ShowcaseSlide[] };
};
