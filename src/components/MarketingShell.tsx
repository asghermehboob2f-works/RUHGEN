"use client";

import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { CursorGlow } from "@/components/CursorGlow";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AmbientBackdrop />
      <CursorGlow />
      <div className="app-grain fixed inset-0 z-[1]" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        {children}
        <Footer />
      </div>
    </>
  );
}
