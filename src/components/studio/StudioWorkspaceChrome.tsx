"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useId } from "react";

const shellBorder = "var(--border-subtle)";
const glass = "var(--glass)";

type HeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accent: "image" | "video";
  actions: ReactNode;
  crossStudioLink?: { href: string; label: string };
};

export function StudioWorkspaceHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  accent,
  actions,
  crossStudioLink,
}: HeaderProps) {
  const grad =
    accent === "image"
      ? "linear-gradient(145deg, #9B85FF 0%, var(--primary-purple) 42%, #4F3DB8 100%)"
      : "linear-gradient(145deg, #5CF0FF 0%, var(--primary-cyan) 45%, #0891B2 100%)";
  const iconShadow =
    accent === "image"
      ? "0 12px 40px -14px rgba(123, 97, 255, 0.55)"
      : "0 12px 40px -14px rgba(0, 212, 255, 0.5)";
  return (
    <div className="flex shrink-0 flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-6" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center text-white ring-1 ring-white/20 sm:h-12 sm:w-12 ${accent === "image" ? "rounded-2xl" : "rounded-xl"}`}
          style={{ background: grad, boxShadow: iconShadow }}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.65} />
        </span>
        <div className="min-w-0 pt-0.5">
          {eyebrow ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-subtle)" }}>
              {eyebrow}
            </p>
          ) : null}
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${eyebrow ? "mt-2" : ""}`}>
            <h1 className="font-display text-lg font-bold tracking-tight sm:text-xl" style={{ color: "var(--text-primary)" }}>
              {title}
            </h1>
            {crossStudioLink ? (
              <Link
                href={crossStudioLink.href}
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-[var(--glass)]"
                style={{
                  borderColor:
                    accent === "image"
                      ? "color-mix(in srgb, var(--primary-cyan) 32%, var(--border-subtle))"
                      : "color-mix(in srgb, var(--primary-purple) 32%, var(--border-subtle))",
                  color: accent === "image" ? "color-mix(in srgb, var(--primary-cyan) 88%, var(--text-muted))" : "color-mix(in srgb, var(--primary-purple) 88%, var(--text-muted))",
                }}
              >
                {crossStudioLink.label}
                <span aria-hidden className="opacity-70">
                  →
                </span>
              </Link>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
    </div>
  );
}

export function StudioControlDeck({
  title,
  description,
  children,
  accent = "neutral",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  accent?: "image" | "video" | "neutral";
}) {
  const titleId = useId();
  const stripe =
    accent === "image"
      ? "linear-gradient(90deg, #A78BFA, var(--primary-purple), #6D28D9)"
      : accent === "video"
        ? "linear-gradient(90deg, #67E8F9, var(--primary-cyan), #0E7490)"
        : null;
  const deckRound = accent === "image" ? "rounded-3xl" : accent === "video" ? "rounded-xl" : "rounded-2xl";
  const deckRing =
    accent === "image"
      ? "ring-1 ring-violet-400/[0.08]"
      : accent === "video"
        ? "ring-1 ring-cyan-400/[0.12]"
        : "ring-1 ring-white/[0.04]";
  const deckBg =
    accent === "image"
      ? "linear-gradient(165deg, color-mix(in srgb, var(--primary-purple) 9%, var(--soft-black)) 0%, color-mix(in srgb, var(--deep-black) 100%, transparent) 100%)"
      : accent === "video"
        ? "linear-gradient(165deg, color-mix(in srgb, var(--primary-cyan) 8%, var(--soft-black)) 0%, color-mix(in srgb, var(--deep-black) 100%, transparent) 100%)"
        : "linear-gradient(165deg, color-mix(in srgb, var(--soft-black) 100%, transparent) 0%, color-mix(in srgb, var(--deep-black) 95%, transparent) 100%)";
  return (
    <section
      className={`relative overflow-hidden border p-4 sm:p-5 ${deckRound} ${deckRing}`}
      style={{
        borderColor:
          accent === "image"
            ? "color-mix(in srgb, var(--primary-purple) 22%, var(--border-subtle))"
            : accent === "video"
              ? "color-mix(in srgb, var(--primary-cyan) 24%, var(--border-subtle))"
              : shellBorder,
        background: deckBg,
        boxShadow: "0 1px 0 0 color-mix(in srgb, var(--border-subtle) 55%, transparent)",
      }}
      aria-labelledby={titleId}
    >
      {stripe ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-95"
          style={{ background: stripe }}
          aria-hidden
        />
      ) : null}
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id={titleId} className="font-display text-[0.95rem] font-bold tracking-tight sm:text-base" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
        {description ? (
          <p className="text-xs sm:text-[13px]" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function StudioFieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]"
      style={{ color: "var(--text-subtle)" }}
    >
      {children}
    </label>
  );
}

export function StudioSegmented<T extends string>({
  value,
  onChange,
  options,
  disabled,
  name,
  tone = "purple",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  name: string;
  tone?: "purple" | "cyan";
}) {
  const activeRing =
    tone === "cyan"
      ? "0 0 0 1px color-mix(in srgb, var(--primary-cyan) 35%, transparent)"
      : "0 0 0 1px color-mix(in srgb, var(--primary-purple) 30%, transparent)";
  return (
    <div
      className="inline-flex flex-wrap gap-1 rounded-xl border p-1"
      style={{ borderColor: shellBorder, background: "var(--deep-black)" }}
      role="group"
      aria-label={name}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className="min-h-[38px] rounded-lg px-3 text-xs font-semibold transition-all duration-200 sm:min-h-[40px] sm:px-3.5 sm:text-sm enabled:hover:bg-white/[0.04]"
            style={{
              background: on ? glass : "transparent",
              color: on ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: on ? activeRing : undefined,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
