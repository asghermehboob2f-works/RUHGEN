"use client";

import { useEffect, useState } from "react";

const DEFAULT_ID = "";

export function useActiveSection(
  sectionIds: readonly string[],
  rootMargin = "-42% 0px -48% 0px"
) {
  const [activeId, setActiveId] = useState(DEFAULT_ID);
  const key = sectionIds.join("|");

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (elements.length === 0) {
      setActiveId(DEFAULT_ID);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin, threshold: [0.08, 0.2, 0.35, 0.5] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` tracks sectionIds
  }, [key, rootMargin]);

  return activeId;
}
