"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, History, Image as ImageIcon, Video, Wand2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { readRecentGenerations } from "@/lib/studio-activity";

export function DashboardRecentActivity({ userId }: { userId: string }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [focusBump, setFocusBump] = useState(0);

  useEffect(() => {
    const onFocus = () => setFocusBump((n) => n + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname / focusBump intentionally refresh reads from localStorage
  const recent = useMemo(() => readRecentGenerations(userId), [userId, pathname, focusBump]);

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : 0.25 }}
      className="rounded-3xl border p-6 sm:p-8"
      style={{
        borderColor: "var(--border-subtle)",
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--soft-black) 100%, transparent) 0%, color-mix(in srgb, var(--deep-black) 100%, transparent) 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: "var(--glass)" }}
        >
          <History className="h-5 w-5" style={{ color: "var(--text-muted)" }} strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Recent activity
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {recent.length > 0
              ? "Finished outputs from your image and video studios (saved on this device)."
              : "Your generations will appear here once you start creating."}
          </p>
        </div>
      </div>
      {recent.length === 0 ? (
        <div
          className="mt-6 flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-10 text-center"
          style={{
            borderColor: "var(--border-subtle)",
            background: "color-mix(in srgb, var(--deep-black) 40%, transparent)",
          }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl border"
            style={{ borderColor: "var(--border-subtle)", background: "var(--glass)" }}
          >
            <Wand2 className="h-7 w-7 opacity-50" style={{ color: "var(--primary-purple)" }} strokeWidth={1.5} />
          </span>
          <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
            No generations yet. Open a studio and your recent work will show up here.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/dashboard/generate/image"
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-[var(--primary-cyan)] underline-offset-4 hover:underline"
            >
              Image studio
            </Link>
            <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
              ·
            </span>
            <Link
              href="/dashboard/generate/video"
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl px-4 text-sm font-semibold text-[var(--primary-cyan)] underline-offset-4 hover:underline"
            >
              Video studio
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((item, idx) => (
            <motion.li
              key={item.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.04 * idx }}
            >
              <Link
                href={item.href}
                className="group flex flex-col overflow-hidden rounded-2xl border transition-colors hover:border-[color-mix(in_srgb,var(--primary-cyan)_35%,var(--border-subtle))]"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "color-mix(in srgb, var(--deep-black) 55%, transparent)",
                }}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                  {item.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote generation URLs; not in next/image config
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <video
                      src={item.previewUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  )}
                  <span
                    className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: "color-mix(in srgb, var(--soft-black) 88%, transparent)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {item.kind === "image" ? (
                      <ImageIcon className="h-3 w-3" strokeWidth={2} />
                    ) : (
                      <Video className="h-3 w-3" strokeWidth={2} />
                    )}
                    {item.kind === "image" ? "Image" : "Video"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="line-clamp-2 text-left text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                    {item.prompt}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-cyan)]">
                    Open studio
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                  </span>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}
