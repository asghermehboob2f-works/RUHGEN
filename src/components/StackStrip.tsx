"use client";

const tools = [
  "Unreal Engine",
  "Blender",
  "After Effects",
  "Figma",
  "DaVinci Resolve",
  "Houdini",
  "Unity",
  "Photoshop",
  "Nuke",
  "Webhooks & API",
];

export function StackStrip() {
  return (
    <section
      className="border-b py-8 sm:py-12"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--rich-black)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center gap-5 text-center sm:gap-8">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "var(--text-subtle)" }}
            >
              Pipeline-ready
            </p>
            <p
              className="font-display mt-2 text-lg font-semibold sm:text-2xl"
              style={{ color: "var(--text-primary)" }}
            >
              Drop into the tools you already use
            </p>
            <p
              className="mx-auto mt-2 max-w-xl text-xs sm:text-base"
              style={{ color: "var(--text-muted)" }}
            >
              PNG sequences, ProRes, EXR, and layer-friendly passes—built for real
              production, not just demos.
            </p>
          </div>
          <div className="flex max-w-4xl flex-wrap justify-center gap-1.5 sm:gap-2.5">
            {tools.map((t) => (
              <span
                key={t}
                className="rounded-full border px-3 py-1.5 text-[11px] font-medium sm:px-4 sm:py-2 sm:text-sm"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "var(--glass)",
                  color: "var(--text-muted)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
