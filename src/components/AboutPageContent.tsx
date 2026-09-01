"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  Film,
  Palette,
  Shield,
  Sparkles,
  Users,
  Zap,
  Globe,
  Award,
  Sliders,
  Cpu,
  Terminal,
  Lock,
  Activity,
  Server,
  ChevronRight,
  Database
} from "lucide-react";
import Link from "next/link";
import { SITE_CONTAINER } from "@/lib/site-layout";

interface Pillar {
  num: string;
  title: string;
  subtitle: string;
  description: string;
  benefit: string;
  stats: string;
}

const PILLARS: Pillar[] = [
  {
    num: "01",
    title: "Visual Cohesion Engine",
    subtitle: "Systemic style consistency across infinite variations",
    description: "Maintaining a clear, uncompromised aesthetic signature across long production runs is standard. Our core alignment layer prevents generation drift by locking dynamic parameters natively.",
    benefit: "Empowers visual directors to establish, lock, and scale a tailored signature style.",
    stats: "0.02% drift / 10k generations",
  },
  {
    num: "02",
    title: "Direct-Latency Pipeline",
    subtitle: "Immediate visual response for real-time editorial directors",
    description: "Creative workflow breaks when previews take minutes. We engineered our data routing to prioritize immediate feedback, delivering direct visual response in standard operations.",
    benefit: "Enables instant iteration for film decks and high-pressure production deadlines.",
    stats: "180ms core roundtrip latency",
  },
  {
    num: "03",
    title: "Secure Compute Sanctuaries",
    subtitle: "Enterprise-grade privacy for high-value intellectual property",
    description: "Your creative assets are your most valuable intellectual property. We run isolated, high-tier secure channels that ensure your canvas outputs and creative parameters are fully sovereign.",
    benefit: "Guarantees complete style confidentiality for elite design firms.",
    stats: "ISO-27001 calibrated architecture",
  },
];

interface Epoch {
  year: string;
  title: string;
  tagline: string;
  summary: string;
  description: string;
  milestone: string;
  metrics: { label: string; value: string }[];
}

const EPOCHS: Epoch[] = [
  {
    year: "2025",
    title: "The Frictionless Spark",
    tagline: "Unifying separate models into a seamless ecosystem.",
    summary: "The idea for RUHGEN was born out of frustration with highly fragmented workflows across isolated, disconnected creative models.",
    description: "We realized that professional visual artists and design directors didn't need yet another generic prompt box. They needed an elite orchestration layer capable of seamlessly bridging multiple complex models, styles, and parameters into a single, fluid timeline. In 2025, we unified these separate engines into a single frictionless pipeline.",
    milestone: "Ecosystem Unification Alpha",
    metrics: [
      { label: "Pipeline Latency", value: "< 250ms" },
      { label: "Model Connections", value: "Multi-Engine" },
      { label: "Cohesive Sync Rate", value: "98.8%" },
    ],
  },
  {
    year: "2026",
    title: "The Multi-Engine Frontier",
    tagline: "Direct model orchestration, ready for infinite scale.",
    summary: "We are currently running direct model orchestration, preparing for a massive expansion of unified premium engines in the near future.",
    description: "Today, we run elite, low-overhead model orchestration bridges that execute complex style configurations with absolute zero-fidelity degradation. We are actively expanding this interface to support direct integrations with the world's most advanced deep processing layers, giving visual teams an infinite, sovereign creative workspace.",
    milestone: "Enterprise Mesh Launch",
    metrics: [
      { label: "Orchestration Power", value: "Unlimited Scale" },
      { label: "Fidelity Preservation", value: "100.0%" },
      { label: "Secure Data Isolation", value: "100% Sovereign" },
    ],
  },
];

const highlights = [
  { label: "Ship-ready fidelity", detail: "Masters you can grade, not just scroll past." },
  { label: "Directed latency", detail: "Previews that keep up with creative iteration." },
  { label: "Honest handoff", detail: "Exports and integrations that respect your pipeline." },
];

const stats = [
  { value: "10M+", label: "Assets Generated", icon: Zap },
  { value: "99.9%", label: "Uptime SLA", icon: Shield },
  { value: "50+", label: "Countries Served", icon: Globe },
  { value: "4.9/5", label: "Creator Rating", icon: Award },
];

