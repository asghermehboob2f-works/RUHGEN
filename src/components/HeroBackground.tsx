"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import type { HeroBackgroundConfig, HeroBackgroundMedia } from "@/backend/site-content/types";

interface HeroBackgroundProps {
  config: HeroBackgroundConfig;
}

// Responsive heights for tracks to maintain structure on mobile and desktop
const TRACK_HEIGHTS = ["clamp(18vh, 25vw, 28vh)", "clamp(22vh, 30vw, 32vh)", "clamp(18vh, 25vw, 28vh)"];
const TRACK_SPEEDS = [0.04, 0.07, 0.05]; // Slightly slower for more cinematic feel

export function HeroBackground({ config }: HeroBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse parallax state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    if (!config.enableParallax) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: (clientX / innerWidth - 0.5) * (config.parallaxIntensity * 3),
        y: (clientY / innerHeight - 0.5) * (config.parallaxIntensity * 3),
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [config.enableParallax, config.parallaxIntensity]);

  // Create 3 DIFFERENT pools of media for the 3 tracks to ensure ZERO vertical repetition.
  const tracksMedia = useMemo(() => {
    if (!config.media || config.media.length === 0) return [[], [], []];
    
    // Split the available images into 3 distinct, non-overlapping groups.
    const media = config.media;
    const third = Math.ceil(media.length / 3);
    const twoThirds = Math.ceil((media.length * 2) / 3);
    
    return [
      media.slice(0, third),
      media.slice(third, twoThirds),
      media.slice(twoThirds)
    ];
  }, [config.media]);

  if (!mounted) return <div className="absolute inset-0 bg-[#020202]" />;

  return (
    <div 
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-[100dvh] overflow-hidden bg-[#020202] perspective-1000 -z-10"
    >
      <motion.div
        className="relative h-[130%] w-[130%] -left-[15%] -top-[15%] flex flex-col justify-center gap-6 py-8 pt-20"
        style={{
          x: mousePos.x,
          y: mousePos.y,
        }}
        transition={{ type: "spring", damping: 60, stiffness: 80 }}
      >
        {tracksMedia.map((media, idx) => (
          <SlidingTrack 
            key={idx}
            media={media}
            height={TRACK_HEIGHTS[idx]}
            speed={TRACK_SPEEDS[idx]}
            reverse={idx === 1} // Middle goes opposite
            index={idx}
            blur={idx !== 1} // Add a subtle blur to outer tracks for depth
            scale={idx === 1 ? 1 : 0.9}
            opacity={idx === 1 ? 0.95 : 0.7} // Maximum visibility
          />
        ))}
      </motion.div>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Very Subtle Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
        
        {/* Edge Gradual Fades (Ultra-Soft) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020202]/40 via-transparent to-[#020202]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020202]/40 via-transparent to-[#020202]/40" />

        {/* Dynamic Shadow Layer (Reduced) */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]" />
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
  return (
    <div
      className="relative h-full rounded-2xl bg-[#020202] group shadow-2xl flex-shrink-0 cursor-pointer overflow-hidden transform-gpu transition-all duration-500 hover:z-20 border border-white/5"
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 transition-opacity duration-700 group-hover:opacity-20 pointer-events-none rounded-2xl" />
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-none" />
      
      {/* Subtle overlay on hover */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </div>
  );
}

export default HeroBackground;
