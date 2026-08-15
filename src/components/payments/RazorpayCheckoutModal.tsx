"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, CreditCard, Loader2, ShieldCheck, X, Zap } from "lucide-react";
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
  price_inr?: number;
  credits: number;
  features: string[];
  badge: string | null;
  popular: boolean;
};

interface Props {
  plan: Plan;
  onClose: () => void;
  onSuccess: (data: { creditsAdded: number; newBalance: number; planName: string; internalTransactionId?: string }) => void;
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
  const [txRef, setTxRef] = useState<string>("");
  const [copied, setCopied] = useState(false);

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

    // 1. Create server-side order first (Frontend sends ONLY planId)
    let orderData: {
      ok: boolean;
      available?: boolean;
      orderId?: string;
      internalTransactionId?: string;
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
      orderData = await res.json().catch(() => ({
        ok: false,
        error: `Server returned non-JSON response (${res.status}). Please check backend status.`,
      }));
    } catch {
      setErrorMessage("Network connection error. Please try again.");
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

    if (orderData.internalTransactionId) {
      setTxRef(orderData.internalTransactionId);
    }

    // 2. If Simulator mode is active, execute test verification directly
    if (orderData.keyId === "rzp_test_simulator" || (orderData as any).isSimulator) {
      try {
        setStep("processing");
        const simPaymentId = `pay_sim_${Date.now()}`;
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: simPaymentId,
            razorpay_signature: "simulated_signature",
            internal_transaction_id: orderData.internalTransactionId,
          }),
        });
        const verifyData = await verifyRes.json().catch(() => ({ ok: false, error: "Server returned non-JSON response." }));
        if (verifyData.ok) {
          setStep("success");
          setIsSubmitting(false);
          if (verifyData.internalTransactionId) setTxRef(verifyData.internalTransactionId);
          onSuccess({
            creditsAdded: verifyData.creditsAdded,
            newBalance: verifyData.newBalance,
            planName: verifyData.planName,
            internalTransactionId: verifyData.internalTransactionId,
          });
        } else {
          setErrorMessage(verifyData.error || "Payment verification failed.");
          setStep("error");
          setIsSubmitting(false);
        }
      } catch {
        setErrorMessage("Verification request failed. Contact support.");
        setStep("error");
        setIsSubmitting(false);
      }
      return;
    }

    // 3. Load Razorpay SDK checkout flow for real credentials
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMessage("Could not load the payment gateway script. Please check your internet connection.");
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
        description: `${plan.name} — ${plan.credits} Credits Pass`,
        order_id: orderData.orderId,
        prefill: {},
        theme: { color: "#7B61FF" },
        modal: {
          ondismiss: () => {
            setStep((currentStep) => {
              if (currentStep === "processing" || currentStep === "success") {
                return currentStep;
              }
              setIsSubmitting(false);
              return "confirm";
            });
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setStep("processing");
            setIsSubmitting(true);

            let verifyData: any = null;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
              attempts++;
              try {
                const verifyRes = await fetch("/api/payments/verify", {
                  method: "POST",
                  headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    internal_transaction_id: orderData.internalTransactionId,
                  }),
                });
                verifyData = await verifyRes.json().catch(() => ({ ok: false }));
                if (verifyData && verifyData.ok) break;
              } catch (e) {
                console.error("[payment-modal] Verification attempt", attempts, "error:", e);
              }
              if (attempts < maxAttempts) {
                await new Promise((r) => setTimeout(r, 1000));
              }
            }

            if (verifyData && verifyData.ok) {
              setStep("success");
              setIsSubmitting(false);
              if (verifyData.internalTransactionId) setTxRef(verifyData.internalTransactionId);
              onSuccess({
                creditsAdded: verifyData.creditsAdded,
                newBalance: verifyData.newBalance,
                planName: verifyData.planName,
                internalTransactionId: verifyData.internalTransactionId,
              });
            } else {
              setErrorMessage(
                verifyData?.error || "Payment verification failed. Please contact support with your payment ID."
              );
              setStep("error");
              setIsSubmitting(false);
            }
          } catch (err) {
            console.error("[payment-modal] Critical error in handler:", err);
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
    } catch {
      setErrorMessage("Could not launch Razorpay checkout window.");
      setStep("error");
      setIsSubmitting(false);
    }
  };

  const copyTxRef = () => {
    if (!txRef) return;
    navigator.clipboard.writeText(txRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
          onClick={() => step === "confirm" && !isSubmitting && onClose()}
        />

        {/* Modal Window */}
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
          {/* Close button */}
          {step === "confirm" && !isSubmitting && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Header Accent Line */}
          <div
            className="h-1.5 w-full"
            style={{ background: "linear-gradient(90deg, #7B61FF, #00D4FF)" }}
          />

          <div className="p-6 sm:p-8">
            {/* 1. CONFIRM STATE */}
            {step === "confirm" && (
              <>
                <div className="mb-6">
                  <div className="mb-1 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#7B61FF]" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
                      Server Authoritative Checkout
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
                      <span className="text-sm font-semibold text-white">{plan.credits} Credits</span>
                    </div>
                    <span className="font-display text-2xl font-extrabold text-white">
                      {plan.price_display}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Instant Credit Ledger Update · Credits never expire
                  </p>
                </div>

                {/* Features list */}
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
                  Protected by Razorpay 256-bit SSL & HMAC Validation
                </div>

                {/* CTA Pay Button */}
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
                      Creating Secure Order…
                    </>
                  ) : (
                    <>Upgrade to {plan.name} — {plan.price_display} →</>
                  )}
                </button>
              </>
            )}

            {/* 2. PROCESSING STATE */}
            {step === "processing" && (
              <div className="flex flex-col items-center py-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-[#7B61FF]" />
                <h3 className="mt-4 font-display text-xl font-bold text-white">
                  Processing Razorpay Order…
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Please complete the payment in the Razorpay popup. Server-side verification will validate the transaction immediately upon completion.
                </p>
                {txRef && (
                  <p className="mt-4 font-mono text-xs text-[#00D4FF]">
                    Ref: {txRef}
                  </p>
                )}
              </div>
            )}

            {/* 3. SUCCESS STATE */}
            {step === "success" && (
              <div className="flex flex-col items-center py-6 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "color-mix(in srgb, #00E575 20%, transparent)" }}
                >
                  <Check className="h-8 w-8 text-[#00E575]" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-white">
                  Plan Upgraded Successfully!
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  +{plan.credits} credits have been added to your account ledger.
                </p>

                {txRef && (
                  <div
                    className="mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 w-full font-mono text-xs"
                    style={{
                      borderColor: "color-mix(in srgb, #00E575 30%, transparent)",
                      background: "color-mix(in srgb, #00E575 8%, transparent)",
                    }}
                  >
                    <span className="text-white truncate">TXN: {txRef}</span>
                    <button
                      onClick={copyTxRef}
                      className="inline-flex items-center gap-1 text-[#00E575] hover:underline"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="mt-6 w-full rounded-xl py-3.5 font-bold text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7B61FF, #00D4FF)" }}
                >
                  Back to Dashboard
                </button>
              </div>
            )}

            {/* 4. ERROR STATE */}
            {step === "error" && (
              <div className="flex flex-col items-center py-6 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "rgba(244,63,94,0.15)" }}
                >
                  <X className="h-8 w-8 text-rose-400" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-white">Payment Unavailable / Failed</h3>
                <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">{errorMessage}</p>
                <div className="mt-6 flex w-full gap-3">
                  <button
                    onClick={() => {
                      setStep("confirm");
                      setIsSubmitting(false);
                    }}
                    className="flex-1 rounded-xl border py-3 text-sm font-semibold text-white hover:bg-white/5"
                    style={{ borderColor: "rgba(255,255,255,0.15)" }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-xl border py-3 text-sm font-semibold text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
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
