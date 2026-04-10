"use client";

import type { CSSProperties, ReactNode } from "react";

/** Consistent page header for account / settings flows (user & admin). */
export function ProSettingsHero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-10" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="min-w-0 max-w-2xl">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.22em] sm:text-xs"
          style={{ color: "var(--text-subtle)" }}
        >
          {eyebrow}
        </p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function ProSettingsCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 sm:p-8 ${className}`}
      style={{
        borderColor: "var(--border-subtle)",
        background:
          "linear-gradient(165deg, color-mix(in srgb, var(--soft-black) 100%, transparent) 0%, color-mix(in srgb, var(--deep-black) 92%, transparent) 100%)",
        boxShadow: "0 1px 0 0 color-mix(in srgb, var(--border-subtle) 80%, transparent)",
      }}
    >
      {children}
    </div>
  );
}

export function ProFieldGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function ProLabel({ htmlFor, children, required }: { htmlFor: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider sm:text-[13px]" style={{ color: "var(--text-subtle)" }}>
      {children}
      {required ? <span className="ml-0.5 text-[#FF2E9A]">*</span> : null}
    </label>
  );
}

export const proInputClass =
  "min-h-[48px] w-full rounded-xl border px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#7B61FF]/25 sm:text-base";

export const proInputStyle: CSSProperties = {
  borderColor: "var(--border-subtle)",
  background: "var(--deep-black)",
  color: "var(--text-primary)",
};