// Interactive Aesthetic Calibration Engine Sub-component (Smooth GPU Animation)
function CalibrationEngine() {
  const [calibration, setCalibration] = useState<number>(75);
  const [latentDepth, setLatentDepth] = useState<number>(60);
  const [meshFocus, setMeshFocus] = useState<number>(80);
  const [sovereignMode, setSovereignMode] = useState<boolean>(true);

  // Compute coherence based on controls
  const coherence = Math.min(
    100,
    Math.round(
      (calibration * 0.4 + latentDepth * 0.35 + meshFocus * 0.25) *
        (sovereignMode ? 1.0 : 0.88)
    )
  );

  return (
    <div className="premium-ring relative flex flex-col justify-between overflow-hidden rounded-[1.25rem] border p-6 backdrop-blur-2xl transition-all duration-500 hover:border-brand-purple/20" style={{ background: "var(--glass-elevated)" }}>
      {/* Blueprint background grid */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none select-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className="relative flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5 mb-5">
        <div className="flex items-center gap-2">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-cyan"></span>
          </div>
          <span className="font-mono text-[9px] tracking-[0.2em] text-neutral-400 uppercase font-bold">
            AESTHETIC_ENGINE_v2.66
          </span>
        </div>
        <div className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest font-semibold">
          SYS_CALIBRATION: OK
        </div>
      </div>

      {/* Core split: SVG visual + Sliders */}
      <div className="grid gap-5 sm:grid-cols-2 relative z-10">
        {/* Left: Custom Hardened Sliders */}
        <div className="flex flex-col gap-3.5 justify-center">
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono tracking-wider text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-2.5 w-2.5 text-brand-purple" />
                CALIBRATION FOCUS
              </span>
              <span className="text-[var(--text-primary)] font-bold">{calibration}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={calibration}
              onChange={(e) => setCalibration(parseInt(e.target.value))}
              className="w-full h-[2px] bg-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] rounded-lg appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-black [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono tracking-wider text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-2.5 w-2.5 text-brand-cyan" />
                LATENT GRADIENT DEPTH
              </span>
              <span className="text-[var(--text-primary)] font-bold">{latentDepth}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={latentDepth}
              onChange={(e) => setLatentDepth(parseInt(e.target.value))}
              className="w-full h-[2px] bg-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] rounded-lg appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-black [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono tracking-wider text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Activity className="h-2.5 w-2.5 text-brand-pink" />
                ORCHESTRATION MESH
              </span>
              <span className="text-[var(--text-primary)] font-bold">{meshFocus}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={meshFocus}
              onChange={(e) => setMeshFocus(parseInt(e.target.value))}
              className="w-full h-[2px] bg-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] rounded-lg appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-black [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
            />
          </div>

          {/* Sovereign Switch Toggle */}
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3.5 mt-1.5">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono tracking-[0.15em] text-[var(--text-primary)] flex items-center gap-1 uppercase font-bold">
                <Lock className="h-2.5 w-2.5 text-green-400" />
                SOVEREIGN CHANNEL
              </span>
              <span className="text-[8px] font-mono text-neutral-500 mt-0.5">
                Isolated Zero-Leak Encryption
              </span>
            </div>
            <button
              onClick={() => setSovereignMode(!sovereignMode)}
              className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                sovereignMode ? "bg-brand-purple" : "bg-[color-mix(in_srgb,var(--text-primary)_15%,transparent)]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                  sovereignMode ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Right: Abstract Render Monitor with GPU animated path */}
        <div className="relative h-[150px] rounded-xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--deep-black)_80%,transparent)] overflow-hidden flex flex-col items-center justify-center p-3">
          {/* Diagnostic status overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 font-mono text-[7px] text-neutral-500 uppercase tracking-[0.12em] font-semibold">
            <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
            LIVE_FEED // CONSTELLATION
          </div>

          {/* Latency meter overlay (completely stable and clean) */}
          <div className="absolute bottom-2 left-2 font-mono text-[7px] text-neutral-400 tracking-wider">
            PIPELINE_LATENCY:{" "}
            <span className="font-bold text-brand-cyan">
              {sovereignMode ? "180.0ms" : "240.0ms"}
            </span>
          </div>

          {/* Coherence display overlay */}
          <div className="absolute top-2 right-2 font-mono text-[7px] text-neutral-400 tracking-wider text-right">
            COHERENCE: <span className="font-bold text-[var(--text-primary)]">{coherence}%</span>
          </div>

          {/* Waveform graphic (fully CSS-pulsed for smooth performance, no React state re-renders) */}
          <svg className="w-full h-full" viewBox="0 0 160 100" fill="none">
            {/* Background dynamic grids */}
            <line x1="0" y1="50" x2="160" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            
            {Array.from({ length: 3 }).map((_, pathIdx) => {
              const frequency = (calibration / 100) * 0.07 + pathIdx * 0.008;
              const amplitude = (latentDepth / 100) * 14 + pathIdx * 2;
              const points = Array.from({ length: 32 }, (_, i) => {
                const x = (i / 31) * 160;
                const y =
                  50 +
                  Math.sin(x * frequency + pathIdx * 1.5) * amplitude +
                  Math.cos(x * 0.015) * 2;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              });
              const d = `M ${points.join(" L ")}`;

              return (
                <path
                  key={pathIdx}
                  d={d}
                  stroke={
                    pathIdx === 0
                      ? "url(#meshGrad1)"
                      : pathIdx === 1
                      ? "url(#meshGrad2)"
                      : "rgba(255,255,255,0.05)"
                  }
                  strokeWidth={pathIdx === 0 ? 1.25 : 0.5}
                  strokeOpacity={pathIdx === 0 ? 0.9 : 0.3}
                  className={pathIdx === 0 ? "animate-[pulse_3s_ease-in-out_infinite]" : "animate-[pulse_5s_ease-in-out_infinite]"}
                />
              );
            })}

            {/* Connecting static node mesh elements */}
            {meshFocus > 45 &&
              Array.from({ length: 4 }).map((_, nodeIdx) => {
                const x = 32 + nodeIdx * 32;
                const y = 50 + Math.sin(x * 0.04) * ((latentDepth / 100) * 15);
                return (
                  <g key={nodeIdx}>
                    <circle
                      cx={x}
                      cy={y}
                      r={2}
                      fill={nodeIdx % 2 === 0 ? "#7B61FF" : "#00D4FF"}
                      opacity="0.8"
                    />
                    {nodeIdx < 3 && (
                      <line
                        x1={x}
                        y1={y}
                        x2={x + 32}
                        y2={50 + Math.sin((x + 32) * 0.04) * ((latentDepth / 100) * 15)}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="0.5"
                      />
                    )}
                  </g>
                );
              })}

            <defs>
              <linearGradient id="meshGrad1" x1="0" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7B61FF" />
                <stop offset="50%" stopColor="#00D4FF" />
                <stop offset="100%" stopColor="#FF2E9A" />
              </linearGradient>
              <linearGradient id="meshGrad2" x1="0" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#7B61FF" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Diagnostics ticker */}
      <div className="mt-5 border-t border-[var(--border-subtle)] pt-3 flex items-center justify-between text-[8px] font-mono text-neutral-500 uppercase tracking-widest">
        <span>TUNNEL_HASH: 0x{coherence}FFF_SECURED</span>
        <span>LOSSLESS_TRANSIT: 100%</span>
      </div>
    </div>
  );
}

// Unified Multi-Engine Orchestration Spectrum Component
interface CreativeEngine {
  id: string;
  name: string;
  version: string;
  subtitle: string;
  description: string;
  color: string;
  metrics: { label: string; value: string }[];
  specs: string[];
}

const CREATIVE_ENGINES: CreativeEngine[] = [
  {
    id: "engine-photographic",
    name: "Photographic Core",
    version: "v2.61",
    subtitle: "Medium-Format Calibrated Raw Sensor Simulation",
    description: "calibrated strictly for micro-contrast curves, realistic skin tone distribution, and natural highlights. This engine replicates raw medium-format camera matrices to lock spatial accuracy with zero styling drift.",
    color: "#7B61FF",
    metrics: [
      { label: "Pipeline Latency", value: "180ms" },
      { label: "Style Fidelity", value: "99.98%" },
      { label: "Spectral Range", value: "Rec.2020" }
    ],
    specs: ["Medium Format Calibration", "Dynamic Range Sweep", "Lossless Grain Lock"]
  },
  {
    id: "engine-cinematic",
    name: "Cinematic Motion",
    version: "v1.94",
    subtitle: "24fps Temporal Keyframe Orchestration",
    description: "intelligently schedules temporal vector frames across multi-frame synthesis blocks. It completely locks camera motion paths and panning shifts to align generations with standard 24fps film deck aesthetics.",
    color: "#00D4FF",
    metrics: [
      { label: "Temporal Latency", value: "220ms" },
      { label: "Frame Coherence", value: "100.0%" },
      { label: "Pacing Drift", value: "0.00%" }
    ],
    specs: ["24fps Gate Locking", "Vector Motion Align", "Keyframe Interpolation"]
  },
  {
    id: "engine-graphic",
    name: "Graphic Choreography",
    version: "v3.12",
    subtitle: "High-Contrast Layout Cohesion & Typographic Outlines",
    description: "enforces rigid typographic grid boundaries and print-ready bezier curves. It maps complex layouts without visual compression artifacts, preserving fine lines and high-contrast structural assets.",
    color: "#FF2E9A",
    metrics: [
      { label: "Layout Latency", value: "160ms" },
      { label: "Bezier Fidelity", value: "100.0%" },
      { label: "Grid Alignment", value: "Sub-pixel" }
    ],
    specs: ["Sub-pixel Grid Alignment", "Anchor Point Locking", "High-Contrast Isolation"]
  },
  {
    id: "engine-upscaler",
    name: "Deep Upscaler V2",
    version: "v4.05",
    subtitle: "High-Pass Frequency Restoration & Grain Reconstruction",
    description: "splits visual channels to reconstruct frequency-level details in low-res layers. Restores detailed clothing weaves, concrete dust textures, and high-contrast hair strands without artificial noise hallucinations.",
    color: "#7B61FF",
    metrics: [
      { label: "Upscale Latency", value: "190ms" },
      { label: "Detail Retention", value: "99.96%" },
      { label: "Noise Floor", value: "Calibrated" }
    ],
    specs: ["High-Pass Extraction", "Micro-Frequency Restore", "Gaussian Synthesis"]
  }
];

type EngineParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  alpha: number;
  noiseOffset: number;
  angle: number;
  speed: number;
};

