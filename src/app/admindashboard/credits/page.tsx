"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Coins,
  CreditCard,
  Film,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import {
  ProLabel,
  ProSettingsCard,
  ProSettingsHero,
  proInputClass,
  proInputStyle,
} from "@/components/settings/ProSettingsShell";

export default function AdminCreditRatesPage() {
  const { admin, ready, authHeaders } = useAdminAuth();
  const reduce = useReducedMotion();

  const [costImageSchnell, setCostImageSchnell] = useState("2");
  const [costImageDev, setCostImageDev] = useState("3");
  const [costVideoStd, setCostVideoStd] = useState("5");
  const [costVideoPro, setCostVideoPro] = useState("8");

  const [loading, setLoading] = useState(true);
  const [rateStatus, setRateStatus] = useState("");
  const [ratesPending, setRatesPending] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credits/rates", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.rates) {
        setCostImageSchnell(String(data.rates.cost_image_schnell ?? data.rates.credits_per_image ?? 2));
        setCostImageDev(String(data.rates.cost_image_dev ?? 3));
        setCostVideoStd(String(data.rates.cost_video_std ?? data.rates.credits_per_video_second ?? 5));
        setCostVideoPro(String(data.rates.cost_video_pro ?? 8));
      }
    } catch (err) {
      console.error("Error fetching credit rates", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready && admin) {
      fetchRates();
    }
  }, [ready, admin, fetchRates]);

  const onSaveRates = async () => {
    setRateStatus("");
    const imgSchnellVal = Number(costImageSchnell);
    const imgDevVal = Number(costImageDev);
    const vidStdVal = Number(costVideoStd);
    const vidProVal = Number(costVideoPro);

    if (
      isNaN(imgSchnellVal) || imgSchnellVal < 0 ||
      isNaN(imgDevVal) || imgDevVal < 0 ||
      isNaN(vidStdVal) || vidStdVal < 0 ||
      isNaN(vidProVal) || vidProVal < 0
    ) {
      setRateStatus("Rates must be non-negative numbers.");
      return;
    }

    setRatesPending(true);
    try {
      const h = authHeaders();
      if (!h.Authorization) {
        setRateStatus("Sign in again at /admin/login.");
        setRatesPending(false);
        return;
      }

      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { ...h, "content-type": "application/json" },
        body: JSON.stringify({
          cost_image_schnell: imgSchnellVal,
          cost_image_dev: imgDevVal,
          cost_video_std: vidStdVal,
          cost_video_pro: vidProVal,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setRateStatus(data.error || "Could not save rates.");
      } else {
        setRateStatus("Saved credit rates successfully. Single source of truth updated.");
      }
    } catch {
      setRateStatus("Network error.");
    } finally {
      setRatesPending(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4" style={{ color: "var(--text-muted)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#7B61FF]" />
        <p className="text-sm font-semibold tracking-wide">Loading credit control deck…</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-2xl border p-8" style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)" }}>
          <p className="font-display text-xl font-bold text-white">Admin access required</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            <Link className="font-semibold text-[#00D4FF] hover:underline" href="/admin/login?next=/admindashboard/credits">
              Sign in as Admin
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-x-clip px-4 pb-20 pt-8 sm:px-6 sm:pt-10 lg:px-10">
      <div className="relative mx-auto max-w-[900px] space-y-8">
        <ProSettingsHero
          eyebrow="Admin Credit Control"
          title="Engine Rate Matrix"
          description="Authoritative single source of truth for generation credit costs across standard and premium AI image and video models."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admindashboard/payments"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-emerald-500/40"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
              >
                <CreditCard className="h-4 w-4 shrink-0 text-emerald-400" />
                Payments & Ledger
              </Link>
              <Link
                href="/admindashboard"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#7B61FF]/35"
                style={{ borderColor: "var(--border-subtle)", background: "var(--soft-black)", color: "var(--text-primary)" }}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
                Console overview
              </Link>
            </div>
          }
        />

        {/* Dynamic Credit Rate Matrix Deck */}
        <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ProSettingsCard>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-subtle)" }}>
                <div>
                  <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <Coins className="h-5 w-5 text-[#FFB800]" /> Generation Engine Cost Configuration
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    All costs configured here propagate live to the User Dashboard, Studio UI, Pricing tables, and server deduction logic.
                  </p>
                </div>
                <button
                  onClick={fetchRates}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-50"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#7B61FF]" : ""}`} />
                  Sync Rates
                </button>
              </div>

              {/* 4 Separate Tiles Grid */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Tile 1: Standard Image */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-cyan-500/40">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Zap className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white block">Rugen Standard Image</span>
                        <span className="text-[10px] text-cyan-400/80 font-mono">key: cost_image_schnell</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-cyan-300">
                      Fast Iteration
                    </span>
                  </div>

                  <div>
                    <ProLabel htmlFor="rate-img-schnell">Credits / Image Generation</ProLabel>
                    <input
                      id="rate-img-schnell"
                      type="number"
                      value={costImageSchnell}
                      onChange={(e) => setCostImageSchnell(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                      Standard speed image output (Flux Schnell equivalent).
                    </p>
                  </div>
                </div>

                {/* Tile 2: Premium Image */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-violet-500/40">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white block">Rugen Premium Image</span>
                        <span className="text-[10px] text-violet-400/80 font-mono">key: cost_image_dev</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-violet-300">
                      High Fidelity
                    </span>
                  </div>

                  <div>
                    <ProLabel htmlFor="rate-img-dev">Credits / Image Generation</ProLabel>
                    <input
                      id="rate-img-dev"
                      type="number"
                      value={costImageDev}
                      onChange={(e) => setCostImageDev(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                      Production quality image rendering (Flux Dev / Ultra quality).
                    </p>
                  </div>
                </div>

                {/* Tile 3: Standard Video */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-pink-500/40">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                        <Film className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white block">Rugen Standard Video</span>
                        <span className="text-[10px] text-pink-400/80 font-mono">key: cost_video_std</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-pink-500/15 border border-pink-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-pink-300">
                      Per Second
                    </span>
                  </div>

                  <div>
                    <ProLabel htmlFor="rate-vid-std">Credits / Video Second</ProLabel>
                    <input
                      id="rate-vid-std"
                      type="number"
                      value={costVideoStd}
                      onChange={(e) => setCostVideoStd(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                      Standard motion rendering (Luma Dream Machine / Runway std).
                    </p>
                  </div>
                </div>

                {/* Tile 4: Premium Video */}
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 shadow-lg transition-all hover:border-amber-500/40">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Video className="h-4 w-4" />
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white block">Rugen Premium Video</span>
                        <span className="text-[10px] text-amber-400/80 font-mono">key: cost_video_pro</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                      Per Second
                    </span>
                  </div>

                  <div>
                    <ProLabel htmlFor="rate-vid-pro">Credits / Video Second</ProLabel>
                    <input
                      id="rate-vid-pro"
                      type="number"
                      value={costVideoPro}
                      onChange={(e) => setCostVideoPro(e.target.value)}
                      className={proInputClass}
                      style={proInputStyle}
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--text-subtle)]">
                      High-fidelity video synthesis with camera path controls.
                    </p>
                  </div>
                </div>
              </div>

              {rateStatus && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-300">
                  {rateStatus}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <Link
                  href="/admindashboard"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-5 text-sm font-semibold"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--deep-black)", color: "var(--text-primary)" }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Cancel &amp; Back
                </Link>
                <motion.button
                  type="button"
                  onClick={onSaveRates}
                  disabled={ratesPending}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border px-8 text-sm font-bold disabled:opacity-60"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)",
                    color: "#fff",
                  }}
                >
                  {ratesPending ? "Saving Credit Rates…" : "Save Credit Rates"}
                </motion.button>
              </div>
            </div>
          </ProSettingsCard>
        </motion.div>
      </div>
    </div>
  );
}
