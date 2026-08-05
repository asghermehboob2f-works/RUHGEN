"use client";

import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { useEffect, useState, useRef, useMemo, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
import Image from "next/image";
import type { HeroBackgroundConfig, HeroBackgroundMedia } from "@/backend/site-content/types";
import { useTheme } from "@/components/ThemeProvider";

interface HeroBackgroundProps {
  config: HeroBackgroundConfig;
}

const TRACK_HEIGHTS = [
  "clamp(18vh, 25vw, 28vh)",
  "clamp(22vh, 30vw, 32vh)",
  "clamp(18vh, 25vw, 28vh)"
];
const TRACK_SPEEDS = [0.05, 0.08, 0.06]; // Relative speeds for parallax

export function HeroBackground({ config }: HeroBackgroundProps) {
  const mounted = useIsMounted();
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === "light";
  
  // Motion values for mouse movement parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring configurations for smooth parallax
  const springX = useSpring(mouseX, { damping: 60, stiffness: 80 });
  const springY = useSpring(mouseY, { damping: 60, stiffness: 80 });

  useEffect(() => {
    // Check if device is mobile to optimize tracks
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    if (!config.enableParallax) return () => window.removeEventListener("resize", checkMobile);

    const handleMouseMove = (e: MouseEvent) => {
      // Skip parallax calculations on mobile screens
      if (window.innerWidth < 768) return;

      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX / innerWidth - 0.5) * (config.parallaxIntensity * 3));
      mouseY.set((clientY / innerHeight - 0.5) * (config.parallaxIntensity * 3));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [config.enableParallax, config.parallaxIntensity, mouseX, mouseY]);

  // Create 3 DIFFERENT pools of media for the 3 tracks to ensure ZERO vertical repetition on desktop.
  const tracksMedia = useMemo(() => {
    if (!config.media || config.media.length === 0) return [[], [], []];
    
    const media = config.media;
    const third = Math.ceil(media.length / 3);
    const twoThirds = Math.ceil((media.length * 2) / 3);
    
    return [
      media.slice(0, third),
      media.slice(third, twoThirds),
      media.slice(twoThirds)
    ];
  }, [config.media]);

  if (!mounted || !config.media || config.media.length === 0) return <div className="absolute inset-0 bg-[var(--deep-black)]" />;

  return (
    <div 
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-[100dvh] overflow-hidden bg-[var(--deep-black)] perspective-1000 -z-10"
    >
      <motion.div
        className="relative h-[130%] w-[130%] -left-[15%] -top-[15%] flex flex-col justify-center gap-6 py-8 pt-20"
        style={{
          x: springX,
          y: springY,
        }}
      >
        {tracksMedia.map((media, idx) => (
          <SlidingTrack 
            key={idx}
            media={media}
            height={TRACK_HEIGHTS[idx]}
            speed={TRACK_SPEEDS[idx]}
            reverse={idx === 1} // Middle goes opposite
            index={idx}
            blur={isMobile ? false : (isLight ? false : idx !== 1)} // Disable blur filter on mobile and in light mode
            scale={isMobile ? 1 : (idx === 1 ? 1 : 0.9)} // Disable scale filter on mobile
            opacity={idx === 1 ? (isLight ? 0.9 : 0.95) : (isLight ? 0.75 : 0.7)} // High visibility, no faded wash
          />
        ))}
      </motion.div>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Very Subtle Vignette */}
        <div 
          className="absolute inset-0 transition-colors duration-700" 
          style={{
            background: isLight 
              ? "radial-gradient(circle at center, transparent 80%, var(--deep-black) 100%)"
              : "radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.4) 100%)"
          }}
        />
        
        {/* Edge Gradual Fades (Ultra-Soft) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--deep-black)]/40 via-transparent to-[var(--deep-black)]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--deep-black)]/40 via-transparent to-[var(--deep-black)]/40" />

        {/* Dynamic Shadow Layer (Reduced) */}
        <div className={`absolute inset-0 transition-colors duration-700 ${isLight ? 'bg-white/10' : 'bg-black/20 backdrop-blur-[0.5px]'}`} />
      </div>

      {/* Fine Film Grain */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-30" />
    </div>
  );
}

function SlidingTrack({ 
  media, 
  height, 
  speed, 
  reverse,
  index,
  blur,
  scale,
  opacity
}: { 
  media: HeroBackgroundMedia[], 
  height: string, 
  speed: number, 
  reverse: boolean,
  index: number,
  blur?: boolean,
  scale?: number,
  opacity?: number
}) {
  return (
    <div 
      className="flex whitespace-nowrap py-3 select-none"
      style={{ 
        height,
        filter: blur ? "blur(3px)" : "none",
        transform: scale ? `scale(${scale})` : "none",
        opacity: opacity ?? 1,
        willChange: "transform, filter"
      }}
    >
      <motion.div
        className="flex gap-6 px-3 w-max"
        style={{ willChange: "transform" }}
        animate={{
          x: reverse ? ["-50%", "0%"] : ["0%", "-50%"]
        }}
        transition={{
          duration: 50 / speed,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Render twice for seamless loop */}
        {[...media, ...media].map((item, i) => (
          <TrackItem key={`${item.id}-${i}`} media={item} globalIndex={i + index * 10} />
        ))}
      </motion.div>
    </div>
  );
}

function TrackItem({ media, globalIndex }: { media: HeroBackgroundMedia, globalIndex: number }) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className="relative h-full rounded-2xl bg-[var(--deep-black)] group shadow-2xl flex-shrink-0 cursor-pointer overflow-hidden transform-gpu transition-all duration-500 hover:z-20 border border-[var(--border-subtle)]"
      style={{ willChange: "transform" }}
    >
      {/* Media Content - Natural Ratio */}
      {media.type === "video" ? (
        <video
          src={media.src}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-auto max-w-none rounded-2xl transition-transform duration-1000 ease-out group-hover:scale-[1.05]"
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={media.src}
          alt=""
          loading="eager"
          className="h-full w-auto max-w-none rounded-2xl transition-transform duration-1000 ease-out group-hover:scale-[1.05]"
        />
      )}

      {/* Premium Inner Glow & Shadow */}
      <div 
        className="absolute inset-0 transition-opacity duration-700 group-hover:opacity-20 pointer-events-none rounded-2xl" 
        style={{
          background: isLight 
            ? "linear-gradient(to top, rgba(0,0,0,0.12) 0%, transparent 60%)"
            : "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)"
        }}
      />
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_var(--border-subtle)] pointer-events-none" />
      
      {/* Subtle overlay on hover */}
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--text-primary)_5%,transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </div>
  );
}

export default HeroBackground;
