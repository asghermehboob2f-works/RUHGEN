"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Category = "all" | "cinematic" | "sci-fi" | "art" | "realistic";

type Item = {
  id: string;
  src: string;
  alt: string;
  prompt: string;
  category: Exclude<Category, "all">;
  aspect: "tall" | "wide" | "square";
};

const items: Item[] = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80",
    alt: "Foggy peaks",
    prompt: "Misty mountain range at blue hour",
    category: "cinematic",
    aspect: "tall",
  },
  {
    id: "2",
    src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    alt: "Earth from space",
    prompt: "Orbital view, neon data streams",
    category: "sci-fi",
    aspect: "wide",
  },
  {
    id: "3",
    src: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&q=80",
    alt: "Abstract paint",
    prompt: "Oil swirl macro, jewel tones",
    category: "art",
    aspect: "square",
  },
  {
    id: "4",
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80",
    alt: "Forest path",
    prompt: "Hyper-real forest trail, golden light",
    category: "realistic",
    aspect: "tall",
  },
  {
    id: "5",
    src: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
    alt: "Neon tunnel",
    prompt: "Infinite neon corridor, anamorphic",
    category: "sci-fi",
    aspect: "wide",
  },
  {
    id: "6",
    src: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80",
    alt: "Gallery wall",
    prompt: "Gallery interior, soft spotlight",
    category: "art",
    aspect: "square",
  },
  {
    id: "7",
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    alt: "Valley fog",
    prompt: "Cinematic valley inversion layer",
    category: "cinematic",
    aspect: "wide",
  },
  {
    id: "8",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    alt: "Alpine lake",
    prompt: "8K alpine reflection, crystal water",
    category: "realistic",
    aspect: "tall",
  },
];

const filters: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cinematic", label: "Cinematic" },
  { key: "sci-fi", label: "Sci-Fi" },
  { key: "art", label: "Art" },
  { key: "realistic", label: "Realistic" },
];

function aspectClass(a: Item["aspect"]) {
  if (a === "tall") return "aspect-[3/4]";
  if (a === "wide") return "aspect-[16/10]";
  return "aspect-square";
}

export function GallerySection() {
  const [filter, setFilter] = useState<Category>("all");
  const [selected, setSelected] = useState<Item | null>(null);
  const reduce = useReducedMotion();

  const visible = items.filter(
    (i) => filter === "all" || i.category === filter
  );

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    },
    []
  );

  useEffect(() => {
    if (!selected) return;
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected, onKey]);

  return (
    <section id="gallery" className="mesh-section-muted scroll-mt-24 py-12 md:py-24">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <div className="mb-8 text-center md:mb-12">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
            style={{ color: "var(--text-subtle)" }}
          >
            Inspiration
          </p>
          <h2
            className="font-display text-[clamp(1.55rem,3.8vw,3rem)] font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Showcase gallery
          </h2>
          <p
            className="mx-auto mt-2 max-w-lg text-sm sm:mt-3 sm:text-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Explore what creators are building
          </p>
        </div>

        <div className="mb-6 flex flex-wrap justify-center gap-1.5 sm:mb-10 sm:gap-2.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`min-h-10 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all sm:min-h-11 sm:px-5 sm:py-2.5 sm:text-sm ${
                filter === f.key
                  ? "border-transparent text-white shadow-[0_0_24px_rgba(123,97,255,0.35)]"
                  : ""
              }`}
              style={
                filter === f.key
                  ? {
                      background:
                        "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                    }
                  : {
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-muted)",
                      background: "var(--glass)",
                    }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <motion.div
          layout
          className="columns-1 gap-4 sm:columns-2 sm:gap-6 lg:columns-3"
        >
          <AnimatePresence mode="popLayout">
            {visible.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-4 break-inside-avoid sm:mb-6"
              >
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`group relative block w-full overflow-hidden rounded-xl border text-left sm:rounded-2xl ${aspectClass(item.aspect)}`}
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium capitalize backdrop-blur-md">
                      {item.category}
                    </span>
                    <p className="mt-2 text-sm font-medium text-white">
                      {item.prompt}
                    </p>
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Gallery item"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              aria-label="Close"
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border shadow-2xl"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--soft-black)",
              }}
              initial={reduce ? false : { scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduce ? undefined : { scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border text-lg font-light"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                  background: "var(--glass)",
                }}
                aria-label="Close dialog"
              >
                ×
              </button>
              <div className="relative aspect-video w-full">
                <Image
                  src={selected.src}
                  alt={selected.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 896px) 100vw, 896px"
                />
              </div>
              <div className="p-6">
                <span className="inline-block rounded-full bg-gradient-to-r from-[#7B61FF]/25 to-[#00D4FF]/25 px-3 py-1 text-xs font-semibold capitalize text-[#7B61FF]">
                  {selected.category}
                </span>
                <p
                  className="mt-3 text-lg font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selected.prompt}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
