"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, CreditCard, Loader2, ShieldCheck, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export type Plan = {
  id: string;
  name: string;
  description: string;
  price_display: string;
  credits: number;
  features: string[];
  badge: string | null;
  popular: boolean;
};

interface Props {
  plan: Plan;
  onClose: () => void;
  onSuccess: (data: { creditsAdded: number; newBalance: number; planName: string }) => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayCheckoutModal({ plan, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"confirm" | "processing" | "success" | "error">("confirm");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trap focus & keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step === "confirm" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step, isSubmitting]);

  const handlePay = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStep("processing");
    setErrorMessage("");

    const token = localStorage.getItem("ruhgen_user_jwt_v1");
    if (!token) {
      setErrorMessage("You are not signed in. Please sign in and try again.");
      setStep("error");
      setIsSubmitting(false);
      return;
    }

    // 1. Create server-side order first
    let orderData: {
      ok: boolean;
      available?: boolean;
      orderId?: string;
      amount?: number;
      keyId?: string;
      error?: string;
    };
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: plan.id }),
      });
      orderData = await res.json();
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStep("error");
      setIsSubmitting(false);
      return;
    }

    if (!orderData.ok || orderData.available === false || !orderData.orderId) {
      setErrorMessage(
        orderData.error ||
          "Payments are temporarily unavailable while our payment system is being configured. Please try again later."
      );
      setStep("error");
      setIsSubmitting(false);
      return;
    }

    // 2. Load Razorpay SDK checkout flow
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMessage("Could not load the payment system script. Please check your internet connection.");
      setStep("error");
      setIsSubmitting(false);
      return;
    }

    try {
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: "INR",
        name: "RUHGEN",
        description: `${plan.name} — ${plan.credits} credits`,
        order_id: orderData.orderId,
        prefill: {},
        theme: { color: "#7B61FF" },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            setStep("confirm");
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.ok) {
              setStep("success");
              setIsSubmitting(false);
              onSuccess({
                creditsAdded: verifyData.creditsAdded,
                newBalance: verifyData.newBalance,
                planName: verifyData.planName,
              });
            } else {
              setErrorMessage(verifyData.error || "Payment verification failed. Contact support.");
              setStep("error");
              setIsSubmitting(false);
            }
          } catch {
            setErrorMessage("Verification request failed. If payment was deducted, contact support.");
            setStep("error");
            setIsSubmitting(false);
          }
        },
      });

      rzp.on("payment.failed", (resp: { error: { description: string } }) => {
        setErrorMessage(resp.error?.description || "Payment failed. Please try again.");
        setStep("error");
        setIsSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      setErrorMessage("Could not launch Razorpay checkout modal.");
      setStep("error");
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        aria-modal="true"
        role="dialog"
        aria-label={`Purchase ${plan.name} plan`}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => step === "confirm" && !isSubmitting && onClose()}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            background: "var(--soft-black, #0f1117)",
            borderColor: "color-mix(in srgb, #7B61FF 45%, transparent)",
            boxShadow: "0 0 60px -15px rgba(123,97,255,0.35)",
          }}
        >
          {/* Close */}
          {step === "confirm" && !isSubmitting && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Header gradient line */}
          <div
            className="h-1 w-full"
            style={{ background: "linear-gradient(90deg, #7B61FF, #00D4FF)" }}
          />

          <div className="p-6 sm:p-8">
            {/* CONFIRM STATE */}
            {step === "confirm" && (
              <>
                <div className="mb-6">
                  <div className="mb-1 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#7B61FF]" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
                      Secure Checkout
                    </p>
                  </div>
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-white">
                    {plan.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{plan.description}</p>
                </div>

                {/* Plan summary card */}
                <div
                  className="mb-6 rounded-xl border p-4"
                  style={{
                    borderColor: "color-mix(in srgb, #7B61FF 25%, transparent)",
                    background: "color-mix(in srgb, #7B61FF 8%, transparent)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#7B61FF]" />
                      <span className="text-sm font-semibold text-white">{plan.credits} credits</span>
                    </div>
                    <span className="font-display text-2xl font-extrabold text-white">
                      {plan.price_display}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    One-time payment · Credits never expire
                  </p>
                </div>

                {/* Features */}
                <ul className="mb-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00E575]" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Security badge */}
                <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-subtle)]">
                  <ShieldCheck className="h-4 w-4 text-[#00E575]" />
                  Secured by Razorpay · 256-bit TLS encryption
                </div>

                {/* CTA */}
                <button
                  onClick={handlePay}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-base font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #7B61FF, #00D4FF)",
                    boxShadow: "0 8px 24px -8px rgba(123,97,255,0.7)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Initializing Payment…
                    </>
                  ) : (
                    <>Pay {plan.price_display} →</>
                  )}
                </button>
              </>
            )}

            {/* PROCESSING STATE */}
            {step === "processing" && (
              <div className="flex flex-col items-center py-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-[#7B61FF]" />
                <h3 className="mt-4 font-display text-xl font-bold text-white">
                  Opening Payment Gateway…
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Please complete the payment in the Razorpay checkout window.
                </p>
              </div>
            )}

            {/* SUCCESS STATE */}
            {step === "success" && (
              <div className="flex flex-col items-center py-8 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "color-mix(in srgb, #00E575 20%, transparent)" }}
                >
                  <Check className="h-8 w-8 text-[#00E575]" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-white">
                  Payment Successful!
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Your credits have been added to your account.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 rounded-xl px-8 py-3 font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)" }}
                >
                  Done
                </button>
              </div>
            )}

            {/* ERROR STATE */}
            {step === "error" && (
              <div className="flex flex-col items-center py-8 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "rgba(244,63,94,0.15)" }}
                >
                  <X className="h-8 w-8 text-rose-400" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-white">Payment Unavailable / Failed</h3>
                <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">{errorMessage}</p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setStep("confirm");
                      setIsSubmitting(false);
                    }}
                    className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
                    style={{ borderColor: "rgba(255,255,255,0.15)" }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
                    style={{ borderColor: "rgba(255,255,255,0.15)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
