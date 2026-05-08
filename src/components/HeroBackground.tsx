"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { HeroBackgroundConfig, HeroBackgroundMedia } from "@/backend/site-content/types";

interface HeroBackgroundProps {
  config: HeroBackgroundConfig;
}

const GRID_LAYOUTS = [
  "col-span-2 row-span-2", // 0
  "col-span-1 row-span-1", // 1
  "col-span-1 row-span-2", // 2
  "col-span-1 row-span-1", // 3
  "col-span-1 row-span-1", // 4
  "col-span-2 row-span-1", // 5
  "col-span-1 row-span-1", // 6
  "col-span-1 row-span-1", // 7
  "col-span-1 row-span-2", // 8
  "col-span-2 row-span-1", // 9
  "col-span-1 row-span-1", // 10
  "col-span-1 row-span-1", // 11
];

export function HeroBackground({ config }: HeroBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!config.enableParallax) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: (clientX / innerWidth - 0.5) * config.parallaxIntensity,
        y: (clientY / innerHeight - 0.5) * config.parallaxIntensity,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [config.enableParallax, config.parallaxIntensity]);

  if (!mounted) return <div className="absolute inset-0 bg-black" />;

  // We want to fill 12 grid slots.
  const slots = Array.from({ length: 12 });

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <motion.div
        className="relative h-[110%] w-[110%] -left-[5%] -top-[5%]"
        style={{
          x: mousePos.x,
          y: mousePos.y,
        }}
        transition={{ type: "spring", damping: 40, stiffness: 80 }}
      >
        <div className="grid h-full w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-6 grid-rows-4 gap-[2px]">
          {slots.map((_, i) => (
            <Panel
              key={i}
              mediaPool={config.media}
              i={i}
              config={config}
            />
          ))}
        </div>
      </motion.div>

      {/* Sophisticated Themed Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base dark overlay */}
        <div
          className="absolute inset-0 bg-black"
          style={{
            opacity: config.overlayOpacity,
          }}
        />
        
        {/* Cinematic themed color tint (Cyan, Violet, Pink) */}
        <div
          className="absolute inset-0 mix-blend-screen opacity-30"
          style={{
            background: `
              radial-gradient(circle at 15% 25%, rgba(0, 212, 255, 0.15), transparent 40%),
              radial-gradient(circle at 85% 75%, rgba(139, 92, 246, 0.15), transparent 40%),
              radial-gradient(circle at 50% 50%, rgba(255, 46, 154, 0.08), transparent 50%)
            `,
          }}
        />

        {/* Depth vignette & gradient fades */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        
        {/* Film Grain Texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </div>
  );
}

function Panel({
  mediaPool,
  i,
  config,
}: {
  mediaPool: HeroBackgroundMedia[];
  i: number;
  config: HeroBackgroundConfig;
}) {
  const [currentIndex, setCurrentIndex] = useState((i * 3) % mediaPool.length);

  useEffect(() => {
    if (mediaPool.length <= 1) return;

    const stagger = i * config.staggerDelay * 1000;
    const interval = config.crossfadeDuration * 1000;

    const timeout = setTimeout(() => {
      const cycle = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % mediaPool.length);
      }, interval);
      return () => clearInterval(cycle);
    }, stagger);

    return () => clearTimeout(timeout);
  }, [mediaPool.length, i, config.crossfadeDuration, config.staggerDelay]);

  const currentMedia = mediaPool.length > 0 ? mediaPool[currentIndex % mediaPool.length] : null;

  return (
    <div className={`relative overflow-hidden bg-[#050505] ${GRID_LAYOUTS[i] || ""}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMedia?.id || i}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: config.crossfadeDuration * 0.4, 
            ease: "easeInOut" 
          }}
          className="absolute inset-0"
        >
          {currentMedia && <MediaItem media={currentMedia} />}
        </motion.div>
      </AnimatePresence>
      
      {/* Subtle panel inner themed glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#7B61FF]/5 via-transparent to-[#00D4FF]/5 pointer-events-none" />
    </div>
  );
}

function MediaItem({ media }: { media: HeroBackgroundMedia }) {
  if (media.type === "video") {
    return (
      <video
        src={media.src}
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <Image
      src={media.src}
      alt=""
      fill
      className="object-cover"
      sizes="33vw"
    />
  );
}

export default HeroBackground;
