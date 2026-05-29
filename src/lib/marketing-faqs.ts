export type FaqCategory = "product" | "billing" | "teams" | "security";

export type MarketingFaq = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
};

/** Shared FAQ copy — FAQ page uses full list; Pricing embed can slice. */
export const MARKETING_FAQS: MarketingFaq[] = [
  {
    id: "create",
    category: "product",
    question: "What can I create with RUHGEN?",
    answer: "Still images, image sequences, and short-form cinematic clips from text—or combine reference frames and style prompts. Pro and Studio add higher resolutions, longer outputs, and batch workflows.",
  },
  {
    id: "pricing-teams",
    category: "billing",
    question: "How does pricing scale for teams?",
    answer: "Free is for experimentation. Pro fits solo creators and small squads with pooled monthly generations. Studio adds seats, shared prompt libraries, audit logs, and priority infrastructure.",
  },
  {
    id: "commercial",
    category: "billing",
    question: "Can I use outputs commercially?",
    answer: "Yes on Pro and Studio within the license terms in your agreement. Free tier is for personal exploration—upgrade before client or broadcast work.",
  },
  {
    id: "api",
    category: "teams",
    question: "Do you offer an API?",
    answer: "Studio includes REST hooks, webhooks on job completion, and signed URLs for assets so you can automate ingest into DAMs, MAMs, or custom render farms.",
  },
  {
    id: "privacy",
    category: "security",
    question: "How do you handle data privacy?",
    answer: "Prompts and uploads are encrypted in transit. Retention defaults are configurable on Studio; we never sell your data or train on private Studio content without a contract addendum.",
  },
  {
    id: "seats",
    category: "teams",
    question: "How do seats and shared libraries work?",
    answer: "Studio workspaces can add seats with role-based access. Shared prompt libraries and brand-safe style presets stay in sync so art direction doesn’t drift between contributors.",
  },
  {
    id: "credits",
    category: "billing",
    question: "What happens when I run out of credits?",
    answer: "You’ll see a clear notice before jobs start. Upgrade your plan, purchase a top-up where available, or wait for your monthly reset—your drafts and prompts are never deleted.",
  },
  {
    id: "exports",
    category: "product",
    question: "Which export formats are supported?",
    answer: "Common image formats plus sequence-friendly options for pipelines. Video exports target review-friendly codecs; Studio can expose additional formats and passes depending on your plan.",
  },
];

export const FAQ_CATEGORY_LABELS: Record<FaqCategory, string> = {
  product: "Product",
  billing: "Billing & licensing",
  teams: "Teams & API",
  security: "Security & data",
};
