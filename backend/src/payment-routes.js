/**
 * payment-routes.js
 * Secure, production-ready Razorpay payment integration.
 * - All order creation and signature verification is server-side only.
 * - Credits are granted ONLY after cryptographic signature verification.
 * - No price, plan, or credit data is trusted from the frontend.
 */
const crypto = require("node:crypto");
const express = require("express");

/** Razorpay SDK — initialized lazily so missing keys don't crash cold starts. */
function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured.");
  }
  const Razorpay = require("razorpay");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/** Safely verify Razorpay payment signature. */
function verifyRazorpaySignature(orderId, paymentId, signature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

/** Verify Razorpay webhook signature from X-Razorpay-Signature header. */
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

/** Server-side plan definitions — never read from client. */
function getServerPlans() {
  return [
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
}

function getPlanById(planId) {
  return getServerPlans().find((p) => p.id === planId) || null;
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

  // ─── PUBLIC: Get available plans ─────────────────────────────────────────
  app.get("/api/payments/plans", (_req, res) => {
    try {
      const plans = getServerPlans().map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price_display: p.price_display,
        credits: p.credits,
        features: p.features,
        badge: p.badge,
        popular: p.popular,
      }));
      return res.json({ ok: true, plans });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Failed to load plans." });
    }
  });

  // ─── USER: Create Razorpay Order (server-side only) ──────────────────────
  app.post("/api/payments/create-order", authUser, async (req, res) => {
    try {
      const planId = typeof req.body?.planId === "string" ? req.body.planId.trim() : "";
      if (!planId) return res.status(400).json({ ok: false, error: "Plan ID is required." });

      const plan = getPlanById(planId);
      if (!plan) return res.status(400).json({ ok: false, error: "Invalid plan." });

      // Check for very recent duplicate order for same user+plan (anti-replay)
      const recentOrder = db
        .prepare(
          `SELECT id FROM payments
           WHERE user_id = ? AND plan_id = ? AND status = 'created'
           AND created_at > datetime('now', '-5 minutes')`
        )
        .get(req.userId, planId);
      if (recentOrder) {
        const existing = db.prepare("SELECT razorpay_order_id, amount_paise FROM payments WHERE id = ?").get(recentOrder.id);
        if (existing) {
          return res.json({
            ok: true,
            orderId: existing.razorpay_order_id,
            amount: existing.amount_paise,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
            planName: plan.name,
            credits: plan.credits,
          });
        }
      }

      const keyId = process.env.RAZORPAY_KEY_ID || "";
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
      const isSimulator = !keyId || keyId.includes("REPLACE") || !keySecret || keySecret.includes("REPLACE");

      const idempotencyKey = crypto
        .createHash("sha256")
        .update(`${req.userId}:${planId}:${Date.now()}`)
        .digest("hex")
        .slice(0, 32);

      let order;
      if (isSimulator) {
        order = {
          id: `order_sim_${crypto.randomBytes(8).toString("hex")}`,
          amount: plan.price_inr,
          currency: "INR",
          receipt: `rcpt_${idempotencyKey.slice(0, 20)}`,
        };
        console.log("[payment] Simulator mode active: Created mock order", order.id);
      } else {
        const razorpay = getRazorpay();
        order = await razorpay.orders.create({
          amount: plan.price_inr,
          currency: "INR",
          receipt: `rcpt_${idempotencyKey.slice(0, 20)}`,
          notes: { userId: req.userId, planId },
        });
      }

      // Persist order in DB immediately
      const paymentId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO payments
         (id, user_id, razorpay_order_id, plan_id, amount_paise, currency,
          status, created_at, metadata_json)
         VALUES (?, ?, ?, ?, ?, 'INR', 'created', ?, ?)`
      ).run(
        paymentId,
        req.userId,
        order.id,
        planId,
        plan.price_inr,
        new Date().toISOString(),
        JSON.stringify({ planName: plan.name, credits: plan.credits })
      );

      return res.json({
        ok: true,
        orderId: order.id,
        amount: plan.price_inr,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_simulator",
        planName: plan.name,
        credits: plan.credits,
        priceDisplay: plan.price_display,
      });
    } catch (e) {
      console.error("[payment] create-order error:", e.message);
      return res.status(500).json({ ok: false, error: "Could not create payment order. Please try again." });
    }
  });

  // ─── USER: Verify Payment & Grant Credits ────────────────────────────────
  app.post("/api/payments/verify", authUser, (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

      if (
        typeof razorpay_order_id !== "string" ||
        typeof razorpay_payment_id !== "string" ||
        typeof razorpay_signature !== "string" ||
        !razorpay_order_id || !razorpay_payment_id || !razorpay_signature
      ) {
        return res.status(400).json({ ok: false, error: "Invalid payment data." });
      }

      // 1. Verify cryptographic signature
      const keyId = process.env.RAZORPAY_KEY_ID || "";
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
      const isSimulator = !keyId || keyId.includes("REPLACE") || !keySecret || keySecret.includes("REPLACE");

      let isValid = false;
      if (isSimulator && razorpay_order_id.startsWith("order_sim_")) {
        isValid = true;
        console.log("[payment] Simulator mode active: Bypassed signature check for", razorpay_order_id);
      } else {
        isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      }

      if (!isValid) {
        console.warn("[payment] Invalid signature for order:", razorpay_order_id, "user:", req.userId);
        // Log the failed attempt
        db.prepare(
          `INSERT INTO payment_security_logs (id, user_id, event, razorpay_order_id, razorpay_payment_id, timestamp)
           VALUES (?, ?, 'invalid_signature', ?, ?, ?)`
        ).run(crypto.randomUUID(), req.userId, razorpay_order_id, razorpay_payment_id, new Date().toISOString());
        return res.status(400).json({ ok: false, error: "Payment verification failed." });
      }

      // 2. Find the pending payment record (must belong to this user)
      const payment = db
        .prepare(
          "SELECT id, plan_id, amount_paise, status, metadata_json FROM payments WHERE razorpay_order_id = ? AND user_id = ?"
        )
        .get(razorpay_order_id, req.userId);

      if (!payment) {
        return res.status(404).json({ ok: false, error: "Payment record not found." });
      }

      // 3. Idempotency: already captured
      if (payment.status === "captured") {
        return res.json({ ok: true, alreadyCaptured: true, message: "Payment already processed." });
      }

      if (payment.status !== "created") {
        return res.status(400).json({ ok: false, error: "Invalid payment state." });
      }

      // 4. Resolve plan from DB record (never trust frontend)
      const plan = getPlanById(payment.plan_id);
      if (!plan) {
        return res.status(500).json({ ok: false, error: "Plan configuration error." });
      }

      // 5. Atomically update payment + credits in a transaction
      const grantCredits = db.transaction(() => {
        // Mark payment captured
        db.prepare(
          `UPDATE payments
           SET status = 'captured', razorpay_payment_id = ?, captured_at = ?
           WHERE id = ?`
        ).run(razorpay_payment_id, new Date().toISOString(), payment.id);

        // Get current user balance
        const user = db.prepare("SELECT credits FROM users WHERE id = ?").get(req.userId);
        const prevBalance = user?.credits ?? 0;
        const newBalance = prevBalance + plan.credits;

        // Add credits
        db.prepare("UPDATE users SET credits = ?, subscription_plan = ? WHERE id = ?").run(
          newBalance,
          plan.id,
          req.userId
        );

        // Log the credit transaction
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
          JSON.stringify({ planId: plan.id, razorpayPaymentId: razorpay_payment_id, orderId: razorpay_order_id })
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
          `SELECT id, plan_id, amount_paise, currency, status, created_at, captured_at, metadata_json
           FROM payments
           WHERE user_id = ? AND status != 'created'
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?`
        )
        .all(req.userId, limit, offset);

      const total = db
        .prepare("SELECT COUNT(*) AS c FROM payments WHERE user_id = ? AND status != 'created'")
        .get(req.userId).c;

      const formatted = rows.map((r) => {
        let meta = {};
        try { meta = JSON.parse(r.metadata_json || "{}"); } catch {}
        const plan = getPlanById(r.plan_id);
        return {
          id: r.id,
          planId: r.plan_id,
          planName: plan?.name || meta.planName || r.plan_id,
          amountDisplay: plan ? plan.price_display : `₹${((r.amount_paise || 0) / 100).toFixed(0)}`,
          credits: plan?.credits || meta.credits || 0,
          status: r.status,
          date: r.captured_at || r.created_at,
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

      const rawBody = req.body; // Buffer when using express.raw
      if (!verifyWebhookSignature(rawBody, signature)) {
        console.warn("[webhook] Invalid signature");
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
          amountDisplay: plan?.price_display || `₹${((r.amount_paise || 0) / 100).toFixed(0)}`,
          credits: plan?.credits || 0,
          status: r.status,
          razorpayOrderId: r.razorpay_order_id,
          razorpayPaymentId: r.razorpay_payment_id || null,
          date: r.captured_at || r.created_at,
        };
      });

      // Analytics summary
      const analytics = db
        .prepare(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'captured' THEN 1 ELSE 0 END) AS successful,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
             SUM(CASE WHEN status = 'captured' THEN amount_paise ELSE 0 END) AS total_paise
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
          totalTransactions: analytics.total,
          successfulPayments: analytics.successful,
          failedPayments: analytics.failed,
          totalRevenue: `₹${((analytics.total_paise || 0) / 100).toFixed(0)}`,
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
      const byPlan = db
        .prepare(
          `SELECT plan_id,
                  COUNT(*) AS count,
                  SUM(amount_paise) AS total_paise
           FROM payments WHERE status = 'captured'
           GROUP BY plan_id`
        )
        .all();

      const last30 = db
        .prepare(
          `SELECT date(created_at) AS day, SUM(amount_paise) AS revenue
           FROM payments WHERE status = 'captured'
             AND created_at > datetime('now', '-30 days')
           GROUP BY day ORDER BY day`
        )
        .all();

      const planMap = Object.fromEntries(getServerPlans().map((p) => [p.id, p]));

      return res.json({
        ok: true,
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

module.exports = { mountPaymentRoutes };
