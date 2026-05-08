import type { SiteContent } from "@/backend/site-content/types";

/** Used only when the API has no usable content and `site-content.json` files are missing or invalid. */
export const PUBLIC_DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {},
  heroBackground: {
    media: [
      {
        id: "bg-1",
        type: "image",
        src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1400&q=85&auto=format&fit=crop",
        filename: "gradient-1.webp",
      },
      {
        id: "bg-2",
        type: "video",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        filename: "blazes.mp4",
      },
      {
        id: "bg-3",
        type: "image",
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=85&auto=format&fit=crop",
        filename: "alpine.webp",
      },
      {
        id: "bg-4",
        type: "image",
        src: "https://images.unsplash.com/photo-1633167605827-e8f50f098a8d?w=1400&q=85&auto=format&fit=crop",
        filename: "sci-fi.webp",
      },
      {
        id: "bg-5",
        type: "video",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        filename: "escapes.mp4",
      },
      {
        id: "bg-6",
        type: "image",
        src: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1400&q=85&auto=format&fit=crop",
        filename: "neon.webp",
      },
      {
        id: "bg-7",
        type: "image",
        src: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=85&auto=format&fit=crop",
        filename: "theater.webp",
      },
      {
        id: "bg-8",
        type: "video",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        filename: "joyrides.mp4",
      },
    ],
    overlayOpacity: 0.55,
    crossfadeDuration: 6,
    staggerDelay: 0.8,
    enableParallax: true,
    parallaxIntensity: 10,
  },
  gallery: {
    items: [
      {
        id: "g-1",
        src: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=85&auto=format&fit=crop",
        alt: "Theater lighting",
        prompt: "Dramatic portrait under single spotlight.",
        category: "cinematic",
      },
      {
        id: "g-2",
        src: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=85&auto=format&fit=crop",
        alt: "Earth from orbit",
        prompt: "Orbital view of Earth at sunrise.",
        category: "sci-fi",
      },
      {
        id: "g-3",
        src: "https://images.unsplash.com/photo-1549887552-1fb649ced73d?w=1200&q=85&auto=format&fit=crop",
        alt: "Oil paint texture",
        prompt: "Thick impasto oil strokes, jewel tones.",
        category: "art",
      },
      {
        id: "g-4",
        src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=85&auto=format&fit=crop",
        alt: "Forest path",
        prompt: "Hyper-real forest trail, morning dew.",
        category: "realistic",
      },
      {
        id: "g-5",
        src: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=85&auto=format&fit=crop",
        alt: "Retro hologram",
        prompt: "Retro holographic UI floating in smoke.",
        category: "sci-fi",
      },
      {
        id: "g-6",
        src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=85&auto=format&fit=crop",
        alt: "Concert crowd",
        prompt: "Arena crowd silhouette, laser beams.",
        category: "cinematic",
      },
    ],
  },
  showcase: {
    slides: [
      {
        id: "show-1",
        title: "Face swap",
        caption:
          "Identity-aware blends that respect lighting, skin tone, and camera angle—built for believable hero shots.",
        videoSrc:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      },
      {
        id: "show-2",
        title: "Background genius",
        caption:
          "Replace environments in one pass—studio cyclorama, matte painting, or full CG—with depth-aware separation.",
        videoSrc:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      },
      {
        id: "show-3",
        title: "Motion trials",
        caption:
          "Export ultra-short motion snippets for socials and client review without burning full-length credits.",
        videoSrc:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      },
    ],
  },
};
