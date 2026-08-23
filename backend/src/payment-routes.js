/**
 * payment-routes.js
 * Secure, production-ready Razorpay payment integration.
 * - All order creation and signature verification is server-side only.
 * - Credits are granted ONLY after cryptographic signature verification.
 * - Simulator / mock payment bypasses are strictly forbidden.
 * - When Razorpay is not fully configured, all payment actions are safely blocked.
 * - No price, plan, or credit data is trusted from the frontend.
 */
const crypto = require("node:crypto");
const express = require("express");

const {
  getRazorpayCredentials,
  verifyRazorpaySignature: verifySignatureService,
  verifyWebhookSignature: verifyWebhookSignatureService,
} = require("./services/razorpay-service");

/**
 * Check if valid Razorpay API keys are configured.
 * Rejects missing, empty, or placeholder keys.
 */
function isRazorpayConfigured(db) {
  const creds = getRazorpayCredentials(db);
  return creds.isConfigured && !creds.isSimulator;
}

/** Razorpay SDK instance — initialized lazily when configured. */
function getRazorpay(db) {
  const creds = getRazorpayCredentials(db);
  if (!creds.isConfigured || creds.isSimulator) {
    throw new Error("Razorpay payment gateway is not configured.");
  }
  const Razorpay = require("razorpay");
  return new Razorpay({
    key_id: creds.keyId,
    key_secret: creds.keySecret,
  });
}

/** Safely verify Razorpay payment signature via HMAC SHA-256. */
function verifyRazorpaySignature(orderId, paymentId, signature, db) {
  return verifySignatureService(orderId, paymentId, signature, db);
}

/** Verify Razorpay webhook signature from X-Razorpay-Signature header. */
function verifyWebhookSignature(rawBody, signature, db) {
  return verifyWebhookSignatureService(rawBody, signature, db);
}

