"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualizerPreset } from "@/backend/site-content/types";

type DemoHeroGraphicProps = {
  presets?: VisualizerPreset[];
  className?: string;
};

interface InternalPreset {
  id: string;
  name: string;
  prompt: string;
  image: string;
  resolution: string;
  accent: string;
}

const fallbackPresets: VisualizerPreset[] = [
  {
    id: "sci-fi",
    name: "Sci-Fi Monolith",
    lens: "35mm",
    gap: "f/1.8",
    iso: "ISO 200",
    prompt: "cinematic moody sci-fi explorer discovering a glowing neon monolith on an alien world, volumetric lighting, 8k",
    image: "/media/features-monolith.png",
    resolution: "4.2s"
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Hacker",
    lens: "50mm",
    gap: "f/1.2",
    iso: "ISO 800",
    prompt: "cyberpunk terminal operator in a high-density server rack room, holographic neon interfaces, dense vapor haze",
    image: "/media/features-editorial.png",
    resolution: "3.8s"
  },
  {
    id: "vaporwave",
    name: "Vaporwave Sea",
    lens: "85mm",
    gap: "f/2.0",
    iso: "ISO 100",
    prompt: "surreal vaporwave ocean landscape under a low-fidelity pastel sunset, wireframe grid vector reflections, 8k",
    image: "/media/features-sculpture.png",
    resolution: "2.9s"
  }
];

export function DemoHeroGraphic({ presets, className = "" }: DemoHeroGraphicProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const presetsList = presets && presets.length > 0 ? presets : fallbackPresets;

  // Map accents dynamically to ensure high-end neoclassical colors
  const resolvedPresets: InternalPreset[] = presetsList.map((p, idx) => {
    const accents = ["#7B61FF", "#00D4FF", "#FF2E9A"];
    return {
      id: p.id,
      name: p.name,
      prompt: p.prompt || "",
      image: p.image || "/media/features-monolith.png",
      resolution: p.resolution || "4.1s",
      accent: accents[idx % accents.length]
    };
  });

  const activePreset = resolvedPresets[activeIndex] || resolvedPresets[0];

  const selectPreset = (index: number) => {
    setActiveIndex(index);
  };

  const getSubtext = (idx: number) => {
    if (idx === 0) return "28/28";
    if (idx === 1) return "48/48";
    return "28/28";
  };

  if (resolvedPresets.length === 0) return null;

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* Soft back ambient glow */}
      <div 
        className="absolute -inset-4 opacity-20 blur-3xl rounded-[2.5rem] transition-all duration-700 pointer-events-none" 
        style={{
          background: `radial-gradient(circle at 50% 50%, ${activePreset.accent} 0%, transparent 70%)`
        }}
      />

      {/* Main console chassis */}
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[0_20px_60px_-16px_rgba(0,0,0,0.15)]">
        <div className="relative flex flex-col justify-between">
          
          {/* Classic macOS Header Bar */}
          <div className="relative z-20 flex items-center px-3.5 py-2 border-b border-border/40 bg-card/40 backdrop-blur-md">
            <div className="flex items-center gap-1 mr-3 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f56]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-[7px] font-mono font-bold tracking-[0.25em] text-muted-foreground/60 uppercase select-none truncate">
              RUHGEN ENGINE // STILL_VISUALIZER
            </span>
          </div>

          {/* Main Visualizer Area (16/9.8 Cinematic Aspect Ratio - Perfectly Balanced Height) */}
          <div className="relative flex-1 w-full aspect-[16/9.8] bg-background overflow-hidden flex items-center justify-center">
            
            {/* Shifting images */}
            <AnimatePresence mode="wait">
              <motion.img
                key={activePreset.id}
                src={activePreset.image}
                alt={activePreset.name}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 0.8, filter: "blur(0px) saturate(1.1)" }}
                exit={{ opacity: 0, filter: "blur(3px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            </AnimatePresence>

            {/* Left Top: Dynamic RUHGEN STANDARD Tag */}
            <div className="absolute top-2.5 left-2.5 z-20">
              <span className="inline-flex items-center gap-1 rounded-full bg-card/60 backdrop-blur-md px-2.5 py-1 border border-border text-[8px] font-mono font-bold tracking-wider text-foreground shadow-md">
                <span className="w-1 h-1 rounded-full transition-all duration-500" style={{ backgroundColor: activePreset.accent }} />
                RUHGEN STANDARD
              </span>
            </div>

            {/* Right Top: Dynamic Render Time Tag */}
            <div className="absolute top-2.5 right-2.5 z-20 font-mono">
              <span className="inline-flex items-center gap-1 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/30 px-2 py-0.5 text-[7.5px] font-black text-[#00d4ff] backdrop-blur-sm shadow-md">
                RENDER: {activePreset.resolution}
              </span>
            </div>

            {/* Ultra Slim Premium Prompt Box (Float Bottom) */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 border border-border/50 bg-card/60 backdrop-blur-md rounded-lg p-2.5 text-left shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
              <p className="text-[9px] sm:text-[9.5px] font-mono text-foreground/90 leading-relaxed italic block">
                &ldquo;{activePreset.prompt}&rdquo;
              </p>
            </div>

          </div>

          {/* Bottom Dock: ACTIVE ENGINE PRESETS */}
          <div className="p-3 border-t border-border/40 bg-card/50 relative z-20">
            <div className="text-[8px] font-mono font-bold tracking-widest text-muted-foreground/60 uppercase mb-2.5 text-left">
              ACTIVE ENGINE PRESETS
            </div>

            <div className="grid grid-cols-3 gap-2">
              {resolvedPresets.map((preset, index) => {
                const isActive = activeIndex === index;
                return (
                  <button
                    key={preset.id}
                    onClick={() => selectPreset(index)}
                    className={`flex flex-col text-left p-2 sm:p-2.5 rounded-lg border transition-all duration-300 outline-none relative overflow-hidden select-none cursor-pointer ${
                      isActive ? 
                      "border-border shadow-[0_0_8px_rgba(123,97,255,0.04)]" : 
                      "border-border/30 bg-card/10 hover:bg-card/25 hover:border-border"
                    }`}
                    style={isActive ? { borderColor: `${preset.accent}66`, backgroundColor: `${preset.accent}05` } : {}}
                  >
                    {isActive && (
                      <span className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-[#00d4ff]" />
                    )}
                    <span 
                      className={`font-sans text-[10px] sm:text-[10.5px] font-bold transition-colors ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {preset.name}
                    </span>
                    <span className="font-mono text-[7px] text-muted-foreground/75 mt-0.5 uppercase tracking-wider block">
                      {getSubtext(index)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
