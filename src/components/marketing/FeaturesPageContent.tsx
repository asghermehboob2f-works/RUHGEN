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
  Compass,
  FileText,
  SlidersHorizontal,
  Settings,
  Tv,
  EyeOff,
  Disc,
  Radio,
  FileCode,
  Gauge
} from "lucide-react";
import { SITE_CONTAINER } from "@/lib/site-layout";
import type { SiteContent, FeaturesCalibrationConfig } from "@/backend/site-content/types";

// ==========================================
// UTILITY: LATTICE NOISE GRADIENT OVERLAY
// ==========================================
function PremiumBackgroundLattice() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dynamic Radial Mesh Glows */}
      <div className="absolute top-0 left-1/4 w-[1000px] h-[1000px] rounded-full blur-[240px] opacity-[0.15]" style={{ background: "radial-gradient(circle, var(--mesh-1) 0%, transparent 80%)" }} />
      <div className="absolute top-[35%] right-[-10%] w-[900px] h-[900px] rounded-full blur-[200px] opacity-[0.12]" style={{ background: "radial-gradient(circle, var(--mesh-2) 0%, transparent 80%)" }} />
      <div className="absolute bottom-[5%] left-[-15%] w-[900px] h-[900px] rounded-full blur-[260px] opacity-[0.1]" style={{ background: "radial-gradient(circle, var(--mesh-3) 0%, transparent 80%)" }} />
      {/* High-End Technical Crosshair Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(var(--border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--border-subtle)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_40%,transparent_100%)]" />
    </div>
  );
}



// ==========================================
// SUB-COMPONENT: CALIBRATION VIEWPORT (SECTION A WITH DYNAMIC TILTING 3D VECTOR CUBE & DYNAMIC PHOTO CALIBRATION)
// ==========================================
type AspectRatioKey = "cinema" | "landscape" | "square" | "portrait";

function AspectCalibrationRig({ featuresCalibration }: { featuresCalibration?: FeaturesCalibrationConfig }) {
  const [activeAspect, setActiveAspect] = useState<AspectRatioKey>("landscape");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Elite, high-end photographic presets from Unsplash for realistic camera calibrating
  const defaultImages = {
    cinema: featuresCalibration?.cinema || "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1200", // Anamorphic cyberpunk street
    landscape: featuresCalibration?.landscape || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200", // Luxury minimal architecture
    square: featuresCalibration?.square || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800", // Chiascuro marble sculpture
    portrait: featuresCalibration?.portrait || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800" // Premium studio editorial fashion
  };

  const aspects = {
    cinema: { label: "Cinema 21:9", widthClass: "w-full", aspectStyle: "aspect-[21/9]", res: "3840 × 1646 px" },
    landscape: { label: "Landscape 16:9", widthClass: "w-full", aspectStyle: "aspect-[16/9]", res: "3840 × 2160 px" },
    square: { label: "Square 1:1", widthClass: "w-[70%] sm:w-[60%]", aspectStyle: "aspect-[1/1]", res: "2560 × 2560 px" },
    portrait: { label: "Portrait 9:16", widthClass: "w-[50%] sm:w-[42%]", aspectStyle: "aspect-[9/16]", res: "2160 × 3840 px" }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const activeImage = defaultImages[activeAspect];

  return (
    <div className="w-full flex flex-col gap-6 select-none text-left">
      {/* Aspect selection pills */}
      <div className="flex flex-wrap gap-2 border-b border-border/50 pb-4">
        {(Object.keys(aspects) as AspectRatioKey[]).map((key) => {
          const isActive = activeAspect === key;
          return (
            <button
              key={key}
              onClick={() => setActiveAspect(key)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-[#7b61ff] text-white shadow-[0_0_15px_rgba(123,97,255,0.3)] border border-[#7b61ff]/40"
                  : "border border-border bg-card/10 text-muted-foreground hover:text-foreground hover:bg-card/25"
              }`}
            >
              {aspects[key].label}
            </button>
          );
        })}
      </div>

      {/* Viewing chassis containing the 3D-tilting image */}
      <div 
        ref={viewportRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative min-h-[380px] flex items-center justify-center bg-card/10 border border-border/50 rounded-2xl p-8 overflow-hidden shadow-inner cursor-crosshair"
      >
        <div className="absolute inset-0 opacity-[0.012] bg-[linear-gradient(var(--text-primary)_1px,transparent_1px),linear-gradient(90deg,var(--text-primary)_1px,transparent_1px)] bg-[size:12px_12px]" />

        {/* Morphing Aspect Frame Chassis */}
        <div
          className={`relative transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] mx-auto overflow-hidden rounded-xl border border-border/80 shadow-2xl bg-card flex items-center justify-center ${aspects[activeAspect].widthClass} ${aspects[activeAspect].aspectStyle}`}
          style={{
            perspective: "800px"
          }}
        >
          {/* Dynamic Tilting Core - pure responsive Image that tilts in 3D */}
          <div 
            className="w-full h-full absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
            style={{
              transform: `rotateX(${mousePos.y * -20}deg) rotateY(${mousePos.x * 20}deg) translateZ(10px)`
            }}
          >
            {/* Dynamic calibration photo background */}
            <img 
              src={activeImage}
              alt="Calibrating Viewport"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-all duration-500"
            />

            {/* Dynamic Glass Reflection overlay for hyper-luxury sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--text-primary)]/5 via-transparent to-[var(--text-primary)]/[0.08] pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 bg-card/10 pointer-events-none mix-blend-multiply" />

            {/* Rule of Thirds camera grid lines */}
            <div className="absolute inset-0 z-10 pointer-events-none opacity-25">
              <div className="absolute top-1/3 left-0 right-0 h-[0.5px] border-t border-dashed border-[var(--text-primary)]/30" />
              <div className="absolute top-2/3 left-0 right-0 h-[0.5px] border-t border-dashed border-[var(--text-primary)]/30" />
              <div className="absolute left-1/3 top-0 bottom-0 w-[0.5px] border-l border-dashed border-[var(--text-primary)]/30" />
              <div className="absolute left-2/3 top-0 bottom-0 w-[0.5px] border-l border-dashed border-[var(--text-primary)]/30" />
            </div>

            {/* Corner Crop Marks */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[var(--text-primary)]/30 z-10" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-[var(--text-primary)]/30 z-10" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-[var(--text-primary)]/30 z-10" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[var(--text-primary)]/30 z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
interface TimelineStep {
  title: string;
  focus: string;
  desc: string;
  logs: string[];
  metric: string;
}

const HIGHEND_TIMELINE: TimelineStep[] = [
  {
    title: "Latent Ingestion",
    focus: "CLIP Text Conditioning",
    desc: "RUHGEN bypasses global prompt noise. Positive strings translate through CLIP-ViT and T5-XXL token encoders, ensuring semantic mapping matches target layouts with 99.4% precision.",
    logs: [
      "[SYS] CONSTRUCTING SEMANTIC TOKEN PARSING PIPELINE",
      "[SYS] PARSING ENCODERS: T5-XXL MULTI-CHANNEL VECTORS",
      "[OK] STOCHASTIC CONDITIONING PROFILE LOCKED",
      "[OK] HIGH-FIDELITY LATENT TENSOR INITIALIZED"
    ],
    metric: "CLIP Alignment: 99.4%"
  },
  {
    title: "Neural Sampling",
    focus: "Flow Matching Schedule",
    desc: "Execute customized multi-pass schedules leveraging state-of-the-art flow matching architectures. Guide latent arrays through advanced steps across all premium generative models, stabilizing visual clarity and removing artifact degradation.",
    logs: [
      "[RUN] INITIALIZING STOCHASTIC DENOISING CONVOLUTION",
      "[RUN] SAMPLER STATE: FLOW-MATCHING DPM MULTIPASS V4",
      "[OK] VECTOR EXCURSION COMPENSATOR ENGAGED",
      "[OK] STABILIZING CHROMA DISTRIBUTION MATRIX"
    ],
    metric: "Flow Match Precision V4"
  },
  {
    title: "Fidelity Calibration",
    focus: "Optical Depth Synthesis",
    desc: "Breathe life into mathematical environments. The engine runs focal blur vectors, virtual depth algorithms, and physical lens refraction mapping directly into generative steps.",
    logs: [
      "[RUN] INJECTING DEPTH COVARIANCE BLUR COEFFICIENT",
      "[RUN] SIMULATING LENS REFRACTION SCALE f/1.4",
      "[OK] CHROMATIC DISPERSION CALIBRATION COMPLETE",
      "[OK] OPTICAL APERTURE DEPTH COMPOSITED SUCCESSFULLY"
    ],
    metric: "32-Bit Linear RGB Render"
  },
  {
    title: "Layered Handoff",
    focus: "Multi-Pass EXR Packages",
    desc: "Prepare assets for professional post-production. Generations pack automatically into multi-channel files containing separate RGB plates, depth passes, and normal coordinates.",
    logs: [
      "[OK] PACKAGING COMPLEMENTARY DEPTH ENCODINGS",
      "[OK] GENERATING ISOLATED SHADING NORMAL MAPS",
      "[OK] DATA RETENTION ZERO POLICY EXECUTION",
      "[OK] READY TO TRANSFER SECURED STUDIO EXR BUNDLE"
    ],
    metric: "EXR Layered Package (16-bit)"
  }
];

function InteractivePipelineTimeline() {
  const [activeStep, setActiveStep] = useState(0);
  const step = HIGHEND_TIMELINE[activeStep];

  return (
    <div className="relative w-full text-left select-none">
      {/* Node Path Header Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {HIGHEND_TIMELINE.map((node, idx) => {
          const isActive = idx === activeStep;
          return (
            <button
              key={node.title}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden cursor-pointer ${
                isActive
                  ? "border-[#7b61ff]/40 bg-card/10 shadow-xl shadow-[#7b61ff]/5"
                  : "border-border/50 bg-card/5 hover:border-border hover:bg-card/15"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#7b61ff] to-[#ff2e9a]" />
              )}
              
              <div className="font-mono text-[8px] text-[#00d4ff] uppercase tracking-wider mb-1">
                STAGE 0{idx + 1}
              </div>
              <h4 className="font-display text-xs font-bold text-foreground tracking-tight leading-tight">
                {node.title}
              </h4>
            </button>
          );
        })}
      </div>

      {/* Details Box */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* Left Copy Panel */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 rounded-2xl border border-border/50 bg-card/30">
          <div>
            <div className="inline-block font-mono text-[8px] font-bold text-[#ff2e9a] uppercase tracking-[0.2em] mb-3">
              {step.focus}
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-foreground tracking-tight mb-4">
              {step.title} System
            </h3>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed font-light mb-8">
              {step.desc}
            </p>
          </div>

          <div className="border-t border-border/50 pt-4 flex items-center justify-between font-mono text-[9px]">
            <span className="text-neutral-500">Telemetry Rating:</span>
            <span className="text-foreground font-bold">{step.metric}</span>
          </div>
        </div>

        {/* Right Live Console log reader */}
        <div className="lg:col-span-5 rounded-2xl border border-border/50 bg-card p-5 flex flex-col justify-between font-mono text-[9.5px]">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50 text-[8px] text-neutral-500 uppercase tracking-widest">
              <span>SYSTEM TRACER // DIAGNOSTIC_LOGGER</span>
              <span className="text-[#00d4ff] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5">
              {step.logs.map((log, index) => {
                const isHighlight = log.startsWith("[RUN]");
                return (
                  <div key={index} className="flex gap-2">
                    <span className="text-neutral-600 select-none">&gt;&gt;</span>
                    <span className={isHighlight ? "text-[#00d4ff]" : "text-foreground/80"}>
                      {log}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 border-t border-border/40 pt-3 text-[7px] text-neutral-500 flex justify-between">
            <span>BUFFER_DUMP: CLASSIFIED</span>
            <span>ENCRYPTED_FLOW: ACTIVE</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: DUAL RENDER COMPARISON (INTERACTIVE SPLIT-SCREEN SCANNING CANVAS)
// ==========================================
function InteractiveSplitScanRig() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sliderX, setSliderX] = useState(250);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let rotation = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
    };

    resize();
    const timeout = setTimeout(resize, 100);

    const draw = () => {
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      ctx.clearRect(0, 0, w, h);

      rotation += 0.003; // Ultra slow, classic, aesthetic rotation sweep

      // Draw aesthetic background linear gradient glows
      const glowOpacityMultiplier = isHovered ? 1.8 : 1.0;
      
      // Left side glow (Schnell Cyan)
      const leftBg = ctx.createLinearGradient(0, 0, sliderX, 0);
      leftBg.addColorStop(0, `rgba(0, 212, 255, ${0.03 * glowOpacityMultiplier})`);
      leftBg.addColorStop(1, "rgba(0, 212, 255, 0)");
      ctx.fillStyle = leftBg;
      ctx.fillRect(0, 0, sliderX, h);

      // Right side glow (Cinematic Purple)
      const rightBg = ctx.createLinearGradient(sliderX, 0, w, 0);
      rightBg.addColorStop(0, "rgba(123, 97, 255, 0)");
      rightBg.addColorStop(1, `rgba(123, 97, 255, ${0.05 * glowOpacityMultiplier})`);
      ctx.fillStyle = rightBg;
      ctx.fillRect(sliderX, 0, w - sliderX, h);

      // Draw Draft Wireframe Mesh on the LEFT side of the cursor
      // Draw High-Fidelity Poly Mesh on the RIGHT side of the cursor
      
      const drawMesh = (cols: number, rows: number, color: string, isDraft: boolean, minX: number, maxX: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(minX, 0, maxX - minX, h);
        ctx.clip();

        const spacingX = w / (cols + 1);
        const spacingY = h / (rows + 1);

        ctx.lineWidth = isDraft ? 0.75 : 0.45;
        ctx.strokeStyle = color;

        // Smooth infinite coordinate drift offset
        const driftSpeed = isDraft ? 12 : 18;
        const offsetX = (rotation * driftSpeed) % spacingX;
        const offsetY = (rotation * (driftSpeed * 0.6)) % spacingY;

        // Draw perfect straight column lines with seamless drifting
        for (let c = -1; c <= cols + 2; c++) {
          const xPos = spacingX * c + offsetX;
          ctx.beginPath();
          ctx.moveTo(xPos, 0);
          ctx.lineTo(xPos, h);
          ctx.stroke();
        }

        // Draw perfect straight row lines with seamless drifting
        for (let r = -1; r <= rows + 2; r++) {
          const yPos = spacingY * r + offsetY;
          ctx.beginPath();
          ctx.moveTo(0, yPos);
          ctx.lineTo(w, yPos);
          ctx.stroke();
        }

        ctx.restore();
      };

      // Draw Left: Stochastic Draft Grid (coarser spacing)
      drawMesh(14, 14, "rgba(0, 212, 255, 0.22)", true, 0, sliderX);

      // Draw Right: Cinematic Master Grid (high-density fine matrix)
      drawMesh(34, 34, "rgba(123, 97, 255, 0.45)", false, sliderX, w);

      // Draw splitting slider line
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(sliderX, 0);
      ctx.lineTo(sliderX, h);
      ctx.stroke();

      // Laser glowing handle dots
      ctx.fillStyle = "#ff2e9a";
      ctx.beginPath();
      ctx.arc(sliderX, h / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sliderX, h / 2, 7, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animId);
    };
  }, [sliderX]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setSliderX(x);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-center select-none text-left">
      {/* Visual compare split screen canvas */}
      <div className="lg:col-span-6 relative flex flex-col gap-4">
        
        {/* Toggle details indicators */}
        <div className="flex justify-between items-center text-[7.5px] font-mono text-neutral-400 px-1">
          <span className="text-[#00d4ff] font-bold">◂ STOCHASTIC DRAFT ENGINE (8-BIT)</span>
          <span className="text-[#7b61ff] font-bold">CINEMATIC MASTER MATRIX (EXR) ▸</span>
        </div>

        {/* Viewport Box */}
        <div 
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl aspect-[16/10] flex items-center justify-center cursor-ew-resize"
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          
          <div className="absolute inset-4 border border-dashed border-border/50 pointer-events-none rounded-xl" />

          {/* Interactive instruction tooltip */}
          {!isHovered && (
            <div className="absolute bg-card/90 border border-border rounded-xl px-4 py-2 text-center z-20 backdrop-blur-md animate-pulse">
              <span className="font-mono text-[9px] font-bold text-foreground tracking-widest uppercase">
                Drag Mouse To Compare Renders
              </span>
            </div>
          )}
          
          <div className="absolute top-4 left-4 z-20 font-mono">
            <span className="inline-flex items-center gap-1 rounded bg-card/75 border border-border px-2 py-0.5 text-[6.5px] font-black text-[#00d4ff] backdrop-blur-sm shadow-md">
              DRAFT: STEP 4
            </span>
          </div>

          <div className="absolute top-4 right-4 z-20 font-mono">
            <span className="inline-flex items-center gap-1 rounded bg-card/75 border border-border px-2 py-0.5 text-[6.5px] font-black text-[#7b61ff] backdrop-blur-sm shadow-md">
              MASTER: STEP 30
            </span>
          </div>
        </div>

      </div>

      {/* Narrative & Specification list */}
      <div className="lg:col-span-6 flex flex-col justify-center text-left">
        <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
          Adaptive Synthesis Engines
        </h3>
        <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed mb-6">
          Connect your workspace directly to dual-stage engines. Execute lightning-fast visual drafting using the 4-step draft compiler, then wipe seamlessly to cinematic-level mathematical modeling sweeps for absolute professional delivery.
        </p>

        {/* Spec comparison cards */}
        <div className="space-y-3 font-mono text-[9.5px]">
          
          <div className="p-3.5 rounded-xl border border-border/50 bg-card/20 flex justify-between items-center">
            <span className="text-neutral-500 uppercase tracking-wider">Engine Processing Time</span>
            <div className="flex gap-2">
              <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">
                Draft: 0.8s
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-[#7b61ff]/10 text-[#7b61ff] border border-[#7b61ff]/20">
                Master: 2.1s
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/50 bg-card/20 flex justify-between items-center">
            <span className="text-neutral-500 uppercase tracking-wider">Lattice Nodes Density</span>
            <div className="flex gap-2">
              <span className="text-[9px] px-2 py-0.5 rounded font-bold text-neutral-500 bg-card/10">
                12 × 12 Grid
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded font-bold text-foreground bg-card/20">
                36 × 36 Dense Grid
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/50 bg-card/20 flex justify-between items-center">
            <span className="text-neutral-500 uppercase tracking-wider">Dynamic Handoff Depth</span>
            <div className="flex gap-2">
              <span className="text-[9px] px-2 py-0.5 rounded font-bold text-neutral-500 bg-card/10">
                Standard Web 8-Bit
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                16-Bit EXR Bundle
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: 3D FLOATING LAYER STACK (BENTO EXPORTS)
// ==========================================
function IsometricLayerStack() {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      className="relative w-full h-36 flex items-center justify-center overflow-visible cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div 
        className="relative w-[180px] h-[80px] transition-transform duration-700 ease-out"
        style={{
          transform: hovered 
            ? "rotateX(50deg) rotateZ(-36deg) translateY(-4px)" 
            : "rotateX(40deg) rotateZ(-28deg)",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Layer 3: Normal Map */}
        <div 
          className="absolute inset-0 border border-[#ff2e9a]/50 bg-card/90 rounded-lg flex flex-col items-center justify-center font-mono text-[7px] font-bold text-[#ff2e9a] transition-all duration-700"
          style={{
            transform: hovered ? "translateZ(55px) translateY(-22px) translateX(-12px)" : "translateZ(12px)",
            boxShadow: hovered ? "0 10px 20px rgba(255, 46, 154, 0.25)" : "none",
            opacity: hovered ? 1 : 0.6
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,46,154,0.15)_1.5px,transparent_1.5px)] bg-[size:6px_6px] rounded-lg" />
          <span className="relative z-10">NORMAL MAP PASS</span>
          {hovered && (
            <span className="absolute bottom-1 right-2 text-[5.5px] text-neutral-500 font-normal">[CHROMA_SURFACE]</span>
          )}
        </div>

        {/* Layer 2: Depth Channel */}
        <div 
          className="absolute inset-0 border border-[#00d4ff]/50 bg-card/90 rounded-lg flex flex-col items-center justify-center font-mono text-[7px] font-bold text-[#00d4ff] transition-all duration-700"
          style={{
            transform: hovered ? "translateZ(28px) translateY(-5px) translateX(2px)" : "translateZ(6px)",
            boxShadow: hovered ? "0 10px 20px rgba(0, 212, 255, 0.2)" : "none",
            opacity: hovered ? 1 : 0.8
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(rgba(0,212,255,0.15)_1.5px,transparent_1.5px)] bg-[size:6px_6px] rounded-lg" />
          <span className="relative z-10">DEPTH PASS</span>
          {hovered && (
            <span className="absolute bottom-1 right-2 text-[5.5px] text-neutral-500 font-normal">[Z_COVARIANCE]</span>
          )}
        </div>

        {/* Layer 1: RGB Plate */}
        <div 
          className="absolute inset-0 border border-[#7b61ff]/50 bg-card/90 rounded-lg flex flex-col items-center justify-center font-mono text-[7px] font-bold text-[#7b61ff] transition-all duration-700"
          style={{
            transform: hovered ? "translateZ(0px) translateY(12px) translateX(14px)" : "translateZ(0px)",
            boxShadow: hovered ? "0 10px 20px rgba(123, 97, 255, 0.2)" : "none"
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(rgba(123,97,255,0.15)_1.5px,transparent_1.5px)] bg-[size:6px_6px] rounded-lg" />
          <span className="relative z-10">RGB MASTER PLATE</span>
          {hovered && (
            <span className="absolute bottom-1 right-2 text-[5.5px] text-neutral-500 font-normal">[LINEAR_32BIT]</span>
          )}
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
  const [seedCoords, setSeedCoords] = useState({ x: 0.65, y: 0.42 });

  const handleCoordinateMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setSeedCoords({ x, y });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden animate-fade-in">
      
      {/* Immersive glowing background mesh */}
      <PremiumBackgroundLattice />

      <div className="app-grain absolute inset-0 z-0 pointer-events-none select-none opacity-45" />

      {/* 1. TYPOGRAPHIC HERO SECTION */}
      <section className="relative pt-20 pb-12 overflow-hidden z-10 border-b border-border/50">
        <div className={SITE_CONTAINER}>
          
          <div className="flex flex-col items-start text-left max-w-4xl mr-auto mb-16">
            
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-start"
            >
              
              <div className="inline-flex items-center gap-2 rounded-full border border-[#7b61ff]/20 bg-[#7b61ff]/5 px-4.5 py-1.5 text-[8.5px] font-mono font-bold uppercase tracking-[0.25em] mb-7 text-[#7b61ff] shadow-[0_0_15px_rgba(123,97,255,0.05)]">
                [ PIPELINE TELEMETRY: CALIBRATED ]
              </div>

              <h1 className="font-display text-[2.75rem] sm:text-[4.5rem] lg:text-[5.5rem] font-extrabold leading-[1.03] tracking-tight mb-8 text-foreground max-w-3xl">
                Stochastic <br className="sm:hidden" />
                <span className="premium-text-shimmer font-black">
                  Latent Command
                </span>
              </h1>

              <p className="max-w-2xl text-neutral-400 text-xs sm:text-sm font-light leading-relaxed mb-9">
                Command the latent space with absolute precision. Stop submitting to consumer-grade AI randomness. RUHGEN introduces a professional-tier calibration studio engineered precisely for absolute layout structures and cinematic multi-pass rendering.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-start gap-4.5">
                <Link
                  href="/demo"
                  className="btn-gradient inline-flex min-h-[50px] items-center justify-center gap-1.5 rounded-xl bg-[#258eff] px-8 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_4px_30px_rgba(37,142,255,0.35)] transition-all hover:scale-[1.02] hover:bg-[#258eff]/90 cursor-pointer"
                >
                  Launch calibration studio
                  <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={3} />
                </Link>
                <a
                  href="#capabilities"
                  className="inline-flex min-h-[50px] items-center justify-center rounded-xl border border-border bg-card/10 px-7 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground hover:border-border/80 cursor-pointer"
                >
                  Features Narrative
                </a>
              </div>

            </motion.div>
          </div>


        </div>
      </section>

      {/* 2. THE CALIBRATION SECTION */}
      <section id="capabilities" className="relative py-24 z-10 border-b border-border/50">
        <div className={SITE_CONTAINER}>
          
          {/* SECTION A — Dynamic Crop Viewport Rigs */}
          <div className="mb-32">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              
              <div className="lg:col-span-5 text-left">
                <div className="font-mono text-[9px] font-bold text-[#7b61ff] uppercase tracking-[0.25em] mb-4">
                  01 // STOCHASTIC BOUNDING RIGS
                </div>
                <h2 className="font-display text-[2.25rem] sm:text-[3rem] font-extrabold tracking-tight text-foreground mb-6 leading-[1.08]">
                  Composition Calibration.
                </h2>
                <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed mb-6">
                  Design complex geometric visuals with absolute precision. Select custom dimensions and bounding frames that adjust immediately. Calibrate virtual focal depths, camera sensor arrays, and optical dispersion paths inside live responsive viewports.
                </p>

                <ul className="space-y-3.5 font-mono text-[10px] text-neutral-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00d4ff]" />
                    <span>Dynamic aspect morphing chassis (21:9 to 9:16)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00d4ff]" />
                    <span>Live mathematical focal vector calculation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#00d4ff]" />
                    <span>Optical refraction f/number simulators</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-7">
                <AspectCalibrationRig featuresCalibration={content?.featuresCalibration} />
              </div>

            </div>
          </div>

          {/* SECTION B — Workflow & Automation */}
          <div className="mb-32 border-t border-border/50 pt-24">
            <div className="max-w-3xl text-left mb-16">
              <div className="font-mono text-[9px] font-bold text-[#00d4ff] uppercase tracking-[0.25em] mb-4">
                02 // REPEATABLE PIPELINE SYSTEMS
              </div>
              <h2 className="font-display text-[2.25rem] sm:text-[3rem] font-extrabold tracking-tight text-foreground mb-6 leading-[1.08]">
                Deterministic Pipelines.
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed">
                Connect mathematical pipelines directly to professional rendering assets. Drive visual vectors through CLIP token ingestion matrices, flow matching denoising schedules, and high-fidelity 32-bit HDR focal checks.
              </p>
            </div>

            <InteractivePipelineTimeline />
          </div>

          {/* SECTION C — Split-Screen Comparison Sandbox */}
          <div className="mb-24 border-t border-border/50 pt-24">
            <div className="max-w-3xl text-left mb-16">
              <div className="font-mono text-[9px] font-bold text-[#ff2e9a] uppercase tracking-[0.25em] mb-4">
                03 // STOCHASTIC SAMPLERS
              </div>
              <h2 className="font-display text-[2.25rem] sm:text-[3rem] font-extrabold tracking-tight text-foreground mb-6 leading-[1.08]">
                Dual-Stage Denoising.
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed">
                Experience zero processing lag. Smoothly wipe your pointer across the canvas to transition instantly between the rapid stochastic draft grid and the high-density cinematic master network.
              </p>
            </div>

            <InteractiveSplitScanRig />
          </div>

        </div>
      </section>

      {/* 3. PREMIUM BENTO SHOWCASE SECTION */}
      <section className="relative py-24 z-10 border-b border-border/50 bg-card/10">
        <div className={SITE_CONTAINER}>
          
          <header className="mb-16 text-left max-w-2xl">
            <p className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] mb-4 text-[#7b61ff]">
              04 // TECHNICAL EXTENSION SUITES
            </p>
            <h2 className="font-display text-[2.25rem] sm:text-[3rem] font-extrabold tracking-tight text-foreground mb-5 leading-[1.08]">
              Advanced Bento Toolkit
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed">
              Unlock the latent extensions developed exclusively to secure rigid, repeatable compositions and robust post-production pipelines.
            </p>
          </header>

          {/* Bento Grid */}
          <div className="grid gap-6 md:grid-cols-4 items-stretch">
            
            {/* Card 1: Seed Coordinate Lock */}
            <div 
              className="md:col-span-3 rounded-2xl border border-border/50 bg-card/65 p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#7b61ff]/25 transition-all duration-300"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08] pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,var(--primary-purple)_0%,transparent_100%)]" />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-8 w-8 rounded-lg border border-[#7b61ff]/25 flex items-center justify-center bg-[#7b61ff]/5 text-[#7b61ff]">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[7px] font-bold tracking-widest text-[#7b61ff] uppercase">
                    COORDINATE SCHEDULER
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-foreground tracking-tight mb-1.5">
                  Deterministic Latent Vectors
                </h3>
                <p className="text-neutral-400 text-xs font-light leading-relaxed max-w-lg mb-4">
                  Bypass generative noise. Locking mathematical seeds locks absolute focal points, allowing modular navigation across vector dimensions. Calibrated static seed coordinates ensure perfect consistency.
                </p>
              </div>

              {/* Static Coordinate blueprint grid inside card (no movement animation) - super slimmed h-16 */}
              <div className="relative h-16 w-full border border-border/50 bg-card/20 rounded-xl overflow-hidden flex flex-col items-center justify-center p-3">
                <div className="absolute inset-0 bg-[radial-gradient(var(--text-primary)_1px,transparent_1px)] opacity-[0.015]" />
                
                {/* Tech editorial details */}
                <div className="relative z-10 text-center font-mono space-y-0.5">
                  <div className="text-[#7b61ff] text-[8px] font-bold tracking-widest uppercase">
                    [ PIPELINE CALIBRATION COMPLETED ]
                  </div>
                  <div className="text-foreground text-[9.5px] font-semibold tracking-wide">
                    STABLE LATENT VECTOR CACHE // 0.618:0.382
                  </div>
                  <div className="text-neutral-500 text-[6.5px] tracking-wider uppercase">
                    Status: Locked • Memory Segment: Core-0x7F • Dispersion: Absolute
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Workspace Config Presets */}
            <div className="md:col-span-1 rounded-2xl border border-border/50 bg-card/65 p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#00d4ff]/25 transition-all duration-300">
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08] pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,var(--primary-cyan)_0%,transparent_100%)]" />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-8 w-8 rounded-lg border border-[#00d4ff]/25 flex items-center justify-center bg-[#00d4ff]/5 text-[#00d4ff]">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[7px] font-bold tracking-widest text-[#00d4ff] uppercase">
                    PRESETS
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold text-foreground tracking-tight mb-1.5">
                  Persistent Configuration
                </h3>
                <p className="text-neutral-400 text-[10px] font-light leading-relaxed mb-4">
                  Save customized aspect ratios, focal lens calibrations, and step variables to local hardware profiles.
                </p>
              </div>

              <div className="flex flex-col gap-1 font-mono text-[8px] text-neutral-400">
                <div className="p-2 border border-border/50 bg-card/25 rounded-lg flex justify-between items-center">
                  <span>Cinematic Noir</span>
                  <span className="text-[#00d4ff]">f/1.2</span>
                </div>
                <div className="p-2 border border-border/50 bg-card/25 rounded-lg flex justify-between items-center">
                  <span>Studio Prime</span>
                  <span className="text-neutral-500">85mm</span>
                </div>
              </div>
            </div>

            {/* Card 3: 3D Isometric EXR Stack */}
            <div className="md:col-span-1 rounded-2xl border border-border/50 bg-card/65 p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#ff2e9a]/25 transition-all duration-300">
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08] pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,var(--accent-pink)_0%,transparent_100%)]" />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-8 w-8 rounded-lg border border-[#ff2e9a]/25 flex items-center justify-center bg-[#ff2e9a]/5 text-[#ff2e9a]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[7px] font-bold tracking-widest text-[#ff2e9a] uppercase">
                    PIPELINE
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold text-foreground tracking-tight mb-1.5">
                  Multi-Channel Plates
                </h3>
                <p className="text-neutral-400 text-[10px] font-light leading-relaxed mb-4">
                  Export robust 16-bit multi-channel EXR sheets with normals and depth for post processing.
                </p>
              </div>

              {/* 3D Isometric Layer Stack */}
              <IsometricLayerStack />
            </div>

            {/* Card 4: Enterprise Compute */}
            <div className="md:col-span-3 rounded-2xl border border-border/50 bg-card/65 p-5 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/25 transition-all duration-300">
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.08] pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,#10b981_0%,transparent_100%)]" />
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-8 w-8 rounded-lg border border-emerald-500/20 flex items-center justify-center bg-emerald-500/5 text-emerald-400">
                    <Server className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[7px] font-bold tracking-widest text-emerald-400 uppercase">
                    COMPUTE METRICS
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-foreground tracking-tight mb-1.5">
                  Isolated Cloud GPU Architecture
                </h3>
                <p className="text-neutral-400 text-xs font-light leading-relaxed max-w-lg mb-4">
                  Secure your generative data. Render calculations occur exclusively in highly secure private instances with dedicated GPU nodes, bypassing public server pools.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-[8px] text-neutral-400">
                <div className="p-2 border border-border/50 bg-card/25 rounded-lg flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Frankfurt Edge 04
                  </span>
                  <span className="text-neutral-500">22ms Ping</span>
                </div>
                <div className="p-2 border border-border/50 bg-card/25 rounded-lg flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Seoul Edge 09
                  </span>
                  <span className="text-neutral-500">11ms Ping</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>



      {/* 4. PRIVATE & TRUST INFRASTRUCTURE SECTION */}
      <section className="relative py-24 z-10 border-b border-border/50">
        <div className={SITE_CONTAINER}>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            
            <div className="lg:col-span-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-4.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.2em] mb-7 text-emerald-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Retention Compute Policy
              </div>
              <h2 className="font-display text-[2.25rem] sm:text-[3rem] font-extrabold tracking-tight text-foreground mb-6 leading-[1.08]">
                Isolated Creative Ownership.
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed mb-6">
                Your prompts, model configurations, and reference visual files remain exclusively yours. RUHGEN bypasses global cloud retention, routing generations to secure compute caches that delete assets instantly upon client package receipt.
              </p>

              <div className="grid gap-4.5 sm:grid-cols-2 font-mono text-[9.5px] text-neutral-300">
                <div className="p-4 border border-border bg-card/10 rounded-xl">
                  <Lock className="w-4 h-4 text-emerald-400 mb-2" />
                  <span className="block font-bold text-foreground mb-1">Encrypted Channels</span>
                  <span className="text-neutral-500 leading-relaxed font-light">TLS 1.3 vector streams with absolute key confinement.</span>
                </div>
                <div className="p-4 border border-border bg-card/10 rounded-xl">
                  <EyeOff className="w-4 h-4 text-emerald-400 mb-2" />
                  <span className="block font-bold text-foreground mb-1">Zero Training Scraping</span>
                  <span className="text-neutral-500 leading-relaxed font-light">Complete legal exemption from public database scraping schedules.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              {/* Graphical Security matrix */}
              <div className="relative rounded-2xl border border-border/80 p-6 sm:p-8 bg-card/40 backdrop-blur-md overflow-hidden max-w-[500px] mx-auto">
                <div className="absolute inset-0 bg-[linear-gradient(var(--text-primary)_1px,transparent_1px),linear-gradient(90deg,var(--text-primary)_1px,transparent_1px)] bg-[size:14px_14px] opacity-[0.01]" />
                
                <div className="relative z-10 flex items-center justify-between pb-4 mb-4 border-b border-border/50">
                  <span className="font-mono text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
                    SECURITY MATRIX MONITOR
                  </span>
                  <span className="inline-flex items-center gap-1 text-[7.5px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    ENCRYPTED
                  </span>
                </div>

                <div className="space-y-3.5 font-mono text-[9px] text-neutral-400 text-left">
                  <div className="flex justify-between items-center p-2.5 border border-border/50 bg-card/45 rounded-lg">
                    <span>Active Security Protocol</span>
                    <span className="text-foreground font-bold">AES-256-GCM</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 border border-border/50 bg-card/45 rounded-lg">
                    <span>Isolated Data Retention</span>
                    <span className="text-emerald-400 font-bold">0 Seconds</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 border border-border/50 bg-card/45 rounded-lg">
                    <span>Pipeline Key Integrity</span>
                    <span className="text-foreground font-bold">SHA-512 Signed</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 border border-border/50 bg-card/45 rounded-lg">
                    <span>GPU Compute Exemption</span>
                    <span className="text-[#00d4ff] font-bold">Verified</span>
                  </div>
                </div>

                {/* Secure network pulse visual */}
                <div className="mt-5 h-1.5 w-full rounded-full overflow-hidden bg-border relative">
                  <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-[#00d4ff] w-full animate-progress" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. PREMIUM CTA SECTION */}
      <section className="relative py-12 z-10 overflow-hidden">
        
        {/* Massive backdrop gradient */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ background: "radial-gradient(circle at 50% 50%, rgba(123, 97, 255, 0.05) 0%, transparent 60%)" }} />

        <div className={SITE_CONTAINER}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-2xl border border-border/75 py-7 px-8 sm:px-10 text-left flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
            style={{
              background: "linear-gradient(135deg, rgba(0, 212, 255, 0.03), rgba(123, 97, 255, 0.03), rgba(255, 46, 154, 0.02))",
              backdropFilter: "blur(16px)",
              boxShadow: "0 15px 40px -10px rgba(0,0,0,0.6)"
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: "radial-gradient(ellipse 70% 60% at 100% 0%, rgba(0,212,255,0.3), transparent 55%)" }} />

            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#7b61ff]/20 bg-[#7b61ff]/5 px-3 py-1 text-[8px] font-bold uppercase tracking-[0.2em] mb-2 text-[#7b61ff]">
                <Sparkles className="w-3 h-3 text-[#7b61ff]" />
                Command the Latent Space
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground leading-tight">
                Command the Latent Space with Absolute Precision.
              </h2>
              <p className="text-neutral-500 text-[10px] font-light mt-1">
                Step up to an elite creative workspace engineered for flawless dynamic fidelity.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-3.5 shrink-0">
              <Link
                href="/sign-up"
                className="btn-gradient inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#258eff] px-5 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(37,142,255,0.25)] transition-all hover:scale-[1.02] cursor-pointer"
              >
                Start Creating Free
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </Link>
              
              <Link
                href="/contact"
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-border bg-card/10 px-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground hover:border-border/80 cursor-pointer"
              >
                Talk to a Specialist
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
