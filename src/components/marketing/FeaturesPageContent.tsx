"use client";

import { useState, useEffect, useRef } from "react";
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
  ImageIcon,
  Play,
  Sparkles,
  Server,
  Zap,
  Terminal,
  Eye,
  Lock,
  RefreshCcw,
  ArrowRight,
  Maximize2,
  Activity,
  Compass
} from "lucide-react";
import { SITE_CONTAINER } from "@/lib/site-layout";
import type { SiteContent } from "@/backend/site-content/types";

// ==========================================
// SUB-COMPONENT: HERO VISUALIZER (HUD SIMULATION)
// ==========================================
type RenderState = "IDLE" | "PARSING" | "GENERATING" | "FINISHING" | "COMPLETE";

function HeroVisualizer() {
  const [renderState, setRenderState] = useState<RenderState>("IDLE");
  const [progress, setProgress] = useState(0);
  const [activePrompt, setActivePrompt] = useState(
    "cinematic moody sci-fi explorer discovering a glowing neon monolith, 8k, volumetric rays"
  );
  
  const cycleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startSimulation = () => {
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setRenderState("PARSING");
    setProgress(0);

    // Timeline of simulated render passes
    cycleTimeoutRef.current = setTimeout(() => {
      setRenderState("GENERATING");
      
      let currentProgress = 0;
      progressIntervalRef.current = setInterval(() => {
        currentProgress += 4;
        if (currentProgress >= 100) {
          setProgress(100);
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          
          setRenderState("FINISHING");
          cycleTimeoutRef.current = setTimeout(() => {
            setRenderState("COMPLETE");
          }, 800);
        } else {
          setProgress(currentProgress);
        }
      }, 80);

    }, 1000);
  };

  useEffect(() => {
    // Initial run
    startSimulation();

    return () => {
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const getTerminalText = () => {
    switch (renderState) {
      case "IDLE":
        return "AWAITING INGESTION PARAMETERS...";
      case "PARSING":
        return "PARSING CLIP/T5 VECTOR COORDINATES... [OK]";
      case "GENERATING":
        return `SAMPLING LATENT CHANNELS (STEP ${Math.round(progress / 3.3)}/30)...`;
      case "FINISHING":
        return "DECODING VAE SENSOR PLATES... [OK]";
      case "COMPLETE":
        return "RENDER SEQUENCE COMPLETE. HIGH-FIDELITY PACKAGING SUCCESSFUL.";
    }
  };

  return (
    <div className="relative w-full max-w-[620px] mx-auto select-none">
      {/* Ambient background glow linked to engine status */}
      <div 
        className="absolute -inset-6 opacity-20 blur-3xl rounded-[3rem] transition-all duration-1000 pointer-events-none" 
        style={{
          background: renderState === "COMPLETE" 
            ? "radial-gradient(circle, var(--primary-purple) 0%, var(--primary-cyan) 60%, transparent 100%)"
            : "radial-gradient(circle, var(--primary-cyan) 0%, rgba(123, 97, 255, 0.4) 50%, transparent 100%)"
        }}
      />

      {/* High-End Bezel Chassis */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07070a]/90 shadow-[0_32px_80px_rgba(0,0,0,0.85)]">
        
        {/* macOS Title Bar style */}
        <div className="relative z-20 flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-black/45 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/70" />
          </div>
          <span className="text-[8px] font-mono font-bold tracking-[0.25em] text-neutral-400 uppercase">
            RUHGEN // DYNAMIC_CALIBRATION_Rig
          </span>
          <button 
            onClick={startSimulation}
            className="flex items-center gap-1 font-mono text-[7.5px] text-[#00d4ff] px-2 py-0.5 rounded border border-[#00d4ff]/25 bg-[#00d4ff]/5 font-bold uppercase hover:bg-[#00d4ff]/10 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCcw className="w-2 h-2 animate-spin-slow" />
            Re-run
          </button>
        </div>

        {/* Viewport Frame (Cinematic 16:10 aspect ratio) */}
        <div className="relative aspect-[16/10] bg-[#030305] overflow-hidden flex items-center justify-center border-b border-white/[0.04]">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Render States Visualizer */}
          <AnimatePresence mode="wait">
            {renderState === "COMPLETE" ? (
              <motion.div 
                key="img"
                className="absolute inset-0 w-full h-full"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <img 
                  src="/media/features-monolith.png" 
                  alt="Simulated Generation" 
                  className="w-full h-full object-cover opacity-85 saturate-[1.05]"
                />
                {/* Neon digital scan line sweep */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00d4ff]/10 to-transparent w-full h-[30%] -translate-y-full animate-scanline pointer-events-none" />
              </motion.div>
            ) : (
              <motion.div 
                key="loader"
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Dynamic circular radar loader */}
                <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-dashed border-[#7b61ff]/20 animate-spin-slow" />
                  <div className="absolute inset-2 rounded-full border border-[#00d4ff]/10" />
                  
                  {/* Concentric rotating arcs */}
                  <svg className="w-full h-full absolute inset-0 animate-spin" viewBox="0 0 80 80">
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="36" 
                      stroke="url(#radial-loader-grad)" 
                      strokeWidth="1.5" 
                      fill="none" 
                      strokeDasharray="40 180"
                    />
                    <defs>
                      <linearGradient id="radial-loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" />
                        <stop offset="100%" stopColor="#7b61ff" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <Cpu className="w-6 h-6 text-[#00d4ff] animate-pulse" />
                </div>

                <span className="font-mono text-[9px] font-bold text-neutral-400 tracking-widest uppercase">
                  {renderState === "PARSING" ? "Analyzing Prompts..." : `Denoising Latents: ${progress}%`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating UI HUD elements */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1 rounded bg-black/60 border border-white/10 px-2 py-0.5 text-[7px] font-mono font-bold tracking-wider text-white backdrop-blur-sm">
              <span className={`w-1 h-1 rounded-full ${renderState === "COMPLETE" ? "bg-emerald-400 animate-pulse" : "bg-[#00d4ff] animate-ping"}`} />
              {renderState}
            </span>
          </div>

          <div className="absolute top-3 right-3 z-20 font-mono">
            <span className="inline-flex items-center gap-1 rounded bg-[#7b61ff]/10 border border-[#7b61ff]/30 px-2 py-0.5 text-[7px] font-black text-[#7b61ff] backdrop-blur-sm shadow-md">
              FLUX.1 DEV MODEL
            </span>
          </div>

          {/* Bottom Floating prompt overlay */}
          <div className="absolute bottom-3 left-3 right-3 z-20 border border-white/5 bg-black/65 backdrop-blur-md rounded-lg p-2.5 text-left shadow-[0_6px_16px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between font-mono text-[6.5px] text-neutral-500 mb-1">
              <span>LATENT COORDINATES Locking</span>
              <span className="text-neutral-400 font-bold">Guidance: 3.5</span>
            </div>
            <p className="text-[9px] font-mono text-neutral-300 leading-relaxed truncate">
              &ldquo;{activePrompt}&rdquo;
            </p>
          </div>
        </div>

        {/* Console / Terminal readout bar */}
        <div className="p-3 bg-[#050507] border-t border-white/[0.04] flex items-center justify-between font-mono text-[8px]">
          <div className="flex items-center gap-2 text-neutral-400 truncate max-w-[80%]">
            <Terminal className="w-3.5 h-3.5 text-[#7b61ff] shrink-0" />
            <span className="text-neutral-400 select-none">&gt;&gt;</span>
            <span className="text-neutral-300 font-medium truncate">{getTerminalText()}</span>
          </div>
          <span className="text-neutral-500 text-[7px] shrink-0 tracking-wider">
            {renderState === "COMPLETE" ? "TIME: 3.8s" : `PROG: ${progress}%`}
          </span>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: ASPECT FRAMING RIG (SECTION A)
// ==========================================
type AspectRatioKey = "cinema" | "landscape" | "square" | "portrait";

function AspectFramingRig() {
  const [activeAspect, setActiveAspect] = useState<AspectRatioKey>("landscape");
  const [resizing, setResizing] = useState(false);

  const aspects = {
    cinema: { label: "Cinema 21:9", widthClass: "w-full", aspectStyle: "aspect-[21/9]", res: "3840 × 1646 px" },
    landscape: { label: "Landscape 16:9", widthClass: "w-full", aspectStyle: "aspect-[16/9]", res: "3840 × 2160 px" },
    square: { label: "Square 1:1", widthClass: "w-[70%] sm:w-[60%]", aspectStyle: "aspect-[1/1]", res: "2560 × 2560 px" },
    portrait: { label: "Portrait 9:16", widthClass: "w-[50%] sm:w-[42%]", aspectStyle: "aspect-[9/16]", res: "2160 × 3840 px" }
  };

  const handleAspectChange = (key: AspectRatioKey) => {
    if (key === activeAspect) return;
    setResizing(true);
    setActiveAspect(key);
    setTimeout(() => setResizing(false), 600);
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none">
      {/* Aspect selection pills */}
      <div className="flex flex-wrap gap-2.5 border-b border-white/[0.04] pb-4">
        {(Object.keys(aspects) as AspectRatioKey[]).map((key) => {
          const isActive = activeAspect === key;
          return (
            <button
              key={key}
              onClick={() => handleAspectChange(key)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-[#7b61ff] text-white shadow-[0_0_15px_rgba(123,97,255,0.3)] border border-[#7b61ff]/40"
                  : "border border-white/5 bg-white/[0.01] text-neutral-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              {aspects[key].label}
            </button>
          );
        })}
      </div>

      {/* Interactive morphing bounding box viewport */}
      <div className="relative min-h-[360px] flex items-center justify-center bg-black/65 border border-white/5 rounded-2xl p-6 overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:10px_10px]" />
        
        {/* Aspect Frame */}
        <div
          className={`relative transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] mx-auto overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-black ${aspects[activeAspect].widthClass} ${aspects[activeAspect].aspectStyle}`}
        >
          {/* Interactive Visual Overlay Grid (Rule of Thirds) */}
          <div className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300">
            {/* Horizontal gridlines */}
            <div className="absolute top-1/3 left-0 right-0 h-[0.5px] border-t border-dashed border-white/15" />
            <div className="absolute top-2/3 left-0 right-0 h-[0.5px] border-t border-dashed border-white/15" />
            {/* Vertical gridlines */}
            <div className="absolute left-1/3 top-0 bottom-0 w-[0.5px] border-l border-dashed border-white/15" />
            <div className="absolute left-2/3 top-0 bottom-0 w-[0.5px] border-l border-dashed border-white/15" />
            
            {/* Corner Crop Marks */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-white/50" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-white/50" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-white/50" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-white/50" />
          </div>

          {/* High-Fidelity Editorial Visual Asset inside bounding box */}
          <img
            src="/media/features-editorial.png"
            alt="Layout Framing Preview"
            className="w-full h-full object-cover opacity-80"
          />

          {/* Render Stats Badge overlay (fades in) */}
          <div className="absolute bottom-2.5 left-2.5 z-20 font-mono flex flex-col gap-0.5 bg-black/60 border border-white/10 rounded-md p-1.5 backdrop-blur-sm">
            <span className="text-[6.5px] uppercase font-bold text-neutral-400">Layout Bounds</span>
            <span className="text-[9px] font-bold text-white tracking-wide">{aspects[activeAspect].res}</span>
          </div>

          <div className="absolute top-2.5 right-2.5 z-20 font-mono bg-[#00d4ff]/10 border border-[#00d4ff]/30 px-1.5 py-0.5 rounded text-[6.5px] font-bold text-[#00d4ff] backdrop-blur-sm">
            LOCKED
          </div>
        </div>

        {/* Resizing flash state overlay */}
        <AnimatePresence>
          {resizing && (
            <motion.div
              className="absolute inset-0 bg-white/[0.02] border border-[#7b61ff]/15 z-25 pointer-events-none rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="font-mono text-[9px] text-neutral-500 flex justify-between px-1">
        <span>Focal Field Constraint: Fixed</span>
        <span>Resolution Scheduler: Active</span>
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: WORKFLOW TIMELINE (SECTION B)
// ==========================================
interface TimelineStep {
  title: string;
  focus: string;
  desc: string;
  logs: string[];
  metric: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    title: "Latent Ingestion",
    focus: "Prompt Embeddings & Conditioning",
    desc: "RUHGEN processes dual prompt parameters by mapping positive text vectors through T5-XXL and CLIP models to capture absolute semantics, avoiding consumer-level randomness.",
    logs: [
      "[OK] INGESTING NATURAL TEXT COGNITIVE STRING...",
      "[OK] TOKENIZING WITH T5-XXL EMBEDDING ALGORITHMS",
      "[OK] MAPPING CLIP-L LATENT REASONING MATRIX",
      "[OK] GAUSSIAN COVARIANCE NOISE FIELD CONSTRUCTED"
    ],
    metric: "CLIP Text Similarity: 98.4%"
  },
  {
    title: "Neural Denoising",
    focus: "Multi-Pass Flow Matching",
    desc: "Utilize advanced flux1 engines with deep flow matching schedules. Negative prompt coordinates act as physical vectors to repress unwanted distortion, blur, or chroma artifacts.",
    logs: [
      "[RUN] EXECUTING FLUX.1 HIGH-FIDELITY DEEP DENOISING",
      "[RUN] STEP CALIBRATION: DPM-SOLVER MULTIPASS V3 ACTIVE",
      "[OK] NEGATIVE VECTOR DISPLACEMENT FACTOR LOCKED",
      "[OK] CLAMPING DYNAMIC GUIDANCE PROFILE AT 3.5"
    ],
    metric: "30-Step Precision Sampling"
  },
  {
    title: "Fidelity Calibration",
    focus: "Optical Simulation & Depth",
    desc: "Simulate true optical physics within the mathematical engine. Calibrate customized lens properties, focal distances, and virtual apertures to render absolute depth-of-field.",
    logs: [
      "[RUN] CALCULATING APERTURE DEPTH BLUR SCALES (f/1.8)",
      "[RUN] FOCAL COEFFICIENT DEPTH-OF-FIELD CALCULATOR ACTIVE",
      "[OK] GENERATED DEPTH VALUE COEFFICIENT MAPS",
      "[OK] OPTICAL CORRECTION CHROMATIC DISPERSION STABILIZED"
    ],
    metric: "32-Bit Linear HDR Output"
  },
  {
    title: "Studio Handoff",
    focus: "isolated Multi-Pass Pipeline",
    desc: "Export generations with advanced packaging. Deliver isolated multi-pass layouts (RGB, Depth maps, and Normal maps) directly to private storage environments.",
    logs: [
      "[OK] COMPILED MASTER RGB CHROMINANCE PLATE",
      "[OK] PACKAGING COMPLEMENTARY DEPTH & NORMAL CHANNELS",
      "[OK] ISOLATING WORKSPACE DATA; ZERO CLOUD RETENTION POLICY",
      "[OK] ASSET CONSOLE HANDOFF PREPARED: EXR LAYER SUITE"
    ],
    metric: "EXR Layered Package (16-bit)"
  }
];

function WorkflowTimeline() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const activeStep = TIMELINE_STEPS[activeStepIndex];

  return (
    <div className="relative w-full text-left select-none">
      {/* Node Path Headers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {TIMELINE_STEPS.map((step, idx) => {
          const isActive = idx === activeStepIndex;
          return (
            <button
              key={step.title}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden cursor-pointer ${
                isActive
                  ? "border-[#7b61ff]/40 bg-white/[0.02] shadow-xl shadow-[#7b61ff]/5"
                  : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#7b61ff] to-[#00d4ff]" />
              )}
              
              <div className="font-mono text-[9px] text-[#00d4ff] uppercase tracking-wider mb-1">
                STAGE 0{idx + 1}
              </div>
              <h4 className="font-display text-xs sm:text-sm font-bold text-white leading-tight">
                {step.title}
              </h4>
            </button>
          );
        })}
      </div>

      {/* Main stage contents */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* Copy descriptions */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 rounded-2xl border border-white/5 bg-[#09090c]/40">
          <div>
            <div className="inline-block font-mono text-[8px] font-bold text-[#7b61ff] uppercase tracking-[0.2em] mb-3">
              {activeStep.focus}
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-4">
              {activeStep.title} System
            </h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed font-light mb-8">
              {activeStep.desc}
            </p>
          </div>

          <div className="border-t border-white/[0.04] pt-4 flex items-center justify-between font-mono text-[9px]">
            <span className="text-neutral-500">Pipeline Metric:</span>
            <span className="text-white font-bold">{activeStep.metric}</span>
          </div>
        </div>

        {/* Live Terminal logs simulation */}
        <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-black p-5 flex flex-col justify-between font-mono text-[9.5px]">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.04] text-[8px] text-neutral-500 uppercase tracking-widest">
              <span>SYSTEM TRACER // DIAGNOSTIC_LOGGER</span>
              <span className="text-[#00d4ff] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5">
              {activeStep.logs.map((log, index) => {
                const isHighlight = log.startsWith("[RUN]");
                return (
                  <div key={index} className="flex gap-2">
                    <span className="text-neutral-600 select-none">&gt;&gt;</span>
                    <span className={isHighlight ? "text-[#00d4ff]" : "text-neutral-300"}>
                      {log}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 border-t border-white/[0.03] pt-3 text-[7.5px] text-neutral-500 flex justify-between">
            <span>BUFFER_DUMP: CLEAR</span>
            <span>SECURE_HANDOFF: ON</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: RENDERING COMPARISON RIG (SECTION C)
// ==========================================
type ModelType = "schnell" | "dev";

function RenderingComparisonRig() {
  const [activeModel, setActiveModel] = useState<ModelType>("dev");

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-center select-none text-left">
      
      {/* Visual compare screen (left side) */}
      <div className="lg:col-span-6 relative flex flex-col gap-4">
        
        {/* Toggle model switcher pills */}
        <div className="flex gap-2 p-1.5 rounded-xl border border-white/5 bg-[#09090c] self-start">
          <button
            onClick={() => setActiveModel("schnell")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeModel === "schnell"
                ? "bg-white/10 text-white font-black"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            FLUX.1 Schnell (Draft)
          </button>
          <button
            onClick={() => setActiveModel("dev")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeModel === "dev"
                ? "bg-[#7b61ff] text-white font-black shadow-[0_0_12px_rgba(123,97,255,0.25)]"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            FLUX.1 Dev (Cinematic Master)
          </button>
        </div>

        {/* Viewport Box */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl aspect-[4/3] flex items-center justify-center">
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:12px_12px]" />
          
          <AnimatePresence mode="wait">
            {activeModel === "schnell" ? (
              <motion.img
                key="schnell-img"
                src="/media/features-sculpture-raw.png"
                alt="Schnell Draft"
                className="absolute inset-0 w-full h-full object-cover opacity-75 filter saturate-[0.8]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            ) : (
              <motion.img
                key="dev-img"
                src="/media/features-sculpture.png"
                alt="Dev Master"
                className="absolute inset-0 w-full h-full object-cover opacity-85 saturate-[1.1]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </AnimatePresence>

          {/* Zoom scope crosshair overlay */}
          <div className="absolute inset-4 border border-dashed border-white/5 pointer-events-none rounded-xl" />
          
          <div className="absolute top-3.5 left-3.5 z-20">
            <span className="inline-flex items-center gap-1 rounded bg-black/60 border border-white/10 px-2 py-0.5 text-[7px] font-mono tracking-widest text-neutral-300 uppercase">
              {activeModel === "schnell" ? "DRAFT RENDER" : "CINEMATIC MASTER"}
            </span>
          </div>

          <div className="absolute bottom-3.5 right-3.5 z-20 font-mono text-[7px] text-neutral-400 bg-black/60 px-2 py-0.5 rounded border border-white/5">
            {activeModel === "schnell" ? "SAMPLER: STEP 4" : "SAMPLER: STEP 30"}
          </div>
        </div>

      </div>

      {/* Narrative & Specification list (right side) */}
      <div className="lg:col-span-6 flex flex-col justify-center text-left">
        <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Dual-Engine Adaptive Rendering
        </h3>
        <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed mb-6">
          Toggle dynamically between visual models based on your creative stage. Deliver ultra-immediate layout iterations in sub-second draft outputs, then transition instantly to massive master renders optimized for publication.
        </p>

        {/* Spec comparison cards */}
        <div className="space-y-3 font-mono text-[10px]">
          
          {/* Row 1: Render latency */}
          <div className="p-3.5 rounded-xl border border-white/5 bg-[#09090c]/40 flex justify-between items-center">
            <span className="text-neutral-500 uppercase tracking-wider">Rendering Speed</span>
            <div className="flex gap-2">
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${activeModel === "schnell" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-neutral-500 bg-white/[0.02]"}`}>
                Schnell: 0.8s
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${activeModel === "dev" ? "bg-[#7b61ff]/10 text-[#7b61ff] border border-[#7b61ff]/20" : "text-neutral-500 bg-white/[0.02]"}`}>
                Dev Dev: 3.8s
              </span>
            </div>
          </div>

          {/* Row 2: Sampling Pass Steps */}
          <div className="p-3.5 rounded-xl border border-white/5 bg-[#09090c]/40 flex justify-between items-center">
            <span className="text-neutral-500 uppercase tracking-wider">Sampling Iterations</span>
            <div className="flex gap-2">
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${activeModel === "schnell" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-neutral-500 bg-white/[0.02]"}`}>
                Schnell: 4 Steps
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${activeModel === "dev" ? "bg-[#7b61ff]/10 text-[#7b61ff] border border-[#7b61ff]/20" : "text-neutral-500 bg-white/[0.02]"}`}>
                Dev: 30-150 Steps
              </span>
            </div>
          </div>

          {/* Row 3: Handoff Dynamic range */}
          <div className="p-3.5 rounded-xl border border-white/5 bg-[#09090c]/40 flex justify-between items-center">
            <span className="text-neutral-500 uppercase tracking-wider">Dynamic Handoff Depth</span>
            <div className="flex gap-2">
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${activeModel === "schnell" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-neutral-500 bg-white/[0.02]"}`}>
                Standard Web 8-Bit
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${activeModel === "dev" ? "bg-[#7b61ff]/10 text-[#7b61ff] border border-[#7b61ff]/20" : "text-neutral-500 bg-white/[0.02]"}`}>
                Cinematic HDR EXR
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

// ==========================================
// MAIN FEATURES CONTENT WRAPPER
// ==========================================
export function FeaturesPageContent({ content }: { content: SiteContent }) {
  const reduce = useReducedMotion() === true;
  const [coordinateHover, setCoordinateHover] = useState(false);
  const [seedCoords, setSeedCoords] = useState({ x: 0.65, y: 0.42 });

  const handleCoordinateMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setSeedCoords({ x, y });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden animate-fade-in" style={{ background: "#050507" }}>
      
      {/* Luxury Ambient Aurora Mesh Overlay System */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[900px] h-[900px] rounded-full blur-[200px] opacity-[0.14]" style={{ background: "var(--mesh-1)" }} />
        <div className="absolute top-[40%] right-[-10%] w-[700px] h-[700px] rounded-full blur-[180px] opacity-[0.11]" style={{ background: "var(--mesh-2)" }} />
        <div className="absolute bottom-[10%] left-[-15%] w-[800px] h-[800px] rounded-full blur-[220px] opacity-[0.09]" style={{ background: "var(--mesh-3)" }} />
      </div>

      <div className="app-grain absolute inset-0 z-0 pointer-events-none select-none" />

      {/* 1. PREMIUM HERO SECTION */}
      <section className="relative pt-32 pb-24 overflow-hidden z-10 border-b border-white/[0.04]">
        <div className={SITE_CONTAINER}>
          
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Left Column: Typographic Editorial Display */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col text-left"
            >
              
              <div className="inline-flex self-start items-center gap-2 rounded-full border border-[#00d4ff]/20 bg-[#00d4ff]/5 px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] mb-7 text-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.05)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                Next-Gen Generative Suite
              </div>

              <h1 className="font-display text-[2.5rem] sm:text-[3.75rem] lg:text-[4.5rem] font-black leading-[1.05] tracking-tight mb-7 text-white">
                Precision Creative <br />
                <span className="premium-text-shimmer font-black">
                  Intelligence
                </span>
              </h1>

              <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-neutral-400 font-light mb-9">
                An uncompromising generative workspace engineered specifically for visual creators. Bypass consumer randomness and manage high-fidelity pipelines, raw camera telemetries, and multi-layer studio handoffs.
              </p>

              {/* Action Buttons styled precisely as premium indicators */}
              <div className="flex flex-wrap gap-4.5">
                <Link
                  href="/demo"
                  className="btn-gradient inline-flex min-h-[50px] items-center justify-center gap-1.5 rounded-xl bg-[#258eff] px-8 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_4px_30px_rgba(37,142,255,0.35)] transition-all hover:scale-[1.02] hover:bg-[#258eff]/90 cursor-pointer"
                >
                  Try the Demo
                  <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={3} />
                </Link>
                <a
                  href="#capabilities"
                  className="inline-flex min-h-[50px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-7 text-[11px] font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:text-white hover:border-white/20 cursor-pointer"
                >
                  Features Narrative
                </a>
              </div>

            </motion.div>

            {/* Right Column: Premium Animated HUD Preview Mockup */}
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 w-full"
            >
              <HeroVisualizer />
            </motion.div>

          </div>

        </div>
      </section>

      {/* 2. FEATURE NARRATIVE SECTIONS */}
      <section id="capabilities" className="relative py-24 z-10 border-b border-white/[0.04]">
        <div className={SITE_CONTAINER}>
          
          {/* SECTION A — Creative Control */}
          <div className="mb-32">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              
              <div className="lg:col-span-5 text-left">
                <div className="font-mono text-[9px] font-bold text-[#7b61ff] uppercase tracking-[0.25em] mb-4">
                  01 // COMPOSITION CALIBRATION
                </div>
                <h2 className="font-display text-[2rem] sm:text-[3rem] font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                  Absolute Creative Control.
                </h2>
                <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed mb-6">
                  Design layouts without compromise. Select custom dimensions and bounding frames that adjust immediately. Anchor compositions with multi-aspect ratios, adjusting denoise strength parameters to retain flawless layout precision.
                </p>

                <ul className="space-y-3 font-mono text-[10px] text-neutral-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00d4ff]" />
                    <span>Dynamic Layout Framing (7 Default Aspects)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00d4ff]" />
                    <span>Adjustable Denoise Strength mapping</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00d4ff]" />
                    <span>CLIP-guided prompt structural constraints</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-7">
                <AspectFramingRig />
              </div>

            </div>
          </div>

          {/* SECTION B — Workflow & Automation */}
          <div className="mb-32 border-t border-white/[0.04] pt-24">
            <div className="max-w-3xl text-left mb-16">
              <div className="font-mono text-[9px] font-bold text-[#00d4ff] uppercase tracking-[0.25em] mb-4">
                02 // PIPELINE ENHANCEMENT
              </div>
              <h2 className="font-display text-[2rem] sm:text-[3rem] font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                Seamless Studio Automation.
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed">
                Connect generative capabilities to actual delivery pipelines. Step through multi-pass flows, review automated diagnostic parameters, and coordinate final rendering handoffs flawlessly in real time.
              </p>
            </div>

            <WorkflowTimeline />
          </div>

          {/* SECTION C — Precision Rendering System */}
          <div className="mb-24 border-t border-white/[0.04] pt-24">
            <div className="max-w-3xl text-left mb-16">
              <div className="font-mono text-[9px] font-bold text-[#ff2e9a] uppercase tracking-[0.25em] mb-4">
                03 // RENDER INFRASTRUCTURE
              </div>
              <h2 className="font-display text-[2rem] sm:text-[3rem] font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                Precision Rendering Pipeline.
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed">
                Experience zero rendering degradation. Toggle between instant prototyping and cinematic resolution sweeps designed specifically to maintain professional detail and strict composition fidelity.
              </p>
            </div>

            <RenderingComparisonRig />
          </div>

        </div>
      </section>

      {/* 3. PREMIUM BENTO SHOWCASE SECTION */}
      <section className="relative py-24 z-10 border-b border-white/[0.04] bg-[#07070a]/40">
        <div className={SITE_CONTAINER}>
          
          <header className="mb-16 text-left max-w-2xl">
            <p className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] mb-4 text-[#7b61ff]">
              04 // STUDIO COMPILER EXTENSIONS
            </p>
            <h2 className="font-display text-[2rem] sm:text-[3rem] font-extrabold tracking-tight text-white mb-5 leading-[1.1]">
              Advanced Bento Toolkit
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed">
              Explore secondary precision layers developed specifically to deliver robust consistency and deep workflow alignment.
            </p>
          </header>

          {/* Bento Grid layout */}
          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            
            {/* Card 1: Seed Coordinate Lock (Double column) */}
            <div 
              onMouseMove={handleCoordinateMove}
              onMouseEnter={() => setCoordinateHover(true)}
              onMouseLeave={() => setCoordinateHover(false)}
              className="md:col-span-2 rounded-2xl border border-white/[0.05] bg-[#0c0c10]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#7b61ff]/25 transition-all duration-300"
            >
              <div 
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 60% 50% at 50% 50%, var(--primary-purple) 0%, transparent 100%)"
                }}
              />
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-9 w-9 rounded-lg border border-[#7b61ff]/25 flex items-center justify-center bg-[#7b61ff]/5 text-[#7b61ff]">
                    <Compass className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-mono text-[7px] font-bold tracking-widest text-[#7b61ff] uppercase">
                    SAMPLER LOCK
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  Deterministic Latent Coordinates
                </h3>
                <p className="text-neutral-400 text-xs font-light leading-relaxed max-w-lg mb-6">
                  Secure consistent aesthetic fields. Locking generative seeds allows granular navigation within vector dimensions. Drag or hover the grid to lock localized seed telemetry coordinates.
                </p>
              </div>

              {/* Dynamic Coordinate box inside card */}
              <div className="relative h-28 w-full border border-white/5 bg-black/45 rounded-xl overflow-hidden cursor-crosshair flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1.5px,transparent_1.5px)] bg-[size:10px_10px]" />
                
                {/* Crosshairs */}
                <div 
                  className="absolute left-0 right-0 h-[0.5px] border-t border-dashed border-white/10"
                  style={{ top: `${seedCoords.y * 100}%` }}
                />
                <div 
                  className="absolute top-0 bottom-0 w-[0.5px] border-l border-dashed border-white/10"
                  style={{ left: `${seedCoords.x * 100}%` }}
                />

                <div 
                  className="absolute w-3.5 h-3.5 rounded-full border flex items-center justify-center pointer-events-none transition-all duration-75"
                  style={{
                    left: `calc(${seedCoords.x * 100}% - 7px)`,
                    top: `calc(${seedCoords.y * 100}% - 7px)`,
                    borderColor: "var(--primary-purple)",
                    boxShadow: "0 0 10px var(--primary-purple)",
                    background: "rgba(123, 97, 255, 0.15)"
                  }}
                >
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>

                <div className="absolute bottom-2 left-2 font-mono text-[6.5px] text-neutral-500 bg-black/80 px-1.5 py-0.5 rounded border border-white/5">
                  X: {seedCoords.x.toFixed(3)} Y: {seedCoords.y.toFixed(3)}
                </div>
              </div>
            </div>

            {/* Card 2: Configuration Presets */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0c0c10]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#00d4ff]/25 transition-all duration-300">
              <div 
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 60% 50% at 50% 50%, var(--primary-cyan) 0%, transparent 100%)"
                }}
              />
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-9 w-9 rounded-lg border border-[#00d4ff]/25 flex items-center justify-center bg-[#00d4ff]/5 text-[#00d4ff]">
                    <Bookmark className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-mono text-[7px] font-bold tracking-widest text-[#00d4ff] uppercase">
                    WORKSPACE
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  Persistent Local Presets
                </h3>
                <p className="text-neutral-400 text-xs font-light leading-relaxed mb-6">
                  Save localized layout boundaries and guidance thresholds directly to secure browser cookies for immediate restoration.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 font-mono text-[8px] text-neutral-400">
                <div className="p-2 border border-white/5 bg-black/35 rounded-lg flex justify-between items-center">
                  <span>Cinematic Noir Preset</span>
                  <span className="text-[#00d4ff]">f/1.2 Locked</span>
                </div>
                <div className="p-2 border border-white/5 bg-black/35 rounded-lg flex justify-between items-center">
                  <span>Neoclassical Studio</span>
                  <span className="text-neutral-500">135mm</span>
                </div>
              </div>
            </div>

            {/* Card 3: Multi-Pass Layer suite */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0c0c10]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#ff2e9a]/25 transition-all duration-300">
              <div 
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 60% 50% at 50% 50%, var(--accent-pink) 0%, transparent 100%)"
                }}
              />
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-9 w-9 rounded-lg border border-[#ff2e9a]/25 flex items-center justify-center bg-[#ff2e9a]/5 text-[#ff2e9a]">
                    <Layers className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-mono text-[7px] font-bold tracking-widest text-[#ff2e9a] uppercase">
                    EXPORTS
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  Layered Composites
                </h3>
                <p className="text-neutral-400 text-xs font-light leading-relaxed mb-6">
                  Export robust asset layers. Access isolated RGB plates, depth passes, and normal grids inside single packaged files.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 font-mono text-[8px] text-center">
                <span className="py-1 border border-white/5 bg-black/35 rounded text-white font-bold">RGB</span>
                <span className="py-1 border border-[#00d4ff]/20 bg-[#00d4ff]/5 rounded text-[#00d4ff] font-bold">DEPTH</span>
                <span className="py-1 border border-[#7b61ff]/20 bg-[#7b61ff]/5 rounded text-[#7b61ff] font-bold">NORMAL</span>
              </div>
            </div>

            {/* Card 4: Isolated Cloud Compute (Double Column) */}
            <div className="md:col-span-2 rounded-2xl border border-white/[0.05] bg-[#0c0c10]/40 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/25 transition-all duration-300">
              <div 
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 60% 50% at 50% 50%, #10b981 0%, transparent 100%)"
                }}
              />
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="h-9 w-9 rounded-lg border border-emerald-500/20 flex items-center justify-center bg-emerald-500/5 text-emerald-400">
                    <Server className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-mono text-[7px] font-bold tracking-widest text-emerald-400 uppercase">
                    ENTERPRISE SECURITY
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  Isolated Compute Infrastructures
                </h3>
                <p className="text-neutral-400 text-xs font-light leading-relaxed max-w-lg mb-6">
                  Protect proprietary graphics assets. Your generative inputs remain completely isolated from public databases, executing exclusively within private GPU nodes with zero retention.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-[8px] text-neutral-400">
                <div className="p-2 border border-white/5 bg-black/35 rounded-lg flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Frankfurt Edge 04
                  </span>
                  <span className="text-neutral-500">28ms Latency</span>
                </div>
                <div className="p-2 border border-white/5 bg-black/35 rounded-lg flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Seoul Edge 09
                  </span>
                  <span className="text-neutral-500">14ms Latency</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. PRIVATE & TRUST INFRASTRUCTURE SECTION (SECTION D) */}
      <section className="relative py-24 z-10 border-b border-white/[0.04]">
        <div className={SITE_CONTAINER}>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            <div className="lg:col-span-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-4.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.2em] mb-7 text-emerald-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Retention Compute Policy
              </div>
              <h2 className="font-display text-[2rem] sm:text-[3rem] font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                Isolated Creative Ownership
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed mb-6">
                Your prompts, model configurations, and reference visual files remain exclusively yours. RUHGEN bypasses global cloud retention, routing generations to secure compute caches that delete assets instantly upon client package receipt.
              </p>

              <div className="grid gap-4.5 sm:grid-cols-2 font-mono text-[9.5px] text-neutral-300">
                <div className="p-4 border border-white/5 bg-white/[0.01] rounded-xl">
                  <Lock className="w-4 h-4 text-emerald-400 mb-2" />
                  <span className="block font-bold text-white mb-1">Encrypted Channels</span>
                  <span className="text-neutral-500 leading-relaxed font-light">TLS 1.3 vector streams with absolute key confinement.</span>
                </div>
                <div className="p-4 border border-white/5 bg-white/[0.01] rounded-xl">
                  <Eye className="w-4 h-4 text-emerald-400 mb-2" />
                  <span className="block font-bold text-white mb-1">No Model Scraping</span>
                  <span className="text-neutral-500 leading-relaxed font-light">Complete legal exemption from public database scraping schedules.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              {/* Graphical Security matrix */}
              <div className="relative rounded-2xl border border-white/[0.08] p-6 sm:p-8 bg-[#09090c]/40 backdrop-blur-md overflow-hidden max-w-[500px] mx-auto">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:14px_14px]" />
                
                <div className="relative z-10 flex items-center justify-between pb-4 mb-4 border-b border-white/[0.04]">
                  <span className="font-mono text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                    SECURITY MATRIX MONITOR
                  </span>
                  <span className="inline-flex items-center gap-1 text-[7.5px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    ENCRYPTED
                  </span>
                </div>

                <div className="space-y-3.5 font-mono text-[9px] text-neutral-400 text-left">
                  <div className="flex justify-between items-center p-2.5 border border-white/5 bg-black/40 rounded-lg">
                    <span>Active Security Protocol</span>
                    <span className="text-white font-bold">AES-256-GCM</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 border border-white/5 bg-black/40 rounded-lg">
                    <span>Isolated Data Retention</span>
                    <span className="text-emerald-400 font-bold">0 Seconds</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 border border-white/5 bg-black/40 rounded-lg">
                    <span>Pipeline Key Integrity</span>
                    <span className="text-white font-bold">SHA-512 Signed</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 border border-white/5 bg-black/40 rounded-lg">
                    <span>GPU Compute Exemption</span>
                    <span className="text-[#00d4ff] font-bold">Verified</span>
                  </div>
                </div>

                {/* Secure network pulse visual */}
                <div className="mt-5 h-1.5 w-full rounded-full overflow-hidden bg-white/5 relative">
                  <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-[#00d4ff] w-full animate-progress" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. PREMIUM CTA SECTION */}
      <section className="relative py-32 z-10 overflow-hidden">
        
        {/* Massive backdrop gradient */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ background: "radial-gradient(circle at 50% 50%, rgba(123, 97, 255, 0.08) 0%, transparent 65%)" }} />

        <div className={SITE_CONTAINER}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] p-8 sm:p-16 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(0, 212, 255, 0.04), rgba(123, 97, 255, 0.05), rgba(255, 46, 154, 0.03))",
              backdropFilter: "blur(24px) saturate(180%)",
              boxShadow: "0 32px 80px -24px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)"
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: "radial-gradient(ellipse 70% 60% at 100% 0%, rgba(0,212,255,0.3), transparent 55%), radial-gradient(ellipse 50% 50% at 0% 100%, rgba(123,97,255,0.2), transparent 50%)" }} />

            <div className="relative max-w-3xl mx-auto flex flex-col items-center">
              
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#7b61ff]/20 bg-[#7b61ff]/5 px-4.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] mb-7 text-[#7b61ff] shadow-[0_0_15px_rgba(123,97,255,0.05)]">
                <Sparkles className="w-3.5 h-3.5 text-[#7b61ff]" />
                Command the Latent Space
              </div>

              <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-7 text-white">
                Command the Latent Space <br />
                with Absolute Precision.
              </h2>
              
              <p className="max-w-xl text-neutral-400 text-xs sm:text-sm font-light leading-relaxed mb-9">
                Stop accepting randomness. Step up to an elite creative workspace engineered for professionals who require raw control and flawless dynamic fidelity.
              </p>

              <div className="flex flex-col sm:flex-row gap-4.5 justify-center w-full max-w-md">
                <Link
                  href="/sign-up"
                  className="btn-gradient inline-flex min-h-[50px] items-center justify-center gap-1.5 rounded-xl bg-[#258eff] px-8 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_4px_30px_rgba(37,142,255,0.35)] transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Start Creating Free
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
                
                <Link
                  href="/contact"
                  className="inline-flex min-h-[50px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-7 text-[11px] font-bold uppercase tracking-wider text-neutral-300 transition-colors hover:text-white hover:border-white/20 cursor-pointer"
                >
                  Talk to a Specialist
                </Link>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
