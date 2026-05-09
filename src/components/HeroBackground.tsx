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
const TRACK_SPEEDS = [0.05, 0.08, 0.06]; // Relative speeds for parallax

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
        x: (clientX / innerWidth - 0.5) * (config.parallaxIntensity * 2),
        y: (clientY / innerHeight - 0.5) * (config.parallaxIntensity * 2),
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

  if (!mounted) return <div className="absolute inset-0 bg-[#050505]" />;

  return (
    <div 
      ref={containerRef}
      className="absolute top-0 left-0 w-full h-[100dvh] overflow-hidden bg-[#050505] perspective-1000 -z-10"
    >
      {/* Main Sliding Content Container */}
      <motion.div
        className="relative h-[120%] w-[120%] -left-[10%] -top-[10%] flex flex-col justify-center gap-4 py-8 pt-20"
        style={{
          x: mousePos.x,
          y: mousePos.y,
        }}
        transition={{ type: "spring", damping: 50, stiffness: 100 }}
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
            scale={idx === 1 ? 1 : 0.95}
          />
        ))}
      </motion.div>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Deep Black Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
        
        {/* Edge Gradual Fades */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-transparent to-[#050505]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/80" />

        {/* Subtle Mesh Glows */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(123, 97, 255, 0.15), transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(0, 212, 255, 0.15), transparent 40%)
            `
          }}
        />


      </div>

      {/* Fine Film Grain */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-30" />
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
  scale
}: { 
  media: HeroBackgroundMedia[], 
  height: string, 
  speed: number, 
  reverse: boolean,
  index: number,
  blur?: boolean,
  scale?: number
}) {
  return (
    <div 
      className="flex whitespace-nowrap py-2 select-none"
      style={{ 
        height,
        filter: blur ? "blur(1.5px)" : "none",
        transform: scale ? `scale(${scale})` : "none",
        opacity: blur ? 0.8 : 1,
        willChange: "transform, filter"
      }}
    >
      <motion.div
        className="flex gap-4 px-2 w-max"
        style={{ willChange: "transform" }}
        animate={{
          x: reverse ? ["-50%", "0%"] : ["0%", "-50%"]
        }}
        transition={{
          duration: 45 / speed,
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
      className="relative h-full rounded-xl bg-[#050505] group shadow-xl flex-shrink-0 cursor-pointer overflow-hidden transform-gpu transition-all duration-300 hover:shadow-2xl hover:z-20"
      style={{ willChange: "transform" }}
    >
      {/* Media Content - Restored Natural Ratio without cropping */}
      {media.type === "video" ? (
        <video
          src={media.src}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-auto max-w-none rounded-xl transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={media.src}
          alt=""
          loading="eager"
          className="h-full w-auto max-w-none rounded-xl transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      )}

      {/* Premium Inner Glow & Shadow */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none rounded-xl" />
      <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] pointer-events-none" />
    </div>
  );
}

export default HeroBackground;
