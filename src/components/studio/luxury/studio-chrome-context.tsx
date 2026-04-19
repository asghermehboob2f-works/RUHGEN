"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type LuxuryStudioChromeValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Narrow viewport or desktop with left column hidden — canvas dock chrome */
  isCanvasFullWidth: boolean;
};

const LuxuryStudioChromeContext = createContext<LuxuryStudioChromeValue | null>(null);

export function useLuxuryStudioChrome(): LuxuryStudioChromeValue | null {
  return useContext(LuxuryStudioChromeContext);
}

function useIsNarrowViewport() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return narrow;
}

export function LuxuryStudioChromeProvider({
  collapsed,
  onToggleCollapsed,
  children,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  children: ReactNode;
}) {
  const isNarrow = useIsNarrowViewport();
  const isCanvasFullWidth = collapsed || isNarrow;

  const value: LuxuryStudioChromeValue = {
    collapsed,
    toggleCollapsed: onToggleCollapsed,
    isCanvasFullWidth,
  };

  return <LuxuryStudioChromeContext.Provider value={value}>{children}</LuxuryStudioChromeContext.Provider>;
}