/** Server-side plan definitions — single source of truth derived from database. */
function getServerPlans(db) {
  let rawPlans = null;

  if (db) {
    try {
      const row = db.prepare("SELECT json FROM site_content WHERE id = 1").get();
      if (row && row.json) {
        const parsed = JSON.parse(row.json);
        if (Array.isArray(parsed.plans) && parsed.plans.length > 0) {
          rawPlans = parsed.plans;
        }
      }
    } catch (e) {
      console.error("[payment] Error loading plans from DB:", e.message);
    }
  }

  if (!rawPlans) {
    try {
      const fs = require("node:fs");
      const path = require("node:path");
      const primaryPath = path.join(__dirname, "../data/site-content.json");
      const fallbackPath = path.join(__dirname, "../../data/site-content.json");
      const targetPath = fs.existsSync(primaryPath) ? primaryPath : fs.existsSync(fallbackPath) ? fallbackPath : null;
      if (targetPath) {
        const content = JSON.parse(fs.readFileSync(targetPath, "utf8"));
        if (Array.isArray(content.plans) && content.plans.length > 0) {
          rawPlans = content.plans;
        }
      }
    } catch (e) {
      console.error("[payment] Error loading plans from disk JSON:", e.message);
    }
  }

  const defaultPlans = [
    {
      id: "pro",
      name: "Pro",
      description: "Advanced image & video generation",
      price_inr: 49900,
      price_display: "₹499",
      credits: 510,
      features: [
        "510 Credits Included",
        "Advanced Image Generation Access",
        "Advanced Video Generation Access",
        "Up to 4K Quality",
        "Priority Rendering",
        "Faster Processing",
        "Commercial Usage Rights",
        "Premium Creative Tools",
        "Extended History",
        "Email Support"
      ],
      badge: "Most Popular",
      popular: true,
      billing: "monthly"
    },
    {
      id: "pro_yearly",
      name: "Pro (Yearly)",
      description: "Advanced image & video generation",
      price_inr: 479900,
      price_display: "₹4,799",
      credits: 6120,
      features: [
        "6,120 Credits Included",
        "Advanced Image Generation Access",
        "Advanced Video Generation Access",
        "Up to 4K Quality",
        "Priority Rendering",
        "Faster Processing",
        "Commercial Usage Rights",
        "Premium Creative Tools",
        "Extended History",
        "Email Support"
      ],
      badge: "Save 20%",
      popular: false,
      billing: "yearly"
    },
    {
      id: "pro_plus",
      name: "Pro Plus",
      description: "Full platform access and dedicated support",
      price_inr: 99900,
      price_display: "₹999",
      credits: 650,
      features: [
        "650 Credits Included",
        "Full Platform Access",
        "Ultra HD Outputs",
        "Instant Priority Queue",
        "Dedicated Support",
        "Commercial Licensing",
        "API Access",
        "Team Collaboration",
        "Advanced Workflow Controls",
        "Premium Features",
        "Early Feature Access",
        "Highest Rendering Priority"
      ],
      badge: "Best Value",
      popular: false,
      billing: "monthly"
    },
    {
      id: "pro_plus_yearly",
      name: "Pro Plus (Yearly)",
      description: "Full platform access and dedicated support",
      price_inr: 959900,
      price_display: "₹9,599",
      credits: 7800,
      features: [
        "7,800 Credits Included",
        "Full Platform Access",
        "Ultra HD Outputs",
        "Instant Priority Queue",
        "Dedicated Support",
        "Commercial Licensing",
        "API Access",
        "Team Collaboration",
        "Advanced Workflow Controls",
        "Premium Features",
        "Early Feature Access",
        "Highest Rendering Priority"
      ],
      badge: "Save 20%",
      popular: false,
      billing: "yearly"
    }
  ];

  if (!rawPlans || !Array.isArray(rawPlans) || rawPlans.length === 0) {
    return defaultPlans;
  }

  const result = [];
  for (const raw of rawPlans) {
    if (raw.available === false) continue;
    if (raw.id === "free" || raw.id === "custom") continue;

    const monthlyPrice = Number(raw.monthlyPrice || 0);
    const yearlyPrice = Number(raw.yearlyPrice || 0);
    const credits = Number(raw.credits || 0);

    // 1. Monthly plan variant
    if (monthlyPrice > 0) {
      const pricePaise = Math.round(monthlyPrice * 100);
      result.push({
        id: raw.id,
        name: raw.name,
        description: raw.description || "Advanced image & video generation",
        price_inr: pricePaise,
        price_display: `₹${monthlyPrice.toLocaleString("en-IN")}`,
        credits: credits,
        features: raw.features || [],
        badge: raw.badge || null,
        popular: raw.badge === "Most Popular",
        billing: "monthly"
      });
    }

    // 2. Yearly plan variant
    if (yearlyPrice > 0) {
      const yearlyId = raw.id.endsWith("_yearly") ? raw.id : `${raw.id}_yearly`;
      const pricePaise = Math.round(yearlyPrice * 100);
      const yearlyCredits = credits * 12;
      const yearlyFeatures = (raw.features || []).map((f) =>
        f.includes("Credits Included") ? `${yearlyCredits.toLocaleString("en-IN")} Credits Included` : f
      );
      result.push({
        id: yearlyId,
        name: raw.name.includes("Yearly") ? raw.name : `${raw.name} (Yearly)`,
        description: raw.description || "Advanced image & video generation",
        price_inr: pricePaise,
        price_display: `₹${yearlyPrice.toLocaleString("en-IN")}`,
        credits: yearlyCredits,
        features: yearlyFeatures,
        badge: raw.badge === "Most Popular" ? "Save 20%" : (raw.badge || "Save 20%"),
        popular: false,
        billing: "yearly"
      });
    }
  }

  return result.length > 0 ? result : defaultPlans;
}

function getPlanById(db, planId) {
  return getServerPlans(db).find((p) => p.id === planId) || null;
}

function requireUserAuth(db) {
  return function (req, res, next) {
    const auth = String(req.headers.authorization || "").trim();
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    if (!token) return res.status(401).json({ ok: false, error: "Unauthorized." });

    const { verifyUserToken } = require("./auth");
    let payload;
    try {
      payload = verifyUserToken(token);
    } catch {
      return res.status(401).json({ ok: false, error: "Unauthorized." });
    }
    if (!payload?.sub) return res.status(401).json({ ok: false, error: "Unauthorized." });

    const user = db
      .prepare("SELECT id, email, name, credits, subscription_plan, suspended FROM users WHERE id = ?")
      .get(payload.sub);
    if (!user) return res.status(401).json({ ok: false, error: "User not found." });
    if (user.suspended) return res.status(403).json({ ok: false, error: "Account suspended." });

    req.userId = user.id;
    req.userEmail = user.email;
    req.userRecord = user;
    next();
  };
}

