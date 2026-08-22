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
  pillars: [
    {
      id: "pil-1",
      title: "Iterate at the speed of thought",
      body: "Tight feedback loops from prompt to pixel—so you stay in flow instead of waiting on renders.",
      accent: "#00D4FF",
      glowColor: "rgba(0, 212, 255, 0.04)",
      cap1: "Core latency: 14ms",
      cap2: "Edge rendering",
    },
    {
      id: "pil-2",
      title: "Cinematic fidelity, production discipline",
      body: "HDR-aware looks, consistent aspect pipelines, and exports that slot into review and finishing.",
      accent: "#7B61FF",
      glowColor: "rgba(123, 97, 255, 0.04)",
      cap1: "10-bit HDR color",
      cap2: "DAM Export Ready",
    },
    {
      id: "pil-3",
      title: "Built for teams, not just tabs",
      body: "Policies, audit trails, and burst capacity when launch week refuses to be predictable.",
      accent: "#FF2E9A",
      glowColor: "rgba(255, 46, 154, 0.04)",
      cap1: "Concurrence: Unlimited",
      cap2: "SLA-backed",
    },
  ],
  stats: [
    {
      id: "stat-1",
      label: "Generations delivered",
      value: "12.4M+",
      sub: "and counting",
      glowColor: "rgba(123, 97, 255, 0.05)",
      textColor: "from-brand-purple to-white",
      accentColor: "#7B61FF",
      pct: 88,
    },
    {
      id: "stat-2",
      label: "Median time to first frame",
      value: "4.2s",
      sub: "Pro tier, global edge",
      glowColor: "rgba(0, 212, 255, 0.05)",
      textColor: "from-brand-cyan to-white",
      accentColor: "#00D4FF",
      pct: 95,
    },
    {
      id: "stat-3",
      label: "Creators & studios",
      value: "84K+",
      sub: "in 120+ countries",
      glowColor: "rgba(255, 46, 154, 0.05)",
      textColor: "from-brand-pink to-white",
      accentColor: "#FF2E9A",
      pct: 74,
    },
    {
      id: "stat-4",
      label: "Peak output resolution",
      value: "8K",
      sub: "HDR-ready exports",
      glowColor: "rgba(123, 97, 255, 0.05)",
      textColor: "from-brand-purple via-white to-brand-cyan",
      accentColor: "#7B61FF",
      pct: 99,
    },
  ],
  testimonials: [
    {
      id: "test-1",
      body: "We replaced a week of mood-board iteration with one RUHGEN session. The team finally stopped fighting over references and started shipping.",
      name: "Elena Voss",
      role: "Creative Director, Northwind Studio",
      avatarColor: "from-brand-purple to-indigo-950/40",
      hoverColor: "group-hover:text-brand-purple/70",
      initials: "EV",
    },
    {
      id: "test-2",
      body: "Latency is honestly wild. I can iterate on a shot while the director is still in the room—feels like a realtime renderer for ideas.",
      name: "Marcus Chen",
      role: "VFX Supervisor",
      avatarColor: "from-brand-cyan to-teal-950/40",
      hoverColor: "group-hover:text-brand-cyan/70",
      initials: "MC",
    },
    {
      id: "test-3",
      body: "The API slots straight into our asset pipeline. Webhooks fire when renders finish; our DAM ingests frames without anyone touching FTP.",
      name: "Priya Nair",
      role: "Head of Platform, Lumen Labs",
      avatarColor: "from-brand-pink to-rose-950/40",
      hoverColor: "group-hover:text-brand-pink/70",
      initials: "PN",
    },
  ],
  spotlightFeatures: [
    {
      id: "sf-1",
      title: "Real-time Orchestration",
      description: "Direct camera grids and dynamic light behaviors live.",
      badge: "New",
      glowColor: "#7B61FF",
    },
    {
      id: "sf-2",
      title: "Ultra-precise Inpainting",
      description: "Surgically edit elements with zero artifacts.",
      badge: "Beta",
      glowColor: "#00D4FF",
    },
    {
      id: "sf-3",
      title: "Fluid Hand-offs",
      description: "Transition seamlessly from prompt concept to full motion timeline.",
      badge: "Pro",
      glowColor: "#FF2E9A",
    },
  ],
  spotlightTemplates: [
    {
      id: "st-1",
      title: "Cinematic Mood Board",
      description: "A high-fidelity starter preset optimized for narrative drama and moody contrast.",
      category: "Cinematic",
    },
    {
      id: "st-2",
      title: "Cyberpunk Streetscape",
      description: "Vibrant neon-flooded grids and glassmorphic reflection maps.",
      category: "Sci-Fi",
    },
  ],
  upcomingFeatures: [
    {
      id: "uf-1",
      title: "Multi-modal Sync Pipelines",
      description: "Synchronize audio spikes with micro-frame visual behaviors dynamically.",
      timeline: "Q3 2026",
      status: "in-progress",
    },
    {
      id: "uf-2",
      title: "Edge Acceleration Node",
      description: "Deploy local frame buffer instances for zero-delay workspace previewing.",
      timeline: "Q4 2026",
      status: "planned",
    },
    {
      id: "uf-3",
      title: "Infinite Outpainting Canvas",
      description: "Unbound visual panning across active generation layers.",
      timeline: "Released",
      status: "released",
    },
  ],
  visualizerPresets: [
    {
      id: "vp-1",
      name: "Silence wasn't enough",
      lens: "35mm",
      gap: "f/1.8",
      iso: "ISO 200",
      prompt: "A cobra standing upright with two raised middle fingers, photorealistic, ultra-detailed wildlife photography, cinematic lighting, shallow depth of field, blurred green background, humorous yet intimidating, 8K",
      image: "/media/gallery/32ef021f-7efb-42a3-9fd2-dce35c6ecac1.png",
      resolution: "4.2s"
    },
    {
      id: "vp-2",
      name: "Only honor remained",
      lens: "50mm",
      gap: "f/1.2",
      iso: "ISO 800",
      prompt: "A fallen medieval knight in blood-stained steel armor lying in a wildflower field at sunset, cinematic lighting, ultra-realistic, dramatic atmosphere, shallow depth of field, highly detailed, 8K.",
      image: "/media/gallery/0f730191-d513-463f-92c8-7c91bbea3f42.jpg",
      resolution: "3.8s"
    },
    {
      id: "vp-3",
      name: "Can this be ours?",
      lens: "85mm",
      gap: "f/2.0",
      iso: "ISO 100",
      prompt: "An adorable chubby tabby cat in a black tuxedo holding a red rose and an open diamond ring box, romantic candlelit street at night, cinematic lighting, ultra-realistic, shallow depth of field, warm bokeh, 8K.",
      image: "/media/gallery/8b1de65d-3357-4a56-bfa9-23cb5c7fecdc.jpg",
      resolution: "2.9s"
    }
  ],
  featuresCalibration: {
    cinema: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1200",
    landscape: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    square: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800",
    portrait: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"
  },
  plans: [
    {
      id: "free",
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      credits: 120,
      features: [
        "120 Credits Included",
        "Standard Image Generation Access",
        "Standard Video Generation Access",
        "Up to 2K Quality",
        "Standard Rendering Queue",
        "Community Support",
        "Core Creative Tools",
        "Basic Generation History"
      ],
      cta: "Get Started Free",
      available: true
    },
    {
      id: "pro",
      name: "Pro",
      monthlyPrice: 499,
      yearlyPrice: 4799,
      credits: 510,
      features: [
        "510 Credits Included",
        "Advanced Image Generation Access",
        "Advanced Video Generation Access",
        "Up to 4K Quality",
        "Priority Rendering",
        "Faster Processing",
        "Commercial Usage Rights",
        "Premium Creative Tools",
        "Extended History",
        "Email Support"
      ],
      badge: "Most Popular",
      cta: "Upgrade to Pro",
      available: true
    },
    {
      id: "pro_plus",
      name: "Pro Plus",
      monthlyPrice: 999,
      yearlyPrice: 9599,
      credits: 650,
      features: [
        "650 Credits Included",
        "Full Platform Access",
        "Ultra HD Outputs",
        "Instant Priority Queue",
        "Dedicated Support",
        "Commercial Licensing",
        "API Access",
        "Team Collaboration",
        "Advanced Workflow Controls",
        "Premium Features",
        "Early Feature Access",
        "Highest Rendering Priority"
      ],
      badge: "Best Value",
      cta: "Go Pro Plus",
      available: true
    },
    {
      id: "custom",
      name: "Custom",
      monthlyPrice: 0,
      yearlyPrice: 0,
      credits: 0,
      features: [
        "Custom Credit Allocation",
        "Dedicated Infrastructure",
        "Private Deployments",
        "Team Management",
        "Custom AI Models",
        "Custom Integrations",
        "Dedicated Account Manager",
        "Enterprise Security",
        "Priority Support",
        "Flexible Licensing",
        "API Scaling",
        "Personalized Workflows"
      ],
      description: "Tell us what you need and we will build a tailored creative environment around your workflow.",
      cta: "Contact Sales",
      available: true
    }
  ]
};
