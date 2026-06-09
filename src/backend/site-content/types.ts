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

export type PillarItem = {
  id: string;
  title: string;
  body: string;
  accent: string;
  glowColor: string;
  cap1: string;
  cap2: string;
};

export type StatItem = {
  id: string;
  label: string;
  value: string;
  sub: string;
  glowColor: string;
  textColor: string;
  accentColor: string;
  pct: number;
};

export type TestimonialItem = {
  id: string;
  body: string;
  name: string;
  role: string;
  avatarColor: string;
  hoverColor: string;
  initials: string;
};

export type SpotlightFeatureItem = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  glowColor: string;
};

export type SpotlightTemplateItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  demoUrl?: string;
  imageUrl?: string;
};

export type UpcomingFeatureItem = {
  id: string;
  title: string;
  description: string;
  timeline: string;
  status: "planned" | "in-progress" | "released";
};

export type VisualizerPreset = {
  id: string;
  name: string;
  lens: string;
  gap: string;
  iso: string;
  prompt: string;
  image: string;
  resolution: string;
};

export type FeaturesCalibrationConfig = {
  cinema: string;
  landscape: string;
  square: string;
  portrait: string;
};

export type PricingPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: number;
  features: string[];
  badge?: string;
  cta: string;
  available: boolean;
  description?: string;
};

export type SiteContent = {
  hero: {};
  heroBackground: HeroBackgroundConfig;
  gallery: { items: GalleryItem[] };
  showcase: { slides: ShowcaseSlide[] };
  pillars?: PillarItem[];
  stats?: StatItem[];
  testimonials?: TestimonialItem[];
  spotlightFeatures?: SpotlightFeatureItem[];
  spotlightTemplates?: SpotlightTemplateItem[];
  upcomingFeatures?: UpcomingFeatureItem[];
  visualizerPresets?: VisualizerPreset[];
  featuresCalibration?: FeaturesCalibrationConfig;
  plans?: PricingPlan[];
};

