type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: Props) {
  return (
    <header className="mb-12 text-center sm:mb-16 md:text-left">
      {eyebrow && (
        <p
          className="mb-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
          style={{ color: "var(--text-subtle)" }}
        >
          {eyebrow}
        </p>
      )}
      <h1
        className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h1>
      {description && (
        <p
          className="mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg md:mx-0"
          style={{ color: "var(--text-muted)" }}
        >
          {description}
        </p>
      )}
    </header>
  );
}
