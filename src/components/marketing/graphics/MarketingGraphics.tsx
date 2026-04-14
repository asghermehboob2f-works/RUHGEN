/** Inline SVGs — brand tokens via currentColor where possible */

export function GraphicDemoConsole({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="demo-g1" x1="0" y1="0" x2="400" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B61FF" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#00D4FF" stopOpacity="0.2" />
          <stop offset="1" stopColor="#FF2E9A" stopOpacity="0.15" />
        </linearGradient>
        <filter id="demo-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <rect x="24" y="32" width="352" height="216" rx="20" fill="url(#demo-g1)" opacity="0.5" />
      <rect x="40" y="48" width="320" height="184" rx="14" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="rgba(5,5,5,0.4)" />
      <rect x="56" y="64" width="120" height="72" rx="8" fill="rgba(123,97,255,0.25)" />
      <rect x="188" y="64" width="156" height="12" rx="4" fill="rgba(255,255,255,0.08)" />
      <rect x="188" y="84" width="120" height="8" rx="3" fill="rgba(255,255,255,0.06)" />
      <circle cx="320" cy="168" r="28" fill="#00D4FF" opacity="0.35" filter="url(#demo-blur)" />
      <path
        d="M72 200h256"
        stroke="url(#demo-g1)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="100" cy="200" r="4" fill="#7B61FF" />
      <circle cx="200" cy="200" r="4" fill="#00D4FF" />
      <circle cx="300" cy="200" r="4" fill="#FF2E9A" />
    </svg>
  );
}

export function GraphicFilmStrip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 420 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="film-g" x1="0" y1="0" x2="420" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7B61FF" />
          <stop offset="1" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      <rect x="20" y="40" width="380" height="160" rx="12" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="rgba(10,10,10,0.5)" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x={44 + i * 120}
            y="64"
            width="100"
            height="56"
            rx="6"
            fill={`rgba(${123 - i * 20}, ${97 + i * 15}, 255, 0.15)`}
            stroke="rgba(255,255,255,0.08)"
          />
          <circle cx={64 + i * 120} cy="148" r="3" fill="rgba(255,255,255,0.25)" />
          <circle cx={84 + i * 120} cy="148" r="3" fill="rgba(255,255,255,0.25)" />
        </g>
      ))}
      <path d="M40 200h340" stroke="url(#film-g)" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
    </svg>
  );
}

export function GraphicGalleryMosaic({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 380 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="10" y="20" width="170" height="120" rx="10" fill="rgba(123,97,255,0.2)" stroke="rgba(255,255,255,0.08)" />
      <rect x="200" y="20" width="170" height="80" rx="10" fill="rgba(0,212,255,0.15)" stroke="rgba(255,255,255,0.08)" />
      <rect x="200" y="110" width="80" height="90" rx="8" fill="rgba(255,46,154,0.12)" stroke="rgba(255,255,255,0.06)" />
      <rect x="290" y="110" width="80" height="90" rx="8" fill="rgba(123,97,255,0.12)" stroke="rgba(255,255,255,0.06)" />
      <rect x="10" y="150" width="170" height="120" rx="10" fill="rgba(0,212,255,0.1)" stroke="rgba(255,255,255,0.08)" />
    </svg>
  );
}

export function GraphicPricingScale({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 360 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="20" y="60" width="100" height="50" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
      <rect x="130" y="40" width="100" height="70" rx="8" fill="rgba(123,97,255,0.2)" stroke="rgba(123,97,255,0.45)" />
      <rect x="240" y="30" width="100" height="80" rx="8" fill="rgba(0,212,255,0.12)" stroke="rgba(0,212,255,0.35)" />
      <text x="70" y="100" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="system-ui">
        Free
      </text>
      <text x="180" y="100" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9" fontFamily="system-ui">
        Pro
      </text>
      <text x="290" y="100" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9" fontFamily="system-ui">
        Studio
      </text>
    </svg>
  );
}
