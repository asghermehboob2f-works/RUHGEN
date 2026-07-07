"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Camera, Sliders, Cpu, Activity, RefreshCw, Layers, Check } from "lucide-react";

type CalibrationArchetype = {
  id: string;
  name: string;
  focal: number;
  aperture: number; // represented as aperture value (e.g. 1.2)
  steps: number;
  accent: string;
  secondary: string;
  description: string;
  seed: string;
};

const ARCHETYPES: CalibrationArchetype[] = [
  {
    id: "noir",
    name: "Cinematic Noir",
    focal: 85,
    aperture: 1.2,
    steps: 85,
    accent: "#7B61FF",
    secondary: "#9C3F8D",
    description: "Deep shadows, dramatic contrast, and ultra-shallow cinematic depth-of-field.",
    seed: "0x8A7E1C"
  },
  {
    id: "neoclassical",
    name: "Neoclassical Marble",
    focal: 135,
    aperture: 2.8,
    steps: 50,
    accent: "#E2B13C",
    secondary: "#FF8C37",
    description: "Soft, uniform studio lighting, immaculate textures, and precise geometry.",
    seed: "0x4F92B3"
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Dense",
    focal: 35,
    aperture: 0.95,
    steps: 120,
    accent: "#00D4FF",
    secondary: "#FF2E9A",
    description: "High saturation, atmospheric vapor haze, holographic nodes, and maximum detail rendering.",
    seed: "0x9C3F8D"
  }
];

