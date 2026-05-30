"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  Cpu,
  Layers,
  Shield,
  Check,
  Sliders,
  Bookmark,
  ChevronRight,
  ImageIcon
} from "lucide-react";
import { SITE_CONTAINER } from "@/lib/site-layout";
import type { SiteContent } from "@/backend/site-content/types";
import { LatentCalibrationRig } from "@/components/marketing/LatentCalibrationRig";

// Active engine presets from user screenshot
interface EnginePreset {
  id: string;
  name: string;
  lens: string;
  gap: string;
  iso: string;
  prompt: string;
  image: string;
  resolution: string;
}

const enginePresets: EnginePreset[] = [
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

export function FeaturesPageContent({ content }: { content: SiteContent }) {
  const reduce = useReducedMotion() === true;
  
  // Expose engine presets list from DB if present, else fallback to standard defaults
  const presetsList = (content?.visualizerPresets && content.visualizerPresets.length > 0)
    ? content.visualizerPresets
    : enginePresets;

  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  
  // Resolve active preset dynamically (falls back automatically to index 0 on delete or reset)
  const activePreset = presetsList.find(p => p.id === selectedPresetId) || presetsList[0];

  // Keep type compliance with Next page shell content parameter
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && content) {
      console.log("RUHGEN site content initialized.");
    }
  }, [content]);

  return (
    <div className="relative min-h-screen overflow-x-hidden animate-fade-in" style={{ background: "#050507" }}>
      
      {/* Luxury Ambient Aurora Mesh Overlays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[900px] h-[900px] rounded-full blur-[200px] opacity-[0.14]" style={{ background: "var(--mesh-1)" }} />
        <div className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] rounded-full blur-[180px] opacity-[0.11]" style={{ background: "var(--mesh-2)" }} />
        <div className="absolute bottom-[10%] left-[-15%] w-[800px] h-[800px] rounded-full blur-[220px] opacity-[0.09]" style={{ background: "var(--mesh-3)" }} />
      </div>

      <div className="app-grain absolute inset-0 z-0 pointer-events-none select-none" />

      {/* HERO SECTION: MATCHING SCREENSHOT PRECISELY WITH ANIMATED HUD */}
      <section className="relative pt-32 pb-24 overflow-hidden z-10 border-b border-white/[0.04]">
        <div className={SITE_CONTAINER}>
          
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left: Typographic Display & Description */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col text-left"
            >
              
              <div className="inline-flex self-start items-center gap-2 rounded-full border border-[#00d4ff]/20 bg-[#00d4ff]/5 px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] mb-7 text-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.05)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                NEXT-GEN CREATIVE ENGINE
              </div>

              <h1 className="font-display text-[2.5rem] sm:text-[3.5rem] lg:text-[4.25rem] font-black leading-[1.05] tracking-tight mb-7 text-white">
                Mastering the <br />
                <span className="bg-gradient-to-r from-[#7b61ff] via-[#00d4ff] to-[#ff2e9a] bg-clip-text text-transparent font-black">
                  latent space
                </span> <br />
                with absolute <br />
                control
              </h1>

              <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-neutral-400 font-light mb-9">
                An uncompromising generative workspace engineered specifically for visual creators. Bypass consumer randomness and manage high-fidelity pipelines, raw camera telemetries, and multi-layer studio handoffs.
              </p>

              {/* Action Buttons styled exactly as in the user screenshot */}
              <div className="flex flex-wrap gap-4.5">
                <Link
                  href="/demo"
                  className="inline-flex min-h-[50px] items-center justify-center gap-1.5 rounded-xl bg-[#258eff] px-8 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_4px_30px_rgba(37,142,255,0.35)] transition-all hover:scale-[1.02] hover:bg-[#258eff]/90"
                >
                  Try the Demo
                  <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={3} />
                </Link>
                <a
                  href="#capabilities"
                  className="inline-flex min-h-[50px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-7 text-[11px] font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:text-white hover:border-white/20"
                >
                  Platform Infrastructure
                </a>
              </div>

            </motion.div>

            {/* Right: Interactive Camera Telemetry & Latent Calibration Rig */}
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 relative w-full max-w-[620px] lg:max-w-none mx-auto"
            >
              <LatentCalibrationRig />
            </motion.div>

          </div>

        </div>
      </section>

      {/* CORE FUNCTIONAL CAPABILITIES LIST */}
      <section id="capabilities" className="relative py-24 z-10 bg-[#08080b]/90">
        <div className={SITE_CONTAINER}>
          
          <header className="mb-20 max-w-4xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4 text-[#00d4ff]">
              App Ecosystem Capabilities
            </p>
            <h2 className="font-display text-[2.25rem] sm:text-[3.25rem] font-black tracking-tight text-white mb-5 leading-[1.1]">
              Platform Architecture
            </h2>
            <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-neutral-400 font-light">
              RUHGEN integrates professional generative engines with precision rendering controls to provide clean, controllable creation flows directly inside your browser.
            </p>
          </header>

          {/* Clean 3x2 Grid for Authentic App Features */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            
            {/* Feature 01: Dual Diffusion Engines */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0c0c10]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#7b61ff]/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full blur-[80px] opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity" style={{ background: "#7b61ff" }} />
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-10 w-10 rounded-lg border border-[#7b61ff]/25 flex items-center justify-center bg-[#7b61ff]/5 text-[#7b61ff]">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[8px] font-bold tracking-widest text-[#7b61ff] uppercase">ENGINES</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  Dual Diffusion Pipelines
                </h3>
                <p className="text-xs leading-relaxed text-neutral-400 font-light mb-6">
                  Switch between <strong className="text-white">flux1-dev</strong> for high-fidelity detailed outputs or <strong className="text-white">flux1-schnell</strong> for immediate rendering responses and rapid layout prototyping.
                </p>
              </div>
              <div className="border-t border-white/[0.04] pt-4 flex items-center gap-2 text-[8px] font-mono text-neutral-500">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>FLUX.1 DEV / SCHNELL INTEGRATION</span>
              </div>
            </div>

            {/* Feature 02: Dynamic Bounding Layouts */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0c0c10]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#00d4ff]/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full blur-[80px] opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity" style={{ background: "#00d4ff" }} />
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-10 w-10 rounded-lg border border-[#00d4ff]/25 flex items-center justify-center bg-[#00d4ff]/5 text-[#00d4ff]">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[8px] font-bold tracking-widest text-[#00d4ff] uppercase">CANVAS</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  Dynamic Layout Framing
                </h3>
                <p className="text-xs leading-relaxed text-neutral-400 font-light mb-6">
                  Select and render in multiple canvas bounds including Square (1:1), Cinematic Landscape (16:9), Tall Portrait (9:16), Wide Standard (5:4), and Poster layout dimensions.
                </p>
              </div>
              <div className="border-t border-white/[0.04] pt-4 flex items-center gap-2 text-[8px] font-mono text-neutral-500">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>7 DEFAULT ASPECT RATIO RESOLUTIONS</span>
              </div>
            </div>

            {/* Feature 03: Reference Image Upload */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0c0c10]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#ff2e9a]/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full blur-[80px] opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity" style={{ background: "#ff2e9a" }} />
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-10 w-10 rounded-lg border border-[#ff2e9a]/25 flex items-center justify-center bg-[#ff2e9a]/5 text-[#ff2e9a]">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[8px] font-bold tracking-widest text-[#ff2e9a] uppercase">CONDITIONING</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  Image-to-Image Reference
                </h3>
                <p className="text-xs leading-relaxed text-neutral-400 font-light mb-6">
                  Upload an existing visual directly to anchor your output compositions. Fine-tune latent transformation parameters with fully adjustable Denoise Strength mapping.
                </p>
              </div>
              <div className="border-t border-white/[0.04] pt-4 flex items-center gap-2 text-[8px] font-mono text-neutral-500">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>DYNAMIC DENOISE STRENGTH TUNING</span>
              </div>
            </div>

            {/* Feature 04: Prompt Guidance controls */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0c0c10]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#00d4ff]/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full blur-[80px] opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity" style={{ background: "#00d4ff" }} />
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-10 w-10 rounded-lg border border-[#00d4ff]/25 flex items-center justify-center bg-[#00d4ff]/5 text-[#00d4ff]">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[8px] font-bold tracking-widest text-[#00d4ff] uppercase">AESTHETICS</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  Prompt Intelligence Control
                </h3>
                <p className="text-xs leading-relaxed text-neutral-400 font-light mb-6">
                  Deploy Negative Prompts to systematically suppress undesired artifacts, noise floors, or styling deviations. Adjust Guidance Scale factors to dictate visual compliance levels.
                </p>
              </div>
              <div className="border-t border-white/[0.04] pt-4 flex items-center gap-2 text-[8px] font-mono text-neutral-500">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>GUIDANCE & NEGATIVE CONSTRAINTS</span>
              </div>
            </div>

            {/* Feature 05: Workspace Presets */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0c0c10]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#7b61ff]/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full blur-[80px] opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity" style={{ background: "#7b61ff" }} />
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-10 w-10 rounded-lg border border-[#7b61ff]/25 flex items-center justify-center bg-[#7b61ff]/5 text-[#7b61ff]">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[8px] font-bold tracking-widest text-[#7b61ff] uppercase">WORKSPACE</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  Local Configuration Presets
                </h3>
                <p className="text-xs leading-relaxed text-neutral-400 font-light mb-6">
                  Save your high-performing studio setups (including aspect, render models, and negative settings) directly to local storage to return to successful environments instantly.
                </p>
              </div>
              <div className="border-t border-white/[0.04] pt-4 flex items-center gap-2 text-[8px] font-mono text-neutral-500">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>PERSISTENT LOCAL BINDINGS STORAGE</span>
              </div>
            </div>

            {/* Feature 06: Enterprise Security */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0c0c10]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full blur-[80px] opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity" style={{ background: "#10b981" }} />
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-10 w-10 rounded-lg border border-emerald-500/20 flex items-center justify-center bg-emerald-500/5 text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[8px] font-bold tracking-widest text-emerald-400 uppercase">SECURITY</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  Isolated Compute & Privacy
                </h3>
                <p className="text-xs leading-relaxed text-neutral-400 font-light mb-6">
                  Your prompt coordinates and reference files remain strictly private. Generation queues process through secure nodes ensuring zero data retention and strict isolation from external scraping.
                </p>
              </div>
              <div className="border-t border-white/[0.04] pt-4 flex items-center gap-2 text-[8px] font-mono text-neutral-500">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>SECURE DATA ISOLATION PIPELINES</span>
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