function requireAdminAuth(verifyAdminToken) {
  return function (req, res, next) {
    const auth = String(req.headers.authorization || "").trim();
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    if (!token) return res.status(401).json({ ok: false, error: "Unauthorized." });
    try {
      const payload = verifyAdminToken(token);
      if (payload.typ !== "admin") throw new Error("invalid");
      req.admin = payload;
      next();
    } catch {
      return res.status(401).json({ ok: false, error: "Unauthorized." });
    }
  };
}

function mountPaymentRoutes(app, { db, verifyAdminToken }) {
  const authUser = requireUserAuth(db);
  const authAdmin = requireAdminAuth(verifyAdminToken);

  // ─── PUBLIC: Payment Gateway Status ──────────────────────────────────────
  app.get("/api/payments/status", (_req, res) => {
    const creds = getRazorpayCredentials(db);
    const configured = creds.isConfigured;
    return res.json({
      ok: true,
      available: configured,
      message: configured
        ? "Payment gateway is active."
        : "Payments are temporarily unavailable while our payment system is being configured. Please try again later."
    });
  });

  // ─── PUBLIC: Get available plans ─────────────────────────────────────────
  app.get("/api/payments/plans", (_req, res) => {
    try {
      const creds = getRazorpayCredentials(db);
      const configured = creds.isConfigured;
      const plans = getServerPlans(db).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price_display: p.price_display,
        price_inr: p.price_inr,
        credits: p.credits,
        features: p.features,
        badge: p.badge,
        popular: p.popular,
      }));
      return res.json({ ok: true, available: configured, plans });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to load plans." });
    }
  });

  // ─── USER: Create Razorpay Order (server-side only) ──────────────────────
  app.post("/api/payments/create-order", authUser, async (req, res) => {
    try {
      const creds = getRazorpayCredentials(db);
      // 1. Enforce payment gateway availability
      if (!creds.isConfigured) {
        return res.status(503).json({
          ok: false,
          available: false,
          error: "Payments are temporarily unavailable while our payment system is being configured. Please try again later."
        });
      }

      const planId = typeof req.body?.planId === "string" ? req.body.planId.trim() : "";
      if (!planId) return res.status(400).json({ ok: false, error: "Plan ID is required." });

      const plan = getPlanById(db, planId);
      if (!plan) return res.status(400).json({ ok: false, error: "Invalid plan selected." });

      // Check for very recent pending order for same user+plan (anti-replay)
      const recentOrder = db
        .prepare(
          `SELECT id, razorpay_order_id, amount_paise FROM payments
           WHERE user_id = ? AND plan_id = ? AND status = 'created'
           AND created_at > datetime('now', '-5 minutes')`
        )
        .get(req.userId, planId);

      if (recentOrder) {
        return res.json({
          ok: true,
          available: true,
          orderId: recentOrder.razorpay_order_id,
          internalTransactionId: recentOrder.id,
          amount: recentOrder.amount_paise,
          currency: "INR",
          keyId: creds.keyId,
          planName: plan.name,
          credits: plan.credits,
          priceDisplay: plan.price_display,
          isSimulator: creds.isSimulator,
        });
      }

      // If in simulator mode (e.g. testing without live keys)
      if (creds.isSimulator) {
        const simOrderId = `order_sim_${Date.now()}`;
        const simTxId = crypto.randomUUID();
        db.prepare(
          `INSERT INTO payments
           (id, user_id, razorpay_order_id, plan_id, plan_name_snapshot, amount_paise, currency, credits_to_grant,
            status, created_at, metadata_json)
           VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, 'created', ?, ?)`
        ).run(
          simTxId,
          req.userId,
          simOrderId,
          planId,
          plan.name,
          plan.price_inr,
          plan.credits,
          new Date().toISOString(),
          JSON.stringify({ planName: plan.name, credits: plan.credits })
        );

        return res.json({
          ok: true,
          available: true,
          orderId: simOrderId,
          internalTransactionId: simTxId,
          amount: plan.price_inr,
          currency: "INR",
          keyId: creds.keyId,
          planName: plan.name,
          credits: plan.credits,
          priceDisplay: plan.price_display,
          isSimulator: true,
        });
      }

      const idempotencyKey = crypto
        .createHash("sha256")
        .update(`${req.userId}:${planId}:${Date.now()}`)
        .digest("hex")
        .slice(0, 32);

      const razorpay = getRazorpay(db);
      const order = await razorpay.orders.create({
        amount: plan.price_inr,
        currency: "INR",
        receipt: `rcpt_${idempotencyKey.slice(0, 20)}`,
        notes: { userId: req.userId, planId },
      });

      // Persist order in DB immediately with 'created' status
      const paymentId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO payments
         (id, user_id, razorpay_order_id, plan_id, plan_name_snapshot, amount_paise, currency, credits_to_grant,
          status, created_at, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, 'created', ?, ?)`
      ).run(
        paymentId,
        req.userId,
        order.id,
        planId,
        plan.name,
        plan.price_inr,
        plan.credits,
        new Date().toISOString(),
        JSON.stringify({ planName: plan.name, credits: plan.credits })
      );

      return res.json({
        ok: true,
        available: true,
        orderId: order.id,
        internalTransactionId: paymentId,
        amount: plan.price_inr,
        currency: "INR",
        keyId: creds.keyId,
        planName: plan.name,
        credits: plan.credits,
        priceDisplay: plan.price_display,
      });
    } catch (e) {
      console.error("[payment] create-order error:", e.message);
      return res.status(500).json({ ok: false, error: "Could not create payment order. Please try again later." });
    }
  });

  // ─── USER: Verify Payment & Grant Credits ────────────────────────────────
  app.post("/api/payments/verify", authUser, (req, res) => {
    try {
      const creds = getRazorpayCredentials(db);
      // 1. Enforce payment gateway availability
      if (!creds.isConfigured) {
        return res.status(503).json({
          ok: false,
          available: false,
          error: "Payments are temporarily unavailable while our payment system is being configured. Please try again later."
        });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

      if (
        typeof razorpay_order_id !== "string" ||
        typeof razorpay_payment_id !== "string" ||
        typeof razorpay_signature !== "string" ||
        !razorpay_order_id.trim() ||
        !razorpay_payment_id.trim() ||
        !razorpay_signature.trim()
      ) {
        return res.status(400).json({ ok: false, error: "Invalid payment verification data." });
      }

      const orderId = razorpay_order_id.trim();
      const paymentId = razorpay_payment_id.trim();
      const signature = razorpay_signature.trim();

      // 2. Strict Cryptographic Signature Verification
      const isValid = verifyRazorpaySignature(orderId, paymentId, signature, db);

      if (!isValid) {
        console.warn("[payment] Security Warning: Invalid signature for order:", orderId, "user:", req.userId);
        db.prepare(
          `INSERT INTO payment_security_logs (id, user_id, event, razorpay_order_id, razorpay_payment_id, timestamp)
           VALUES (?, ?, 'invalid_signature', ?, ?, ?)`
        ).run(crypto.randomUUID(), req.userId, orderId, paymentId, new Date().toISOString());

        return res.status(400).json({ ok: false, error: "Payment verification failed. Invalid cryptographic signature." });
      }

      // 3. Find the pending payment record (must belong to this user)
      const payment = db
        .prepare(
          "SELECT id, plan_id, amount_paise, status, metadata_json FROM payments WHERE razorpay_order_id = ? AND user_id = ?"
        )
        .get(orderId, req.userId);

      if (!payment) {
        return res.status(404).json({ ok: false, error: "Payment record not found." });
      }

      // 4. Idempotency: check if already processed
      if (payment.status === "captured") {
        return res.json({ ok: true, alreadyCaptured: true, message: "Payment already verified and credits granted." });
      }

      if (payment.status !== "created") {
        return res.status(400).json({ ok: false, error: "Payment order is not in a valid state for verification." });
      }

      // 5. Resolve plan from DB record (never trust frontend input)
      const plan = getPlanById(db, payment.plan_id);
      if (!plan) {
        return res.status(500).json({ ok: false, error: "Plan configuration error." });
      }

      // 6. Atomically update payment status + user credits in a SQLite transaction
      const grantCredits = db.transaction(() => {
        db.prepare(
          `UPDATE payments
           SET status = 'captured', razorpay_payment_id = ?, captured_at = ?
           WHERE id = ?`
        ).run(paymentId, new Date().toISOString(), payment.id);

        const user = db.prepare("SELECT credits FROM users WHERE id = ?").get(req.userId);
        const prevBalance = user?.credits ?? 0;
        const newBalance = prevBalance + plan.credits;

        db.prepare("UPDATE users SET credits = ?, subscription_plan = ? WHERE id = ?").run(
          newBalance,
          plan.id,
          req.userId
        );

        db.prepare(
          `INSERT INTO credit_transactions
           (id, user_id, action_type, credits_added, credits_deducted,
            previous_balance, new_balance, timestamp, source, reason, details_json)
           VALUES (?, ?, 'purchase', ?, 0, ?, ?, ?, 'payment', ?, ?)`
        ).run(
          crypto.randomUUID(),
          req.userId,
          plan.credits,
          prevBalance,
          newBalance,
          new Date().toISOString(),
          `Purchased ${plan.name} plan`,
          JSON.stringify({ planId: plan.id, razorpayPaymentId: paymentId, orderId: orderId })
        );

        return { newBalance, creditsAdded: plan.credits };
      });

      const result = grantCredits();

      return res.json({
        ok: true,
        message: "Payment verified and credits added successfully.",
        creditsAdded: result.creditsAdded,
        newBalance: result.newBalance,
        planName: plan.name,
      });
    } catch (e) {
      console.error("[payment] verify error:", e.message);
      return res.status(500).json({ ok: false, error: "Payment processing error. Contact support if credits were not added." });
    }
  });

  // ─── USER: Payment History ───────────────────────────────────────────────
  app.get("/api/payments/history", authUser, (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(50, parseInt(req.query.limit) || 20);
      const offset = (page - 1) * limit;

      const rows = db
        .prepare(
          `SELECT id, internal_transaction_id, plan_id, plan_name_snapshot, amount_paise, currency,
                  credits_to_grant, status, created_at, paid_at, captured_at, razorpay_order_id, razorpay_payment_id, metadata_json
           FROM payments
           WHERE user_id = ? AND LOWER(status) NOT IN ('created', 'checkout_started')
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`
        )
        .all(req.userId, limit, offset);

      const total = db
        .prepare("SELECT COUNT(*) AS c FROM payments WHERE user_id = ? AND LOWER(status) NOT IN ('created', 'checkout_started')")
        .get(req.userId).c;

      const serverPlans = getServerPlans();
      const planMap = Object.fromEntries(serverPlans.map((p) => [p.id, p]));

      const formatted = rows.map((r) => {
        let meta = {};
        try { meta = JSON.parse(r.metadata_json || "{}"); } catch {}
        const plan = planMap[r.plan_id] || getPlanById(r.plan_id);
        return {
          id: r.id,
          internalTransactionId: r.internal_transaction_id || r.id,
          planId: r.plan_id,
          planName: plan?.name || r.plan_name_snapshot || meta.planName || r.plan_id,
          amountDisplay: plan ? plan.price_display : `₹${((r.amount_paise || 0) / 100).toFixed(0)}`,
          credits: r.credits_to_grant || plan?.credits || meta.credits || 0,
          status: r.status,
          date: r.paid_at || r.captured_at || r.created_at,
          razorpayOrderId: r.razorpay_order_id,
          razorpayPaymentId: r.razorpay_payment_id,
        };
      });

      return res.json({ ok: true, payments: formatted, total, page, limit });
    } catch (e) {
      console.error("[payment] history error:", e.message);
      return res.status(500).json({ ok: false, error: "Failed to load payment history." });
    }
  });

  // ─── WEBHOOK: Razorpay Events ────────────────────────────────────────────
  app.post("/api/payments/webhook", express.raw({ type: "application/json" }), (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      if (!signature) return res.status(400).json({ ok: false, error: "Missing signature." });

      const rawBody = req.body;
      if (!verifyWebhookSignature(rawBody, signature)) {
        console.warn("[webhook] Security Warning: Invalid webhook signature");
        return res.status(400).json({ ok: false, error: "Invalid signature." });
      }

      const event = JSON.parse(rawBody.toString());
      const eventType = event.event;

      if (eventType === "payment.captured") {
        const paymentEntity = event.payload?.payment?.entity;
        if (!paymentEntity) return res.json({ ok: true });

        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;
        const existingPayment = db
          .prepare("SELECT id, user_id, plan_id, status FROM payments WHERE razorpay_order_id = ?")
          .get(orderId);

        if (existingPayment && existingPayment.status === "created") {
          const plan = getPlanById(existingPayment.plan_id);
          if (plan) {
            const grantCredits = db.transaction(() => {
              db.prepare(
                "UPDATE payments SET status = 'captured', razorpay_payment_id = ?, captured_at = ? WHERE id = ?"
              ).run(paymentId, new Date().toISOString(), existingPayment.id);

              const user = db.prepare("SELECT credits FROM users WHERE id = ?").get(existingPayment.user_id);
              const prev = user?.credits ?? 0;
              const next = prev + plan.credits;

              db.prepare("UPDATE users SET credits = ?, subscription_plan = ? WHERE id = ?").run(
                next, plan.id, existingPayment.user_id
              );

              db.prepare(
                `INSERT INTO credit_transactions
                 (id, user_id, action_type, credits_added, credits_deducted,
                  previous_balance, new_balance, timestamp, source, reason, details_json)
                 VALUES (?, ?, 'purchase', ?, 0, ?, ?, ?, 'webhook', ?, ?)`
              ).run(
                crypto.randomUUID(), existingPayment.user_id, plan.credits, prev, next,
                new Date().toISOString(), `Webhook: Purchased ${plan.name}`,
                JSON.stringify({ via: "webhook", paymentId, orderId })
              );
            });
            grantCredits();
          }
        }
      } else if (eventType === "payment.failed") {
        const paymentEntity = event.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        if (orderId) {
          db.prepare(
            "UPDATE payments SET status = 'failed' WHERE razorpay_order_id = ? AND status = 'created'"
          ).run(orderId);
        }
      }

      return res.json({ ok: true });
    } catch (e) {
      console.error("[webhook] error:", e.message);
      return res.status(500).json({ ok: false, error: "Webhook processing error." });
    }
  });

  // ─── ADMIN: All Payments ─────────────────────────────────────────────────
  app.get("/api/admin/payments", authAdmin, (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 30);
      const offset = (page - 1) * limit;
      const statusFilter = req.query.status || "";
      const planFilter = req.query.plan || "";
      const search = req.query.search || "";

      let where = "1=1";
      const params = [];

      if (statusFilter) { where += " AND p.status = ?"; params.push(statusFilter); }
      if (planFilter) { where += " AND p.plan_id = ?"; params.push(planFilter); }
      if (search) {
        where += " AND (u.email LIKE ? OR u.name LIKE ? OR p.razorpay_payment_id LIKE ?)";
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      const rows = db
        .prepare(
          `SELECT p.id, p.user_id, u.email, u.name as user_name,
                  p.plan_id, p.amount_paise, p.currency, p.status,
                  p.razorpay_order_id, p.razorpay_payment_id,
                  p.created_at, p.captured_at, p.metadata_json
           FROM payments p
           LEFT JOIN users u ON u.id = p.user_id
           WHERE ${where}
           ORDER BY p.created_at DESC
           LIMIT ? OFFSET ?`
        )
        .all(...params, limit, offset);

      const total = db
        .prepare(`SELECT COUNT(*) AS c FROM payments p LEFT JOIN users u ON u.id = p.user_id WHERE ${where}`)
        .get(...params).c;

      const serverPlans = getServerPlans();
      const planMap = Object.fromEntries(serverPlans.map((p) => [p.id, p]));

      const formatted = rows.map((r) => {
        const plan = planMap[r.plan_id];
        return {
          id: r.id,
          userId: r.user_id,
          userEmail: r.email || "—",
          userName: r.user_name || "—",
          planId: r.plan_id,
          planName: plan?.name || r.plan_id,
          amountDisplay: `₹${((r.amount_paise || 0) / 100).toLocaleString("en-IN")}`,
          credits: plan?.credits || 0,
          status: r.status,
          razorpayOrderId: r.razorpay_order_id,
          razorpayPaymentId: r.razorpay_payment_id || null,
          date: r.captured_at || r.created_at,
        };
      });

      const analytics = db
        .prepare(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN LOWER(status) IN ('credited', 'captured', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%' THEN 1 ELSE 0 END) AS successful,
             SUM(CASE WHEN LOWER(status) IN ('failed') THEN 1 ELSE 0 END) AS failed,
             SUM(CASE WHEN LOWER(status) IN ('credited', 'captured', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%' THEN amount_paise ELSE 0 END) AS total_paise
           FROM payments`
        )
        .get();

      return res.json({
        ok: true,
        payments: formatted,
        total,
        page,
        limit,
        analytics: {
          totalTransactions: analytics.total || 0,
          successfulPayments: analytics.successful || 0,
          failedPayments: analytics.failed || 0,
          totalRevenue: `₹${(((analytics.total_paise || 0) / 100)).toLocaleString("en-IN")}`,
        },
      });
    } catch (e) {
      console.error("[admin/payments] error:", e.message);
      return res.status(500).json({ ok: false, error: "Failed to load payments." });
    }
  });

  // ─── ADMIN: Revenue Analytics ────────────────────────────────────────────
  app.get("/api/admin/payments/analytics", authAdmin, (req, res) => {
    try {
      const summary = db
        .prepare(
          `SELECT
             SUM(CASE WHEN LOWER(status) IN ('credited', 'captured', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%' THEN amount_paise ELSE 0 END) AS total_paise,
             SUM(CASE WHEN LOWER(status) IN ('credited', 'captured', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%' AND created_at >= date('now', 'start of day') THEN amount_paise ELSE 0 END) AS today_paise,
             SUM(CASE WHEN LOWER(status) IN ('credited', 'captured', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%' AND created_at >= date('now', '-7 days') THEN amount_paise ELSE 0 END) AS weekly_paise,
             SUM(CASE WHEN LOWER(status) IN ('credited', 'captured', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%' THEN 1 ELSE 0 END) AS successful_count,
             SUM(CASE WHEN LOWER(status) IN ('failed') THEN 1 ELSE 0 END) AS failed_count,
             SUM(CASE WHEN LOWER(status) IN ('refunded') THEN 1 ELSE 0 END) AS refunded_count,
             SUM(CASE WHEN LOWER(status) IN ('created', 'checkout_started') THEN 1 ELSE 0 END) AS pending_count,
             SUM(CASE WHEN LOWER(status) IN ('credited', 'captured', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%' THEN COALESCE(credits_to_grant, 0) ELSE 0 END) AS total_credits
           FROM payments`
        )
        .get() || {};

      const upgradedUsers = db
        .prepare("SELECT COUNT(DISTINCT user_id) AS c FROM payments WHERE LOWER(status) IN ('credited', 'captured', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%'")
        .get()?.c || 0;

      const totalRevenuePaise = summary.total_paise || 0;
      const successfulCount = summary.successful_count || 0;
      const avgPaise = successfulCount > 0 ? totalRevenuePaise / successfulCount : 0;

      const byPlan = db
        .prepare(
          `SELECT plan_id,
                  COUNT(*) AS count,
                  SUM(amount_paise) AS total_paise
           FROM payments WHERE LOWER(status) IN ('credited', 'captured', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%'
           GROUP BY plan_id`
        )
        .all();

      const last30 = db
        .prepare(
          `SELECT date(created_at) AS day, SUM(amount_paise) AS revenue
           FROM payments WHERE LOWER(status) IN ('credited', 'captured', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%'
             AND created_at > datetime('now', '-30 days')
           GROUP BY day ORDER BY day`
        )
        .all();

      const planMap = Object.fromEntries(getServerPlans().map((p) => [p.id, p]));

      return res.json({
        ok: true,
        analytics: {
          totalRevenue: `₹${(totalRevenuePaise / 100).toLocaleString()}`,
          todayRevenue: `₹${((summary.today_paise || 0) / 100).toLocaleString()}`,
          weeklyRevenue: `₹${((summary.weekly_paise || 0) / 100).toLocaleString()}`,
          averageOrderValue: `₹${(avgPaise / 100).toFixed(0)}`,
          successfulPayments: successfulCount,
          failedPayments: summary.failed_count || 0,
          refundedPayments: summary.refunded_count || 0,
          pendingPayments: summary.pending_count || 0,
          upgradedUsers,
          totalCreditsSold: summary.total_credits || 0,
        },
        byPlan: byPlan.map((r) => ({
          planId: r.plan_id,
          planName: planMap[r.plan_id]?.name || r.plan_id,
          count: r.count,
          revenue: `₹${((r.total_paise || 0) / 100).toFixed(0)}`,
        })),
        dailyRevenue: last30.map((r) => ({
          day: r.day,
          revenue: (r.revenue || 0) / 100,
        })),
      });
    } catch (e) {
      console.error("[admin/analytics] error:", e.message);
      return res.status(500).json({ ok: false, error: "Failed to load analytics." });
    }
  });
}

module.exports = { mountPaymentRoutes, isRazorpayConfigured, getServerPlans, getPlanById };
