"use client";

import { AmbientBackdrop } from "@/components/AmbientBackdrop";
import { CursorGlow } from "@/components/CursorGlow";
import { Footer } from "@/components/Footer";
import { MobileDockNav } from "@/components/MobileDockNav";
import { Navbar } from "@/components/Navbar";

export function MarketingShell({
  children,
  hideFooter = false,
}: {
  children: React.ReactNode;
  hideFooter?: boolean;
}) {
  return (
    <>
      <AmbientBackdrop />
      <CursorGlow />
      <div className="app-grain fixed inset-0 z-[1]" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center">{children}</div>
        {!hideFooter && <Footer />}
        <MobileDockNav />
      </div>
    </>
  );
}
