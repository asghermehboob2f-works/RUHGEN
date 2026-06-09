"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const FEATURES = [
  "510 Credits Included",
  "Advanced Image Generation",
  "Advanced Video Generation",
  "Up to 4K Quality",
  "Priority Rendering",
  "Commercial Usage Rights",
  "Premium Creative Tools",
  "Email Support",
];

const CHART_Y = [32, 26, 29, 18, 22, 12, 15, 5];

export function PricingHeroGraphic() {
  const reduce = useReducedMotion() === true;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) { setCount(510); return; }
    const t = setTimeout(() => {
      let n = 0;
      const iv = setInterval(() => {
        n = Math.min(n + 14, 510);
        setCount(n);
        if (n >= 510) clearInterval(iv);
      }, 25);
    }, 900);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <div className="relative mx-auto" style={{ width: 420, height: 560 }} aria-hidden="true">

      {/* ── Deep ambient glow ── */}
      <div className="absolute pointer-events-none" style={{
        inset: "-60px",
        background: "radial-gradient(ellipse 70% 55% at 48% 52%, rgba(0,212,255,0.13) 0%, rgba(123,97,255,0.2) 45%, transparent 70%)",
        filter: "blur(50px)",
        zIndex: 0,
      }} />

      {/* ── Orbital ring 1 ── */}
      <div className="absolute pointer-events-none" style={{
        width: 480, height: 148,
        top: "50%", left: "50%",
        marginTop: -74, marginLeft: -240,
        border: "1px solid rgba(0,212,255,0.14)",
        borderRadius: "50%",
        transform: "perspective(700px) rotateX(78deg)",
        zIndex: 1,
      }}>
        <motion.div
          animate={reduce ? {} : { rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <div style={{
            position: "absolute", top: -4, left: "calc(50% - 4px)",
            width: 8, height: 8, borderRadius: "50%",
            background: "#00D4FF",
            boxShadow: "0 0 10px #00D4FF, 0 0 20px rgba(0,212,255,0.5)",
          }} />
        </motion.div>
      </div>

      {/* ── Orbital ring 2 ── */}
      <div className="absolute pointer-events-none" style={{
        width: 400, height: 110,
        top: "50%", left: "50%",
        marginTop: -55, marginLeft: -200,
        border: "1px solid rgba(123,97,255,0.12)",
        borderRadius: "50%",
        transform: "perspective(700px) rotateX(80deg) rotateZ(35deg)",
        zIndex: 1,
      }}>
        <motion.div
          animate={reduce ? {} : { rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <div style={{
            position: "absolute", bottom: -3, right: "calc(50% - 3px)",
            width: 6, height: 6, borderRadius: "50%",
            background: "#FF2E9A",
            boxShadow: "0 0 8px #FF2E9A, 0 0 16px rgba(255,46,154,0.5)",
          }} />
        </motion.div>
      </div>

      {/* ── Ground glow rings ── */}
      {[220, 300, 380].map((w, i) => (
        <div key={w} className="absolute pointer-events-none" style={{
          width: w, height: w * 0.22,
          bottom: 14, left: "50%",
          marginLeft: -(w / 2),
          border: `1px solid rgba(0,212,255,${0.1 - i * 0.025})`,
          borderRadius: "50%",
          zIndex: 1,
        }} />
      ))}

      {/* ── Main card ── */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute",
          left: "50%", top: "50%",
          width: 240,
          marginLeft: -120, marginTop: -270,
          zIndex: 10,
        }}
      >
        <motion.div
          animate={reduce ? {} : { y: [0, -7, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            padding: 1,
            borderRadius: 22,
            background: "linear-gradient(135deg, #00D4FF 0%, #7B61FF 55%, #00D4FF 100%)",
            boxShadow: "0 0 35px rgba(0,212,255,0.22), 0 0 70px rgba(123,97,255,0.14), 0 48px 90px -20px rgba(0,0,0,0.9)",
          }}
        >
          <div style={{
            borderRadius: 21,
            background: "linear-gradient(175deg, #0b091d 0%, #060411 100%)",
            padding: "20px 18px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* inner aurora */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 120,
              background: "radial-gradient(ellipse 80% 70% at 50% -10%, rgba(0,212,255,0.14), transparent)",
              pointerEvents: "none",
            }} />

            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              padding: "3px 10px", borderRadius: 6, marginBottom: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
                Most Popular
              </span>
            </div>

            {/* Plan name */}
            <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 3 }}>Pro</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>Standard production grade</p>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--font-calsans)", fontSize: 24, fontWeight: 900, color: "rgba(0,212,255,0.9)", lineHeight: 1 }}>₹</span>
              <span style={{ fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em" }}>499</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginLeft: 4 }}>/month</span>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "linear-gradient(90deg, rgba(0,212,255,0.2), rgba(123,97,255,0.12), transparent)", marginBottom: 14 }} />

            {/* Features */}
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 7 }}>
              {FEATURES.map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(0,212,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check style={{ width: 8, height: 8, color: "#00D4FF", strokeWidth: 3 }} />
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div style={{
              borderRadius: 10, padding: "10px 0",
              textAlign: "center", fontSize: 10, fontWeight: 800,
              letterSpacing: "0.16em", color: "#fff", textTransform: "uppercase",
              background: "linear-gradient(135deg, #00D4FF, #7B61FF)",
              boxShadow: "0 6px 22px -6px rgba(0,212,255,0.5)",
            }}>
              Upgrade to Pro
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Satellite: graph ── */}
      <motion.div
        initial={reduce ? false : { opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute", right: 0, top: 56,
          width: 118, padding: 12, borderRadius: 14, zIndex: 20,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(9,7,20,0.88)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 48px -10px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Growth</span>
          <TrendingUp style={{ width: 10, height: 10, color: "rgba(123,97,255,0.5)" }} />
        </div>
        <svg width="94" height="38" viewBox="0 0 94 38">
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7B61FF" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
            <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(123,97,255,0.25)" />
              <stop offset="100%" stopColor="rgba(123,97,255,0)" />
            </linearGradient>
          </defs>
          <path
            d={`M0,${CHART_Y[0]} ${CHART_Y.map((y, i) => `L${i * 13.4},${y}`).join(" ")} L${7 * 13.4},38 L0,38 Z`}
            fill="url(#lg2)"
          />
          <path
            d={`M0,${CHART_Y[0]} ${CHART_Y.map((y, i) => `L${i * 13.4},${y}`).join(" ")}`}
            fill="none" stroke="url(#lg1)" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          />
          <circle cx={7 * 13.4} cy={CHART_Y[7]} r="3" fill="#FF2E9A"
            style={{ filter: "drop-shadow(0 0 4px #FF2E9A)" }} />
        </svg>
      </motion.div>

      {/* ── Satellite: credits ── */}
      <motion.div
        initial={reduce ? false : { opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "absolute", right: 0, bottom: 120,
          width: 110, padding: 12, borderRadius: 14, zIndex: 20,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(9,7,20,0.88)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 48px -10px rgba(0,0,0,0.7)",
        }}
      >
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Credits</p>
        <p style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 2 }}>{count}</p>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", marginBottom: 8 }}>/ 1200 Credits</p>
        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${(count / 1200) * 100}%` }}
            transition={{ duration: 1.4, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #7B61FF, #00D4FF)" }}
          />
        </div>
      </motion.div>

    </div>
  );
}