export function LatentCalibrationRig() {
  const reduce = useReducedMotion() === true;
  
  // Interactive Slider States
  const [focal, setFocal] = useState(50); // 18mm to 200mm
  const [aperture, setAperture] = useState(1.8); // 0.95 to 16
  const [steps, setSteps] = useState(30); // 10 to 150
  
  const [activeArchId, setActiveArchId] = useState("");
  const activeArchetype = ARCHETYPES.find(a => a.id === activeArchId);
  
  // Custom interactive grid state
  const gridRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // percentages
  const [isHovered, setIsHovered] = useState(false);
  const [lastCalibrationTime, setLastCalibrationTime] = useState("0s ago");
  const [triggerFlash, setTriggerFlash] = useState(false);

  // Apply archetype settings
  const applyArchetype = (arch: CalibrationArchetype) => {
    setTriggerFlash(true);
    setTimeout(() => setTriggerFlash(false), 500);

    setActiveArchId(arch.id);
    setFocal(arch.focal);
    setAperture(arch.aperture);
    setSteps(arch.steps);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMousePos({ x, y });
  };

  useEffect(() => {
    // Reset active archetype if user manually adjusts sliders away from the archetype bounds
    if (activeArchetype) {
      if (
        focal !== activeArchetype.focal || 
        aperture !== activeArchetype.aperture || 
        steps !== activeArchetype.steps
      ) {
        setActiveArchId("");
      }
    }
  }, [focal, aperture, steps, activeArchetype]);

  // Derived styling constants
  const currentAccent = activeArchetype ? activeArchetype.accent : "#7B61FF";
  const currentSecondary = activeArchetype ? activeArchetype.secondary : "#00D4FF";

  // Ray diagram mathematical calculations
  // Angle of view decreases as focal length increases
  // 18mm -> wide angle rays, 200mm -> narrow parallel rays
  const wideAngle = Math.max(8, 60 - ((focal - 18) / 182) * 52);

  // Blur intensity represented visually
  const blurRadius = Math.max(0, (2.8 - aperture) * 8 + (focal / 20));

  return (
    <div className="relative w-full select-none">
      {/* Ambient background glow linking slider state to active theme */}
      <div 
        className="absolute -inset-8 opacity-[0.12] blur-3xl rounded-[3rem] transition-all duration-700 pointer-events-none" 
        style={{
          background: `radial-gradient(circle at 50% 50%, ${currentAccent} 0%, ${currentSecondary} 50%, transparent 100%)`
        }}
      />

      {/* Main Luxury Bezel Cabinet */}
      <div
        className="relative overflow-hidden rounded-2xl p-[1.5px] shadow-[0_32px_80px_rgba(0,0,0,0.35),0_0_0_1px_var(--border-subtle)_inset] transition-all duration-500 hover:shadow-[0_40px_90px_rgba(0,0,0,0.4)]"
        style={{
          background:
            "linear-gradient(135deg, var(--border-subtle) 0%, transparent 50%, rgba(123,97,255,0.12) 100%)",
        }}
      >
        <div
          className="relative min-h-[460px] overflow-hidden rounded-[0.9375rem] flex flex-col justify-between"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 10% -10%, rgba(123,97,255,0.08), transparent 60%), radial-gradient(ellipse 70% 55% at 105% 110%, rgba(0,212,255,0.06), transparent 55%), var(--deep-black)",
          }}
        >
          {/* Subtle grid backdrop */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />

          {/* Traffic lights / macOS bar */}
          <div className="relative z-20 flex items-center justify-between px-5 py-4 border-b border-border/50 bg-card/45 backdrop-blur-md">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/70 hover:bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/70 hover:bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/70 hover:bg-[#27c93f]" />
            </div>
            
            <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-muted-foreground uppercase select-none truncate">
              RUHGEN // LATENT_CALIBRATION_STUDIO
            </span>

            <div className="flex items-center gap-1.5 font-mono text-[8px] text-[#00d4ff] px-2 py-0.5 rounded border border-[#00d4ff]/25 bg-[#00d4ff]/5 font-bold uppercase select-none">
              <span className="w-1 h-1 rounded-full bg-[#00d4ff] animate-pulse" />
              INTELLIGENT TELEMETRY
            </div>
          </div>

          {/* Top Panel: Calibration Viewport (Visualizers) */}
          <div className="grid gap-4 p-5 md:grid-cols-[1.2fr_0.8fr] items-stretch flex-1 border-b border-border/50">
            
            {/* Left Box: SVG Focal Ray Diagram & Density Waves */}
            <div className="relative min-h-[220px] rounded-xl border border-border/60 bg-card/30 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
              {/* Compiler crosshair dots */}
              <div className="absolute inset-0 opacity-[0.012] bg-[linear-gradient(var(--text-primary)_1px,transparent_1px),linear-gradient(90deg,var(--text-primary)_1px,transparent_1px)] bg-[size:10px_10px]" />
              
              {/* Header metrics */}
              <div className="relative z-10 flex justify-between items-center font-mono text-[8px] text-neutral-500 uppercase tracking-wider">
                <span>VIEWPORT // OPTICAL RAY SIMULATOR</span>
                <span className="text-[#00D4FF]">DOP_MATRIX: ACTIVE</span>
              </div>

              {/* Central SVG Camera Optical Ray and Aperture blades */}
              <div className="relative flex-1 flex items-center justify-center min-h-[130px] my-2">
                
                {/* Simulated depth-of-field overlay blur ring */}
                <div 
                  className="absolute h-24 w-24 rounded-full border border-dashed opacity-10 flex items-center justify-center transition-all duration-300"
                  style={{
                    borderColor: currentAccent,
                    filter: `blur(${Math.max(0, blurRadius / 4)}px)`,
                    transform: `scale(${1 + (blurRadius / 30)})`
                  }}
                />

                <svg className="w-full h-full max-h-[140px]" viewBox="0 0 320 120" fill="none">
                  <defs>
                    <linearGradient id="ray-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={currentAccent} stopOpacity="0.05" />
                      <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.45" />
                      <stop offset="100%" stopColor={currentSecondary} stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="lens-shimmer" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                      <stop offset="100%" stopColor={currentAccent} stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Field of View Ray Lines representing focal length */}
                  {/* Rays start left, converge at center lens (x=160), diverge right */}
                  <g className="transition-all duration-300">
                    {/* Upper field ray */}
                    <path 
                      d={`M 10,${60 - wideAngle} L 160,60 L 310,${60 + wideAngle * 0.7}`} 
                      stroke="url(#ray-grad)" 
                      strokeWidth="1.5" 
                    />
                    {/* Lower field ray */}
                    <path 
                      d={`M 10,${60 + wideAngle} L 160,60 L 310,${60 - wideAngle * 0.7}`} 
                      stroke="url(#ray-grad)" 
                      strokeWidth="1.5" 
                    />
                    {/* Shadow Field fills */}
                    <polygon 
                      points={`10,${60 - wideAngle} 160,60 10,${60 + wideAngle}`} 
                      fill="url(#ray-grad)" 
                      opacity="0.15" 
                    />
                    <polygon 
                      points={`160,60 310,${60 - wideAngle * 0.7} 310,${60 + wideAngle * 0.7}`} 
                      fill="url(#ray-grad)" 
                      opacity="0.08" 
                    />
                  </g>

                  {/* Horizontal sensor optical center line */}
                  <line x1="5" y1="60" x2="315" y2="60" stroke="var(--border-subtle)" strokeDasharray="3, 3" />

                  {/* Lens Element in the Center (glass visual) */}
                  <ellipse 
                    cx="160" 
                    cy="60" 
                    rx="14" 
                    ry="35" 
                    fill="url(#lens-shimmer)" 
                    stroke="var(--border-subtle)" 
                    strokeWidth="1.5" 
                    className="shadow-2xl backdrop-blur-md"
                  />

                  {/* Lens Highlight curve */}
                  <path d="M 152,40 Q 158,60 152,80" stroke="var(--text-muted)" strokeWidth="1" fill="none" />

                  {/* Optical Focal Point indicator */}
                  <circle cx="160" cy="60" r="3" fill="var(--text-primary)" className="shadow-[0_0_12px_var(--text-primary)]" />

                  {/* Sensor element at the far right */}
                  <rect x="306" y="25" width="4" height="70" rx="2" fill="var(--card-bg)" stroke="var(--border-subtle)" />
                  {/* Lens aperture calibration tick labels */}
                  <text x="160" y="112" textAnchor="middle" fill="var(--text-muted)" fontSize="6.5" fontFamily="monospace">
                    LENS: {focal}mm // FOV: {Math.round(wideAngle * 2)}°
                  </text>
                  <text x="306" y="112" textAnchor="end" fill="var(--text-muted)" fontSize="6.5" fontFamily="monospace">
                    FOCAL SENSOR
                  </text>
                  <text x="10" y="112" textAnchor="start" fill="var(--text-muted)" fontSize="6.5" fontFamily="monospace">
                    RAYSOURCE
                  </text>
                </svg>

                {/* Simulated Aperture Blade overlay (shrinks/expands based on aperture value) */}
                <div 
                  className="absolute right-6 top-6 rounded-lg bg-card/70 border border-border/80 p-2 font-mono text-[7px] text-neutral-400 flex flex-col gap-1 transition-all duration-300"
                >
                  <span className="text-[6.5px] uppercase font-bold text-neutral-500">BLUR STRENGTH</span>
                  <span className="text-foreground font-bold">{blurRadius.toFixed(1)}px blur</span>
                  <div className="w-16 h-1 bg-[var(--border-subtle)] rounded overflow-hidden mt-1">
                    <div 
                      className="h-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min(100, (blurRadius / 15) * 100)}%`,
                        backgroundColor: currentAccent
                      }}
                    />
                  </div>
                </div>

              </div>

              {/* Latent density undulating wave at the bottom */}
              <div className="relative border-t border-border/50 pt-2 flex items-center justify-between">
                <span className="font-mono text-[7.5px] text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-[#00d4ff]" />
                  LATENT_DENSITY_WAVE (STEPS: {steps})
                </span>
                
                {/* Looping wave container */}
                <div className="w-36 h-4 overflow-hidden relative opacity-60">
                  <svg className="w-full h-full" viewBox="0 0 144 16" fill="none">
                    <path 
                      d={`M 0,8 Q 18,${8 - (steps/10)} 36,8 T 72,8 T 108,8 T 144,8`} 
                      fill="none" 
                      stroke={currentAccent} 
                      strokeWidth="1.5"
                      className="animate-wave"
                      style={{
                        animationDuration: `${Math.max(0.5, 4.5 - (steps/35))}s`
                      }}
                    />
                  </svg>
                </div>
              </div>

            </div>

            {/* Right Box: Interactive 10x10 Latent Coordinate Map */}
            <div 
              ref={gridRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative min-h-[220px] rounded-xl border border-border/60 bg-card/30 overflow-hidden flex flex-col justify-between p-4 cursor-crosshair group shadow-inner"
            >
              {/* Latent space dot mapping backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(var(--text-primary)_1.5px,transparent_1.5px)] opacity-[0.02]" />

              <div className="relative z-10 flex justify-between font-mono text-[8px] text-neutral-500 uppercase tracking-wider">
                <span>LATENT COORDINATE MAP</span>
                <span className={isHovered ? "text-emerald-400 font-bold" : ""}>
                  {isHovered ? "VECTOR LOCKED" : "SCANNING"}
                </span>
              </div>

              {/* Map grid display */}
              <div className="relative flex-1 w-full flex items-center justify-center my-3.5 border border-border/50 bg-card/20 rounded-lg overflow-hidden">
                
                {/* Horizontal intersecting line */}
                <div 
                  className="absolute left-0 right-0 h-[0.5px] border-t border-dashed transition-all duration-75 pointer-events-none"
                  style={{ 
                    top: `${mousePos.y}%`, 
                    borderColor: isHovered ? `${currentAccent}66` : "var(--border-subtle)" 
                  }}
                />
                
                {/* Vertical intersecting line */}
                <div 
                  className="absolute top-0 bottom-0 w-[0.5px] border-l border-dashed transition-all duration-75 pointer-events-none"
                  style={{ 
                    left: `${mousePos.x}%`, 
                    borderColor: isHovered ? `${currentAccent}66` : "rgba(255,255,255,0.06)" 
                  }}
                />

                {/* Laser focal coordinate indicator */}
                <div 
                  className="absolute w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-75 shadow-lg pointer-events-none"
                  style={{
                    left: `calc(${mousePos.x}% - 8px)`,
                    top: `calc(${mousePos.y}% - 8px)`,
                    borderColor: currentAccent,
                    boxShadow: `0 0 10px ${currentAccent}`,
                    background: `${currentAccent}1e`
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentAccent }} />
                </div>

                {/* Simulated Tensor terminal stream inside grid */}
                <div className="absolute left-2.5 bottom-2.5 font-mono text-[6.5px] text-neutral-500 flex flex-col gap-0.5 bg-card/70 p-1.5 rounded border border-border/50 pointer-events-none">
                  <div className="text-[5.5px] uppercase font-bold text-neutral-600 mb-0.5">TENSOR_STREAM_RAW</div>
                  <div>COORD: X:{(mousePos.x / 100).toFixed(4)} Y:{(mousePos.y / 100).toFixed(4)}</div>
                  <div>SEED: 0x{((mousePos.x * mousePos.y * 13) % 9999).toString(16).toUpperCase()}</div>
                  <div>TENSOR: [{(mousePos.x / 120).toFixed(2)}, -{(mousePos.y / 120).toFixed(2)}]</div>
                </div>

                {/* Static target markers */}
                <div className="absolute top-3 left-3 h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] opacity-30" />
                <div className="absolute bottom-3 right-3 h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] opacity-30" />
                <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] opacity-30" />

                {/* Calibration Matrix Pulse trigger */}
                <AnimatePresence>
                  {triggerFlash && (
                    <motion.div 
                      className="absolute inset-0 bg-white/15 z-10 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Vector readouts */}
              <div className="relative border-t border-border/50 pt-2 flex items-center justify-between font-mono text-[7.5px] text-neutral-400">
                <div className="flex gap-3">
                  <span>VEC_X: <span className="text-foreground">{(mousePos.x/100).toFixed(3)}</span></span>
                  <span>VEC_Y: <span className="text-foreground">{(mousePos.y/100).toFixed(3)}</span></span>
                </div>
                <div className="text-neutral-500">SAMPLER: DPMSOLVER_V3</div>
              </div>
            </div>

          </div>

          {/* Lower Panel: Dial Adjustments & Archetype Quicksets */}
          <div className="p-5 flex flex-col gap-5 bg-card/10">
            
            {/* Calibration Sliders */}
            <div className="grid gap-5 sm:grid-cols-3">
              
              {/* Dial 1: Focal Length */}
              <div className="flex flex-col gap-2 p-3 bg-card/20 border border-border/50 rounded-xl">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-neutral-500" /> FOCAL LENGTH
                  </span>
                  <span className="text-foreground font-bold">{focal}mm</span>
                </div>
                <input 
                  type="range"
                  min="18"
                  max="200"
                  value={focal}
                  onChange={(e) => setFocal(Number(e.target.value))}
                  className="w-full h-1 bg-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] rounded-lg appearance-none cursor-pointer accent-[#7B61FF]"
                  style={{
                    accentColor: currentAccent
                  }}
                />
                <div className="flex justify-between text-[7px] font-mono text-neutral-500">
                  <span>18mm (WIDE)</span>
                  <span>200mm (TELEPHOTO)</span>
                </div>
              </div>

              {/* Dial 2: Aperture / DOF */}
              <div className="flex flex-col gap-2 p-3 bg-card/20 border border-border/50 rounded-xl">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-neutral-500" /> APERTURE (DOF)
                  </span>
                  <span className="text-foreground font-bold">f/{aperture.toFixed(2)}</span>
                </div>
                <input 
                  type="range"
                  min="0.95"
                  max="16"
                  step="0.05"
                  value={aperture}
                  onChange={(e) => setAperture(Number(e.target.value))}
                  className="w-full h-1 bg-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: currentAccent
                  }}
                />
                <div className="flex justify-between text-[7px] font-mono text-neutral-500">
                  <span>f/0.95 (SHALLOW)</span>
                  <span>f/16 (DEEP)</span>
                </div>
              </div>

              {/* Dial 3: Latent Steps */}
              <div className="flex flex-col gap-2 p-3 bg-card/20 border border-border/50 rounded-xl">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-neutral-500" /> DEEP LATENT STEPS
                  </span>
                  <span className="text-foreground font-bold">{steps} steps</span>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="150"
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="w-full h-1 bg-[color-mix(in_srgb,var(--text-primary)_15%,transparent)] rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: currentAccent
                  }}
                />
                <div className="flex justify-between text-[7px] font-mono text-neutral-500">
                  <span>10 (SCHNELL)</span>
                  <span>150 (COMPLEX DEV)</span>
                </div>
              </div>

            </div>

            {/* Quickset Archetype nodes */}
            <div className="border-t border-border/50 pt-4 flex flex-col gap-3">
              <div className="font-mono text-[8px] font-bold tracking-widest text-neutral-500 uppercase text-left">
                CALIBRATE FROM CREATIVE ARCHETYPE PRESETS
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {ARCHETYPES.map((arch) => {
                  const isActive = activeArchId === arch.id;
                  return (
                    <button
                      key={arch.id}
                      onClick={() => applyArchetype(arch)}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition-all duration-300 outline-none relative overflow-hidden group select-none ${
                        isActive ? 
                        "border-border shadow-xl" : 
                        "border-border/40 bg-card/10 hover:bg-card/25 hover:border-border"
                      }`}
                      style={{
                        background: isActive 
                          ? `linear-gradient(135deg, ${arch.accent}14 0%, var(--drawer-bg) 100%)` 
                          : "var(--glass)"
                      }}
                    >
                      {isActive && (
                        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: arch.accent, color: arch.accent }} />
                      )}
                      
                      <span className="font-display text-[11px] font-bold text-foreground transition-colors">
                        {arch.name}
                      </span>
                      <span className="font-mono text-[7px] text-neutral-500 mt-1 uppercase tracking-wider block">
                        CALIBRATE PRESET // {arch.focal}mm
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active description box if archetype selected */}
              {activeArchetype && (
                <motion.div 
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border text-left font-mono text-[9.5px] leading-relaxed transition-all duration-500"
                  style={{
                    borderColor: `${activeArchetype.accent}25`,
                    background: `${activeArchetype.accent}0a`,
                    color: "var(--text-muted)"
                  }}
                >
                  <strong className="text-foreground">{activeArchetype.name}:</strong> {activeArchetype.description} 
                  <span className="block mt-1 text-[7px] text-neutral-500">
                    CONFIG MATRIX: FOCAL: {activeArchetype.focal}mm | APERTURE: f/{activeArchetype.aperture} | LATENT STEPS: {activeArchetype.steps}
                  </span>
                </motion.div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