function EngineOrchestrationHub() {
  const [activeEngineIdx, setActiveEngineIdx] = useState<number>(0);
  const engine = CREATIVE_ENGINES[activeEngineIdx];
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<EngineParticle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const activeIdxRef = useRef(activeEngineIdx);

  // Decoupled coordinate shape logic
  const updateTargets = (idx: number, w: number, h: number) => {
    const particles = particlesRef.current;
    if (particles.length === 0) return;
    
    // Safety dimensions check
    const width = w || 600;
    const height = h || 375;
    const cx = width / 2;
    const cy = height / 2;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (idx === 0) {
        // Photographic Core - Concentric Aperture Rings & Iris Spokes
        if (i < particles.length * 0.35) {
          const angle = (i / (particles.length * 0.35)) * Math.PI * 2;
          p.targetX = cx + Math.cos(angle) * (height * 0.38);
          p.targetY = cy + Math.sin(angle) * (height * 0.38);
        } else if (i < particles.length * 0.65) {
          const angle = ((i - particles.length * 0.35) / (particles.length * 0.3)) * Math.PI * 2;
          p.targetX = cx + Math.cos(angle) * (height * 0.22);
          p.targetY = cy + Math.sin(angle) * (height * 0.22);
        } else {
          const spokeIdx = i % 8;
          const progress = Math.floor(i / 8) / (particles.length / 8);
          const spokeAngle = (spokeIdx * Math.PI) / 4 + progress * 0.15;
          const length = height * 0.12 + progress * (height * 0.32);
          p.targetX = cx + Math.cos(spokeAngle) * length;
          p.targetY = cy + Math.sin(spokeAngle) * length;
        }
      } else if (idx === 1) {
        // Cinematic Motion - High frequency wave timeline
        if (i < particles.length * 0.45) {
          const xProgress = i / (particles.length * 0.45);
          p.targetX = xProgress * width;
          p.targetY = cy + Math.sin(xProgress * Math.PI * 3 + p.angle * 0.05) * (height * 0.26);
        } else if (i < particles.length * 0.9) {
          const xProgress = (i - particles.length * 0.45) / (particles.length * 0.45);
          p.targetX = xProgress * width;
          p.targetY = cy + Math.cos(xProgress * Math.PI * 2 + p.angle * 0.05) * (height * 0.18);
        } else {
          const nodeIdx = i % 3;
          const nodeX = width * (0.25 + nodeIdx * 0.25);
          const angle = p.angle + i;
          p.targetX = nodeX + Math.cos(angle) * 16;
          p.targetY = cy + Math.sin(angle) * 16;
        }
      } else if (idx === 2) {
        // Graphic Choreography - Logarithmic Golden Spiral
        const goldenRatio = 1.61803398875;
        const theta = (i / particles.length) * 48;
        const radius = (height * 0.02) * Math.pow(goldenRatio, theta * 0.08);
        p.targetX = cx - 30 + Math.cos(theta) * radius;
        p.targetY = cy + Math.sin(theta) * radius;
      } else {
        // Deep Upscaler V2 - Resolution Split matrix
        if (i < particles.length * 0.45) {
          const colSize = 4;
          const gridIdx = i % 16;
          const gridX = Math.floor(gridIdx % colSize);
          const gridY = Math.floor(gridIdx / colSize);
          const spread = 6;
          p.targetX = width * 0.22 + gridX * (width * 0.08) + (p.noiseOffset % 8 - 4) * spread * 0.2;
          p.targetY = height * 0.25 + gridY * (height * 0.15) + (p.noiseOffset % 10 - 5) * spread * 0.2;
        } else {
          const colSize = 8;
          const gridIdx = (i - Math.floor(particles.length * 0.45)) % 64;
          const gridX = Math.floor(gridIdx % colSize);
          const gridY = Math.floor(gridIdx / colSize);
          const spread = 3;
          p.targetX = width * 0.58 + gridX * (width * 0.032) + (p.noiseOffset % 6 - 3) * spread * 0.15;
          p.targetY = height * 0.22 + gridY * (height * 0.08) + (p.noiseOffset % 8 - 4) * spread * 0.15;
        }
      }
    }
  };

  // Sync ref to avoid stale closures in frame loops
  useEffect(() => {
    activeIdxRef.current = activeEngineIdx;
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      updateTargets(activeEngineIdx, rect.width, rect.height);
    }
  }, [activeEngineIdx]);

  // Start HTML Canvas 3D Particle morph engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      updateTargets(activeIdxRef.current, rect.width, rect.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const render = () => {
      time++;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Draw dark gloss background with micro trail delay
      ctx.fillStyle = document.documentElement.classList.contains("light") ? "rgba(240, 240, 245, 0.22)" : "rgba(6, 6, 6, 0.22)";
      ctx.fillRect(0, 0, w, h);

      // Render aesthetic technical crosshairs
      ctx.strokeStyle = document.documentElement.classList.contains("light") ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 0.5;
      
      // Horizontal & Vertical Sub-Grids
      for (let x = 40; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 30; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw aesthetic outer framing
      ctx.strokeStyle = document.documentElement.classList.contains("light") ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.03)";
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Compass crosshair guides
      ctx.strokeStyle = document.documentElement.classList.contains("light") ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.06)";
      ctx.beginPath();
      ctx.moveTo(w / 2 - 15, h / 2); ctx.lineTo(w / 2 + 15, h / 2);
      ctx.moveTo(w / 2, h / 2 - 15); ctx.lineTo(w / 2, h / 2 + 15);
      ctx.stroke();

      // Lazy load particles if empty
      const particles = particlesRef.current;
      if (particles.length === 0) {
        const colors = ["#7B61FF", "#00D4FF", "#FF2E9A", "#AA99FF"];
        const count = 500;
        const width = w || 600;
        const height = h || 375;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0,
            targetX: width / 2,
            targetY: height / 2,
            size: Math.random() * 1.6 + 0.6,
            color: colors[i % colors.length],
            alpha: Math.random() * 0.55 + 0.4,
            noiseOffset: Math.random() * 100,
            angle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.02 + 0.005
          });
        }
        particlesRef.current = particles;
        updateTargets(activeIdxRef.current, width, height);
      }

      // Physics loop & drawing for morph particles
      const count = particles.length;
      const mouse = mouseRef.current;
      
      for (let i = 0; i < count; i++) {
        const p = particles[i];

        // Elastic spring interpolation pull towards morph target
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        p.x += dx * 0.07;
        p.y += dy * 0.07;

        // Constant mechanical float wave
        p.x += Math.sin(time * p.speed + p.noiseOffset) * 0.18;
        p.y += Math.cos(time * p.speed + p.noiseOffset) * 0.18;

        // Interactive mouse deflection sphere
        const mdx = mouse.x - p.x;
        const mdy = mouse.y - p.y;
        const dist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (dist < 60) {
          const force = (60 - dist) / 60;
          p.x -= (mdx / dist) * force * 14;
          p.y -= (mdy / dist) * force * 14;
        }

        // Draw particle node
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Staggered interactive halo rings
        if (i % 25 === 0) {
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = p.alpha * 0.18;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1.0;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000 };
  };

  return (
    <div className="premium-ring grid gap-8 lg:grid-cols-12 rounded-[1.25rem] border p-6 bg-[color-mix(in_srgb,var(--deep-black)_40%,transparent)] backdrop-blur-3xl overflow-hidden relative" style={{ borderColor: "var(--border-subtle)" }}>
      {/* Dynamic Receding Font Background Layer */}
      <style>{`
        @keyframes receding-breath {
          0%, 100% { transform: scale(1) rotate(0.01deg); letter-spacing: 0.35em; }
          50% { transform: scale(1.05) rotate(0.01deg); letter-spacing: 0.42em; }
        }
        .animate-receding-breath {
          animation: receding-breath 16s ease-in-out infinite;
        }
      `}</style>
      
      {/* Absolute aura backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ background: `radial-gradient(ellipse at 80% 80%, ${engine.color}, transparent 60%)` }} />

      {/* Left Column: Visual schematic monitor (7 cols) */}
      <div className="lg:col-span-7 flex flex-col justify-center z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[8px] tracking-[0.15em] text-neutral-400 flex items-center gap-1.5 uppercase font-bold">
            <Terminal className="h-2.5 w-2.5 text-brand-purple" />
            ENGINE_VISIZATION_FEED
          </span>
          <span className="font-mono text-[8px] text-neutral-500">
            MATRIX_RECONSTRUCTION: OK
          </span>
        </div>

        {/* Blueprint Visual Screen */}
        <div className="aspect-[16/10] rounded-xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--deep-black)_60%,transparent)] p-6 flex items-center justify-center relative overflow-hidden group cursor-crosshair">
          {/* Subtle Receding Font Layer directly behind the canvas particles */}
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none select-none overflow-hidden z-0 opacity-[0.035] mix-blend-plus-lighter">
            <span className="font-bungee-hairline text-[50px] sm:text-[90px] text-[var(--text-primary)] tracking-[0.35em] uppercase whitespace-nowrap animate-receding-breath">
              {engine.name.split(" ")[0]}
            </span>
          </div>

          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="absolute inset-0 w-full h-full block z-10"
          />

          {/* Blueprint technical corner guidelines */}
          <div className="absolute top-3 left-3 pointer-events-none font-mono text-[7px] text-neutral-600 tracking-wider z-20">
            RUHGEN_CORE // SYS_LOCK_TRUE
          </div>
          <div className="absolute bottom-3 left-3 pointer-events-none font-mono text-[7px] text-neutral-600 z-20">
            SECURE_NODE: v0.92
          </div>
          <div className="absolute bottom-3 right-3 pointer-events-none font-mono text-[7px] text-neutral-500 flex items-center gap-1.5 z-20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
            MATRIX: 60FPS
          </div>
        </div>
      </div>

      {/* Right Column: Spec sheet & description (5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between border-t border-[var(--border-subtle)] lg:border-t-0 lg:border-l pt-5 lg:pt-0 lg:pl-8 text-left z-10">
        <div>
          <span className="text-[9px] font-mono tracking-[0.15em] text-[#7B61FF] uppercase font-bold block mb-3.5">
            ORCHESTRATED CAPABILITIES
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={engine.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: engine.color, boxShadow: `0 0 6px ${engine.color}` }} />
                  {engine.name}
                </h3>
                <span className="text-[9px] font-mono text-neutral-400 tracking-wider block mt-0.5 uppercase">
                  {engine.version} {"//"} {engine.subtitle}
                </span>
              </div>

              {/* Glowing metrics grids with receding font */}
              <div className="grid grid-cols-3 gap-2">
                {engine.metrics.map((met) => (
                  <div key={met.label} className="border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--deep-black)_40%,transparent)] rounded-lg p-2.5 text-center flex flex-col justify-center items-center backdrop-blur-md relative overflow-hidden group hover:border-[var(--text-primary)]/20 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[11px] text-[var(--text-primary)] tracking-widest block font-bungee-hairline premium-text-shimmer leading-none mb-1">
                      {met.value}
                    </span>
                    <span className="text-[7px] font-mono text-neutral-500 uppercase tracking-wider block font-bold mt-1.5">
                      {met.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="space-y-1.5 border-t border-[var(--border-subtle)] pt-3.5">
                <span className="text-[8px] font-mono text-neutral-500 uppercase block tracking-wider font-bold">
                  ORCHESTRATION PIPELINE OPERATION_LOG
                </span>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  RUHGEN bridges this core block into our secure canvas. It {engine.description}
                </p>
              </div>

              {/* Bullet specs capsules */}
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {engine.specs.map((spec) => (
                  <span
                    key={spec}
                    className="px-2 py-0.5 rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--text-primary)_1%,transparent)] text-[var(--text-muted)] font-mono text-[7px] tracking-wider uppercase font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Engine selector tab matrix at the bottom */}
        <div className="pt-4 border-t border-[var(--border-subtle)] mt-5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-1.5">
            {CREATIVE_ENGINES.map((eng, idx) => (
              <button
                key={eng.id}
                onClick={() => setActiveEngineIdx(idx)}
                className={`px-2.5 py-1 rounded-md font-mono text-[8px] uppercase tracking-wider transition-all duration-300 border cursor-pointer flex items-center gap-1.5 ${
                  activeEngineIdx === idx
                    ? "bg-[var(--glass-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)]"
                    : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {activeEngineIdx === idx && (
                  <span className="w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: eng.color }} />
                )}
                {eng.name.split(" ")[0]}
              </button>
            ))}
          </div>
          <span className="text-[6px] font-mono text-neutral-600 tracking-wider">
            CORE_ORCHESTRATOR_LOCK
          </span>
        </div>
      </div>
    </div>
  );
}

export function AboutPageContent() {
  const reduce = useReducedMotion();
  const [activeEpoch, setActiveEpoch] = useState<number>(0);
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);

  return (
    <main className="relative flex-1 overflow-hidden pt-28 sm:pt-36 pb-24 font-sans" style={{ background: "var(--deep-black)" }}>
      {/* Organic low-contrast film grain overlay */}
      <div className="absolute inset-0 pointer-events-none app-grain select-none z-10 opacity-[0.04]" />

      {/* Cinematic grid matrix lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] select-none"
        style={{
          backgroundImage: "radial-gradient(var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent" />
      <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-[var(--border-subtle)]/60 to-transparent" />

      {/* Luxury ambient light leak / soft auroras */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute top-[-5%] left-[-5%] w-[60vw] max-w-[600px] h-[60vw] max-h-[600px] rounded-full blur-[180px] opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, rgba(123,97,255,0.3) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[10%] right-[-5%] w-[50vw] max-w-[500px] h-[50vw] max-h-[500px] rounded-full blur-[150px] opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, rgba(255,46,154,0.2) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className={`relative z-10 ${SITE_CONTAINER} pb-16 space-y-24 sm:space-y-32`}>
        {/* ====================================================================== */}
        {/* FIRST CHANGE: FULLSCREEN CINEMATIC HERO SECTION */}
        {/* ====================================================================== */}
        <header className="min-h-[80vh] flex flex-col justify-center items-start text-left w-full pt-12 relative">
          {/* Elegant pre-header pill */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--text-primary)_1%,transparent)] px-4 py-1.5 text-[8px] tracking-[0.25em] text-[#7B61FF] uppercase shadow-[0_0_24px_rgba(123,97,255,0.06)] mb-8"
            style={{ fontFamily: "var(--font-calsans)" }}
          >
            <Sparkles className="h-3 w-3 animate-pulse" style={{ color: "#7B61FF" }} />
            SYSTEMIC UNIFICATION OF VISIONARY DEEP ENGINES
          </motion.div>

          <motion.h1
            className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.12] tracking-tight uppercase max-w-6xl text-left"
            initial={reduce ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          >
            The absolute <br />
            <span style={{ fontFamily: "var(--font-signatie)", textTransform: "none" }} className="text-[#00D4FF] lowercase font-light">calibration</span> of <br />
            generative <span style={{ fontFamily: "var(--font-calsans)" }} className="text-[#FF2E9A] text-5xl sm:text-7xl lg:text-8xl tracking-wider font-bold">mediums.</span>
          </motion.h1>

          {/* Discover indicators at the bottom */}
          <motion.div
            className="absolute bottom-6 left-0 flex items-center gap-3 font-mono text-[8px] tracking-[0.3em] text-neutral-500 uppercase font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span className="h-8 w-[1px] bg-gradient-to-b from-neutral-500 to-transparent animate-[pulse_2s_infinite]" />
            SCROLL TO discovery
          </motion.div>
        </header>

        {/* ====================================================================== */}
        {/* PARAGRAPH INTRODUCTION STARTS (CENTER ALIGNED PROLOGUE) */}
        {/* ====================================================================== */}
        <section className="w-full pt-20 border-t border-[var(--border-subtle)] flex flex-col items-center text-center">
          <motion.div
            className="flex flex-col items-center text-center space-y-8 max-w-6xl mx-auto px-4"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md px-4 py-1.5 text-[9px] font-mono tracking-[0.25em] text-[#00D4FF] uppercase font-bold shadow-[0_0_20px_rgba(0,212,255,0.1)]">
              PROLOGUE // COHESIVE CALIBRATION
            </div>

            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.12] max-w-5xl"
              style={{ fontFamily: "var(--font-calsans)" }}
            >
              A Category of One. Built strictly for visionary directors.
            </h2>

            <div
              className="space-y-6 text-base sm:text-lg md:text-xl leading-relaxed text-neutral-300 font-normal max-w-6xl mx-auto tracking-wide"
              style={{ fontFamily: "var(--font-rink)" }}
            >
              <p className="max-w-5xl mx-auto leading-relaxed">
                We started <span className="text-[#00D4FF] font-medium">RUHGEN</span> with a singular recognition: professional creative tools shouldn&apos;t feel like toys. The gap in visual creation workflows is massive. Not every model is good at everything, yet design teams are currently forced to operate within highly fragmented pipelines.
              </p>

              <p className="max-w-5xl mx-auto text-neutral-300 text-base sm:text-lg md:text-xl leading-relaxed">
                We engineered an elite, low-overhead orchestration framework to <span className="text-[#7B61FF] font-medium">unify the world&apos;s most powerful AI engines</span> under one fluid timeline. Aligned strictly to <span className="text-white font-medium">cinematic grading standards</span>, our ecosystem provides the <span className="text-[#FF2E9A] font-medium">prestige-grade guardrails</span> required by visual teams shipping premium, high-value brand deliverables.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ====================================================================== */}
        {/* ORCHESTRATION PIPELINES: Multi-Engine Showcase */}
        {/* ====================================================================== */}
        <section className="pt-20 border-t border-[var(--border-subtle)] w-full space-y-12">
          <div className="text-center mb-10 space-y-3 max-w-5xl mx-auto">
            <span className="text-[9px] font-mono tracking-[0.15em] text-[#00D4FF] uppercase block font-bold">
              ORCHESTRATION PIPELINES
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
              Lossless Multi-Engine Orchestration Core
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-light font-sans leading-relaxed max-w-3xl mx-auto">
              Intelligently coordinates specialized deep creative engines under a single native timeline, locking style attributes and parameters with absolute zero-drift fidelity.
            </p>
          </div>

          <EngineOrchestrationHub />
        </section>

        {/* Focus Card & Highlights Row */}
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8 w-full">
          <motion.article
            className="premium-ring relative overflow-hidden rounded-[1.25rem] border p-6 sm:p-8 lg:col-span-3"
            style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-[0.12] blur-3xl"
              style={{ background: "#7B61FF" }}
            />
            <div className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                  boxShadow: "0 0 16px rgba(123,97,255,0.2)",
                }}
              >
                <Film className="h-4 w-4 text-white" strokeWidth={1.75} />
              </div>
              <div className="text-left space-y-3">
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Calibrated for timeline and reviews
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-muted)]">
                  RUHGEN focuses structurally on three requirements:{" "}
                  <strong className="text-[var(--text-primary)]">latency</strong> creators can iterate with,{" "}
                  <strong className="text-[var(--text-primary)]">fidelity</strong> visual artists can grade, and{" "}
                  <strong className="text-[var(--text-primary)]">security</strong> that respects your sovereign work. If your team operates under strict timeline deadlines, RUHGEN is engineered for your pipeline.
                </p>
              </div>
            </div>
          </motion.article>

          <motion.div
            className="flex flex-col gap-4 lg:col-span-2"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: reduce ? 0 : 0.05 }}
          >
            <div className="premium-ring flex flex-1 flex-col justify-center rounded-[1.25rem] border p-5 text-left relative overflow-hidden group hover:border-[#00D4FF]/20 transition-all duration-300" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
              <Sparkles className="h-4.5 w-4.5 text-[#00D4FF]" strokeWidth={1.75} />
              <p className="mt-2.5 font-display text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                Opinionated where it matters
              </p>
              <p className="mt-1.5 text-xs text-[var(--text-subtle)] leading-relaxed">
                Opinionated defaults that keep design teams moving—without hiding complex parameters power users need.
              </p>
            </div>
            <div className="premium-ring flex flex-1 flex-col justify-center rounded-[1.25rem] border p-5 text-left relative overflow-hidden group hover:border-[#7B61FF]/20 transition-all duration-300" style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}>
              <Shield className="h-4.5 w-4.5 text-[#7B61FF]" strokeWidth={1.75} />
              <p className="mt-2.5 font-display text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                Studio-grade guardrails
              </p>
              <p className="mt-1.5 text-xs text-[var(--text-subtle)] leading-relaxed">
                Compute isolated guardrails and export frameworks built strictly for high-value pipelines.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Highlights strip */}
        <motion.div
          className="flex flex-wrap items-stretch justify-center gap-3 w-full"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: reduce ? 0 : 0.08 }}
        >
          {highlights.map((h) => (
            <div
              key={h.label}
              className="premium-ring flex min-w-[200px] flex-1 flex-col rounded-xl border px-5 py-3.5 text-center sm:min-w-0 backdrop-blur-sm transition-all duration-300 hover:border-brand-purple/20"
              style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            >
              <span className="text-[9px] font-mono tracking-[0.15em] text-[#7B61FF] uppercase font-bold">
                {h.label}
              </span>
              <span className="mt-1.5 text-xs text-[var(--text-muted)] leading-normal">
                {h.detail}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ====================================================================== */}
        {/* NARRATIVE SECTION: THE SOVEREIGN INTENT (Brand Philosophy Centered) */}
        {/* ====================================================================== */}
        <section className="flex flex-col items-center pt-20 border-t border-[var(--border-subtle)] text-center max-w-6xl mx-auto w-full space-y-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <span className="text-[9px] font-mono tracking-[0.15em] text-[#FF2E9A] uppercase font-extrabold block">
              BRAND PHILOSOPHY
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
              A Legacy of Uncompromising Authorship
            </h2>
            <div className="h-[1.5px] w-16 bg-gradient-to-r from-[#7B61FF] via-[#00D4FF] to-[#FF2E9A] mx-auto mt-4" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="space-y-5 text-neutral-400 text-xs sm:text-sm leading-relaxed font-light"
          >
            <p>
              Whether you are drawing the primary style outline for a cinematic deck, modeling visual continuity across a campaign, or routing latency-directed lookups for global creative studios, RUHGEN secures your canvas parameters. Through our{" "}
              <span
                style={{ fontFamily: "var(--font-calsans)" }}
                className="text-[#FF2E9A] uppercase tracking-wider text-[9px] font-bold"
              >
                SOVEREIGN ENCRYPTION
              </span>{" "}
              protocol, your design parameters remain sovereign—protected from weight theft, pipeline congestion, and public metadata scraping.
            </p>
            <p className="text-neutral-500">
              We build for a future where generative systems respect the creator. Power is nothing without agency, and creative authorship is non-negotiable.
            </p>
          </motion.div>

          {/* Symmetrical credentials grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl mx-auto pt-4">
            <div
              className="premium-ring rounded-xl border p-5 text-center backdrop-blur-sm relative overflow-hidden group hover:border-[#00D4FF]/20 transition-all duration-300"
              style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            >
              <span className="text-[9px] font-mono text-[var(--text-subtle)] uppercase block tracking-wider font-bold">
                AESTHETIC AUTHENTICITY
              </span>
              <span className="font-display text-base font-bold text-[var(--text-primary)] mt-1 block">
                Prestige Grade Calibration
              </span>
              <span className="text-xs text-[var(--text-subtle)] font-sans block mt-1.5 leading-relaxed">
                Outputs are calibrated to professional production monitors, ensuring perfect exposure.
              </span>
            </div>
            <div
              className="premium-ring rounded-xl border p-5 text-center backdrop-blur-sm relative overflow-hidden group hover:border-[#7B61FF]/20 transition-all duration-300"
              style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
            >
              <span className="text-[9px] font-mono text-[var(--text-subtle)] uppercase block tracking-wider font-bold">
                COMPUTE SECURITY
              </span>
              <span className="font-display text-base font-bold text-[var(--text-primary)] mt-1 block">
                Sovereign Hosting
              </span>
              <span className="text-xs text-[var(--text-subtle)] font-sans block mt-1.5 leading-relaxed">
                All routing and compute processing run via isolated, secure tunnels for client confidentiality.
              </span>
            </div>
          </div>
        </section>

        {/* ====================================================================== */}
        {/* THE THREE PILLARS OF PRESTIGE */}
        {/* ====================================================================== */}
        <section className="flex flex-col items-center pt-20 border-t border-[var(--border-subtle)] text-center w-full space-y-10">
          <div className="space-y-3 max-w-5xl mx-auto">
            <span className="text-[9px] font-mono tracking-[0.15em] text-[#00D4FF] uppercase block font-bold">
              DESIGN SPECIFICATIONS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
              Foundations of Our Architecture
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-light font-sans leading-relaxed max-w-3xl mx-auto">
              A rigid commitment to professional creative needs. Our systems are built around three uncompromising architectural pillars.
            </p>
          </div>

          {/* Pillars cards grid */}
          <div className="grid gap-6 md:grid-cols-3 w-full pt-4">
            {PILLARS.map((pillar, idx) => (
              <motion.div
                key={pillar.num}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                onMouseEnter={() => setHoveredPillar(idx)}
                onMouseLeave={() => setHoveredPillar(null)}
                className="premium-ring group relative flex flex-col justify-between overflow-hidden rounded-[1.25rem] border p-6 sm:p-7 min-h-[360px] transition-all duration-300 backdrop-blur-2xl"
                style={{
                  background: "var(--glass)",
                  borderColor:
                    hoveredPillar === idx
                      ? idx === 0
                        ? "rgba(123,97,255,0.2)"
                        : idx === 1
                        ? "rgba(0,212,255,0.2)"
                        : "rgba(255,46,154,0.2)"
                      : "var(--border-subtle)",
                }}
              >
                {/* Glow backgrounds */}
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-[0.1] blur-3xl transition-all duration-500 group-hover:scale-125"
                  style={{
                    background: idx === 0 ? "#7B61FF" : idx === 1 ? "#00D4FF" : "#FF2E9A",
                  }}
                />

                <div className="relative text-left space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-black text-[var(--text-primary)]/5" style={{ fontFamily: "var(--font-calsans)" }}>
                      {pillar.num}
                    </span>
                    {idx === 0 ? (
                      <Palette className="h-4 w-4 text-brand-purple opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                    ) : idx === 1 ? (
                      <Zap className="h-4 w-4 text-brand-cyan opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                    ) : (
                      <Shield className="h-4 w-4 text-brand-pink opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
                    {pillar.title}
                  </h3>
                  <span className="text-[8px] font-mono tracking-wider text-[var(--text-subtle)] uppercase block font-bold">
                    {pillar.subtitle}
                  </span>
                  <p className="text-[var(--text-muted)] text-xs font-light leading-relaxed font-sans">
                    {pillar.description}
                  </p>
                </div>

                {/* Benefit (ESTABLISHED VALUE) with selective highlight */}
                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-1 mt-auto relative z-10">
                  <span className="text-[8px] font-mono text-[var(--text-subtle)] uppercase block tracking-wider font-bold">
                    ESTABLISHED VALUE
                  </span>
                  <p className="text-xs text-[var(--text-primary)] font-sans leading-relaxed tracking-wide text-left">
                    &ldquo;
                    {idx === 0 && (
                      <>
                        Empowers visual directors to establish, lock, and scale a highly tailored{" "}
                        <span style={{ fontFamily: "var(--font-calsans)" }} className="text-[#7B61FF] font-bold">
                          signature style.
                        </span>
                      </>
                    )}
                    {idx === 1 && (
                      <>
                        Enables instant iteration for{" "}
                        <span style={{ fontFamily: "var(--font-calsans)" }} className="text-[#00D4FF] font-bold">
                          film decks
                        </span>{" "}
                        and production deadlines.
                      </>
                    )}
                    {idx === 2 && (
                      <>
                        Guarantees complete style confidentiality for{" "}
                        <span style={{ fontFamily: "var(--font-calsans)" }} className="text-[#FF2E9A] font-bold">
                          elite design firms.
                        </span>
                      </>
                    )}
                    &rdquo;
                  </p>
                </div>

                {/* Stats readout inside the card */}
                <div className="pt-3 mt-4 border-t border-border/50 flex items-center justify-between text-[8px] font-mono text-[var(--text-subtle)] uppercase tracking-widest font-bold">
                  <span>STAT_LOG</span>
                  <span className="text-[var(--text-primary)] font-bold" style={{ fontFamily: "var(--font-calsans)" }}>{pillar.stats}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ====================================================================== */}
        {/* ARCHITECTURAL MANIFESTO CENTERPIECE ( strictly using premium CalSans display ) */}
        {/* ====================================================================== */}
        <motion.section
          className="relative overflow-hidden rounded-[1.75rem] border p-8 sm:p-14 lg:p-20 text-center max-w-5xl mx-auto w-full"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--glass-elevated)",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.15)",
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Subtle frame indicators */}
          <div className="absolute top-3 left-3 font-mono text-[6px] text-neutral-600 tracking-widest">
            CALIBRATION_COEF // SEC_09
          </div>
          <div className="absolute top-3 right-3 font-mono text-[6px] text-neutral-600 tracking-widest">
            AESTHETIC_SYSTEMS_CAL
          </div>
          <div className="absolute bottom-3 left-3 font-mono text-[6px] text-neutral-600 tracking-widest">
            AUTH_PROTOCOL // LOCKED
          </div>
          <div className="absolute bottom-3 right-3 font-mono text-[6px] text-neutral-600 tracking-widest">
            RUHGEN_CORE_v2.0
          </div>

          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background:
                "radial-gradient(ellipse 80% 80% at 50% 0%, rgba(123,97,255,0.06), transparent 50%), radial-gradient(ellipse 60% 60% at 50% 100%, rgba(255,46,154,0.03), transparent 50%)",
            }}
          />

          <div className="relative z-10 space-y-6 max-w-4xl mx-auto flex flex-col items-center justify-center">
            <span className="text-[9px] font-mono tracking-[0.15em] text-[#FF2E9A] uppercase font-extrabold block">
              THE MANIFESTO
            </span>

            {/* strictly using premium CalSans display font inside blockquote */}
            <blockquote
              className="text-lg sm:text-2xl lg:text-3xl text-[var(--text-primary)] leading-relaxed tracking-widest font-bold uppercase"
              style={{ fontFamily: "var(--font-calsans)" }}
            >
              &ldquo;OUR CANVAS DOESN&apos;T BELONG TO THE MACHINE. WE CREATE TOOLS TO AUGMENT VISUAL AUTHORSHIP, RETURNING CONTROL TO THOSE WHO DESIGN, DIRECT, AND SHIP THE WORLD&apos;S MOST BEAUTIFUL NARRATIVES.&rdquo;
            </blockquote>

            <div className="flex items-center justify-center gap-3 pt-3">
              <span className="h-[1px] w-8 bg-[var(--border-subtle)]" />
              <cite className="font-mono text-[8px] text-[var(--text-subtle)] uppercase tracking-[0.2em] font-extrabold not-italic">
                RUHGEN FOUNDING ARCHITECTS // 2026
              </cite>
              <span className="h-[1px] w-8 bg-[var(--border-subtle)]" />
            </div>
          </div>
        </motion.section>

        {/* ====================================================================== */}
        {/* TIMELINE: THE CHRONICLE */}
        {/* ====================================================================== */}
        <section className="flex flex-col items-center pt-20 border-t border-[var(--border-subtle)] text-center max-w-6xl mx-auto w-full space-y-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-3 max-w-3xl"
          >
            <span className="text-[9px] font-mono tracking-[0.15em] text-[#00D4FF] uppercase block font-bold">
              THE CHRONICLE OF EVOLUTION
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
              Archival Chronicle
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-light font-sans leading-relaxed max-w-2xl mx-auto">
              Focus is a finite resource—we invest it strictly in engineered calibration.
            </p>
          </motion.div>

          {/* Symmetrical Centered Selector Tabs */}
          <div className="flex items-center justify-center gap-3 bg-[color-mix(in_srgb,var(--text-primary)_1%,transparent)] border border-[var(--border-subtle)] p-1 rounded-xl max-w-[240px] mx-auto w-full relative z-10">
            {EPOCHS.map((epoch, idx) => (
              <button
                key={epoch.year}
                onClick={() => setActiveEpoch(idx)}
                className="flex-1 py-2 px-4 text-xs font-semibold rounded-lg tracking-wider transition-all duration-300 cursor-pointer"
                style={{
                  fontFamily: "var(--font-calsans)",
                  background: activeEpoch === idx ? "var(--glass-elevated)" : "transparent",
                  color: activeEpoch === idx ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {epoch.year}
              </button>
            ))}
          </div>

          {/* Centered Epoch Content Panel (Soft Fade transition) */}
          <motion.div
            key={activeEpoch}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="premium-ring relative w-full overflow-hidden rounded-[1.75rem] border p-6 sm:p-10 text-center"
            style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
          >
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-[0.1] blur-3xl transition-opacity duration-500"
              style={{
                background: activeEpoch === 0 ? "#7B61FF" : "#FF2E9A",
              }}
            />

            <div className="relative max-w-4xl mx-auto space-y-5 flex flex-col items-center justify-center">
              <span className="text-[9px] font-mono text-[#00D4FF] uppercase tracking-[0.15em] font-bold block">
                {EPOCHS[activeEpoch].milestone}
              </span>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-tight">
                {EPOCHS[activeEpoch].title}
              </h3>

              <p
                className="text-[var(--text-primary)] text-sm sm:text-base leading-relaxed font-light italic max-w-3xl mx-auto"
                style={{ fontFamily: "var(--font-ningetan)" }}
              >
                &ldquo;{EPOCHS[activeEpoch].tagline}&rdquo;
              </p>

              <div className="h-[1px] w-12 bg-[var(--border-subtle)] mx-auto my-2" />

              <p className="text-[var(--text-muted)] text-xs sm:text-sm leading-relaxed font-light font-sans max-w-3xl mx-auto">
                {EPOCHS[activeEpoch].description}
              </p>

              {/* Centered metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full pt-6 max-w-4xl mx-auto">
                {EPOCHS[activeEpoch].metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="border rounded-lg p-3.5 flex flex-col items-center justify-center"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
                  >
                    <span className="text-lg font-bold tracking-tight text-[var(--text-primary)] premium-text-shimmer" style={{ fontFamily: "var(--font-calsans)" }}>
                      {metric.value}
                    </span>
                    <span className="text-[8px] font-mono text-[var(--text-subtle)] uppercase tracking-wider mt-0.5 font-bold">
                      {metric.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ====================================================================== */}
        {/* JOIN THE COLLECTIVE / CTA */}
        {/* ====================================================================== */}
        <motion.section
          id="join"
          className="relative scroll-mt-24 overflow-hidden rounded-[1.75rem] border p-8 sm:p-14 lg:p-18 w-full text-center"
          style={{
            borderColor: "var(--border-subtle)",
            background: "linear-gradient(135deg, rgba(123,97,255,0.04) 0%, var(--glass) 50%, rgba(255,46,154,0.03) 100%)",
            backdropFilter: "blur(24px) saturate(180%)",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.15)",
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              background:
                "radial-gradient(ellipse 80% 80% at 50% 0%, rgba(123,97,255,0.2), transparent 60%), radial-gradient(ellipse 60% 60% at 50% 100%, rgba(0,212,255,0.1), transparent 50%)",
            }}
          />

          <div className="relative flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--text-primary)_1%,transparent)] px-3 py-1 text-[8px] tracking-[0.15em] text-[#FF2E9A] uppercase font-bold">
              CAREERS // COMPUTE SYSTEMS
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-none">
              Bring your reel and <br />
              your systems thinking
            </h2>

            <p className="text-[var(--text-muted)] text-xs sm:text-sm font-light leading-relaxed font-sans max-w-xl">
              We are constantly seeking{" "}
              <span style={{ fontFamily: "var(--font-ningetan)" }} className="text-[var(--text-primary)] text-base px-0.5 inline font-normal">
                visual architects
              </span>
              , software craftspeople, and{" "}
              <span
                style={{ fontFamily: "var(--font-signatie)", textTransform: "none" }}
                className="text-[#00D4FF] text-base font-normal"
              >
                filmmakers
              </span>{" "}
              who blur the line between visual storytelling and high-performance deep hardware engineering. Send a note with work you are proud of.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center pt-3">
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white btn-gradient transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_24px_rgba(123,97,255,0.2)]"
                style={{ fontFamily: "var(--font-calsans)" }}
              >
                Submit Credentials
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/platform"
                className="w-full sm:w-auto inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-[var(--text-muted)] border border-[color-mix(in_oklab,var(--border-subtle)_60%,transparent)] bg-[color-mix(in_oklab,var(--glass)_70%,transparent)] hover:bg-[color-mix(in_oklab,var(--glass)_100%,transparent)] hover:text-[var(--text-primary)] transition-all duration-300"
                style={{ fontFamily: "var(--font-calsans)" }}
              >
                Explore Platform
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
