const crypto = require("node:crypto");
const { verifyAdminToken } = require("./auth");
const { CreditWalletService } = require("./services/credit-wallet-service");
const { ModelRegistryService } = require("./services/model-registry-service");

function getBearer(req) {
  const auth = String(req.headers.authorization || "").trim();
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

function requireAdmin(req, res, next) {
  const bearer = getBearer(req);
  if (!bearer) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
  try {
    const payload = verifyAdminToken(bearer);
    if (payload.typ !== "admin" || typeof payload.sub !== "string") {
      throw new Error("invalid");
    }
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
}

function mountAdminUsersRoutes(app, { db }) {
  // Get all users
  app.get("/api/admin/users", requireAdmin, (req, res) => {
    try {
      const rows = db.prepare(
        "SELECT id, email, name, created_at as createdAt, suspended, subscription_plan as subscriptionPlan, subscription_status as subscriptionStatus, admin_notes as adminNotes, credits, purchased_credits as purchasedCredits, promotional_credits as promotionalCredits, reserved_credits as reservedCredits, generation_disabled as generationDisabled, special_access as specialAccess, role FROM users ORDER BY created_at DESC"
      ).all();
      return res.json({ ok: true, users: rows });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Database error." });
    }
  });

  // Patch a user
  app.patch("/api/admin/users/:id", requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      
      const oldRow = db.prepare("SELECT credits, suspended, subscription_plan, subscription_status, admin_notes, generation_disabled, special_access, role FROM users WHERE id = ?").get(id);
      if (!oldRow) {
        return res.status(404).json({ ok: false, error: "User not found." });
      }

      let updates = [];
      let values = [];

      if (typeof body.suspended === "boolean") {
        updates.push("suspended = ?");
        values.push(body.suspended ? 1 : 0);
      }
      if (typeof body.subscriptionPlan === "string") {
        updates.push("subscription_plan = ?");
        values.push(body.subscriptionPlan.trim());
      }
      if (typeof body.subscriptionStatus === "string") {
        updates.push("subscription_status = ?");
        values.push(body.subscriptionStatus.trim());
      }
      if (typeof body.adminNotes === "string") {
        updates.push("admin_notes = ?");
        values.push(body.adminNotes.slice(0, 4000));
      }
      if (typeof body.generationDisabled === "boolean") {
        updates.push("generation_disabled = ?");
        values.push(body.generationDisabled ? 1 : 0);
      }
      if (typeof body.specialAccess === "boolean") {
        updates.push("special_access = ?");
        values.push(body.specialAccess ? 1 : 0);
      }
      if (typeof body.role === "string") {
        updates.push("role = ?");
        values.push(body.role.trim());
      }

      let creditsChanged = false;
      let oldCredits = oldRow.credits;
      let newCredits = oldCredits;
      if (typeof body.credits === "number") {
        if (oldCredits !== body.credits) {
          creditsChanged = true;
          newCredits = body.credits;
          updates.push("credits = ?");
          values.push(newCredits);
        }
      } else if (typeof body.adjustCredits === "number" && body.adjustCredits !== 0) {
        creditsChanged = true;
        newCredits = Math.max(0, oldCredits + body.adjustCredits);
        updates.push("credits = ?");
        values.push(newCredits);
      }

      const runUpdate = db.transaction(() => {
        if (updates.length > 0) {
          values.push(id);
          db.prepare(
            `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
          ).run(...values);
        }

        const actorId = req.admin.sub;
        const actorEmail = req.admin.email;
        const timestamp = new Date().toISOString();
        const stmtAudit = db.prepare(`
          INSERT INTO audit_logs (id, actor_id, actor_email, target_user_id, action_type, old_value, new_value, timestamp, details_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        if (typeof body.suspended === "boolean" && (body.suspended ? 1 : 0) !== oldRow.suspended) {
          stmtAudit.run(crypto.randomUUID(), actorId, actorEmail, id, "suspend_toggle", String(oldRow.suspended), String(body.suspended ? 1 : 0), timestamp, JSON.stringify({ reason: body.adminNotes || "" }));
        }
        if (typeof body.role === "string" && body.role.trim() !== oldRow.role) {
          stmtAudit.run(crypto.randomUUID(), actorId, actorEmail, id, "role_change", oldRow.role, body.role.trim(), timestamp, "{}");
        }
        if (typeof body.generationDisabled === "boolean" && (body.generationDisabled ? 1 : 0) !== oldRow.generation_disabled) {
          stmtAudit.run(crypto.randomUUID(), actorId, actorEmail, id, "generation_toggle", String(oldRow.generation_disabled), String(body.generationDisabled ? 1 : 0), timestamp, "{}");
        }
        if (typeof body.specialAccess === "boolean" && (body.specialAccess ? 1 : 0) !== oldRow.special_access) {
          stmtAudit.run(crypto.randomUUID(), actorId, actorEmail, id, "special_access_change", String(oldRow.special_access), String(body.specialAccess ? 1 : 0), timestamp, "{}");
        }
        if (typeof body.subscriptionPlan === "string" && body.subscriptionPlan.trim() !== oldRow.subscription_plan) {
          stmtAudit.run(crypto.randomUUID(), actorId, actorEmail, id, "plan_change", oldRow.subscription_plan, body.subscriptionPlan.trim(), timestamp, "{}");
        }

        if (creditsChanged) {
          const diff = newCredits - oldCredits;
          const added = diff > 0 ? diff : 0;
          const deducted = diff < 0 ? -diff : 0;
          const reason = typeof body.creditsReason === "string" && body.creditsReason.trim()
            ? body.creditsReason.trim()
            : (diff > 0 ? "Admin added credits" : "Admin removed credits");
          
          db.prepare(`
            INSERT INTO credit_transactions (id, user_id, action_type, credits_added, credits_deducted, previous_balance, new_balance, timestamp, source, reason, details_json)
            VALUES (?, ?, 'admin_adjustment', ?, ?, ?, ?, ?, 'admin', ?, ?)
          `).run(
            crypto.randomUUID(),
            id,
            added,
            deducted,
            oldCredits,
            newCredits,
            timestamp,
            reason,
            JSON.stringify({ adminId: req.admin.sub, reason })
          );

          stmtAudit.run(crypto.randomUUID(), actorId, actorEmail, id, "adjust_credits", String(oldCredits), String(newCredits), timestamp, JSON.stringify({ reason }));
        }
      });

      runUpdate();

      const updatedRow = db.prepare(
        "SELECT id, email, name, created_at as createdAt, suspended, subscription_plan as subscriptionPlan, subscription_status as subscriptionStatus, admin_notes as adminNotes, credits, generation_disabled as generationDisabled, special_access as specialAccess, role FROM users WHERE id = ?"
      ).get(id);

      return res.json({ ok: true, user: updatedRow });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Get transaction history for a specific user (admin view)
  app.get("/api/admin/users/:id/history", requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const rows = db.prepare(`
        SELECT id, action_type as actionType, credits_added as creditsAdded, credits_deducted as creditsDeducted, previous_balance as previousBalance, new_balance as newBalance, timestamp, source, reason, details_json as detailsJson
        FROM credit_transactions
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 100
      `).all(id);
      return res.json({ ok: true, history: rows });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Get all transaction history (admin view)
  app.get("/api/admin/credits/transactions", requireAdmin, (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT t.id, t.user_id as userId, u.name as userName, u.email as userEmail, t.action_type as actionType, t.credits_added as creditsAdded, t.credits_deducted as creditsDeducted, t.previous_balance as previousBalance, t.new_balance as newBalance, t.timestamp, t.source, t.reason, t.details_json as detailsJson
        FROM credit_transactions t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.timestamp DESC
        LIMIT 200
      `).all();
      return res.json({ ok: true, transactions: rows });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Get credit settings (admin view)
  app.get("/api/admin/credits/rates", requireAdmin, (req, res) => {
    try {
      const rows = db.prepare("SELECT key, value FROM credit_settings").all();
      const rates = {};
      for (const r of rows) {
        rates[r.key] = Number(r.value);
      }
      if (rates.cost_image_schnell === undefined) rates.cost_image_schnell = 2;
      if (rates.cost_image_dev === undefined) rates.cost_image_dev = 3;
      if (rates.cost_video_std === undefined) rates.cost_video_std = 5;
      if (rates.cost_video_pro === undefined) rates.cost_video_pro = 8;
      if (rates.credits_per_image === undefined) rates.credits_per_image = rates.cost_image_schnell;
      if (rates.credits_per_video_second === undefined) rates.credits_per_video_second = rates.cost_video_std;
      return res.json({ ok: true, rates });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Update credit settings (admin view)
  app.post("/api/admin/credits/rates", requireAdmin, (req, res) => {
    try {
      const {
        credits_per_image,
        credits_per_video_second,
        cost_image_schnell,
        cost_image_dev,
        cost_video_std,
        cost_video_pro,
        costImageSchnell,
        costImageDev,
        costVideoStd,
        costVideoPro,
        imageRate,
        videoRate,
      } = req.body;

      const imgSchnell = cost_image_schnell ?? costImageSchnell ?? imageRate;
      const imgDev = cost_image_dev ?? costImageDev;
      const vidStd = cost_video_std ?? costVideoStd ?? videoRate;
      const vidPro = cost_video_pro ?? costVideoPro;

      const stmt = db.prepare("INSERT OR REPLACE INTO credit_settings (key, value) VALUES (?, ?)");

      if (imgSchnell !== undefined && imgSchnell !== null) {
        stmt.run("cost_image_schnell", String(imgSchnell));
        stmt.run("credits_per_image", String(imgSchnell));
      }
      if (imgDev !== undefined && imgDev !== null) {
        stmt.run("cost_image_dev", String(imgDev));
      }
      if (vidStd !== undefined && vidStd !== null) {
        stmt.run("cost_video_std", String(vidStd));
        stmt.run("credits_per_video_second", String(vidStd));
      }
      if (vidPro !== undefined && vidPro !== null) {
        stmt.run("cost_video_pro", String(vidPro));
      }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Alias endpoints for rates mapping to what the settings page calls
  app.get("/api/admin/rates", requireAdmin, (req, res) => {
    try {
      const rows = db.prepare("SELECT key, value FROM credit_settings").all();
      const rates = {};
      for (const r of rows) {
        rates[r.key] = Number(r.value);
      }
      return res.json({
        ok: true,
        rates: {
          cost_image_schnell: rates.cost_image_schnell ?? 2,
          cost_image_dev: rates.cost_image_dev ?? 3,
          cost_video_std: rates.cost_video_std ?? 5,
          cost_video_pro: rates.cost_video_pro ?? 8,
          credits_per_image: rates.cost_image_schnell ?? rates.credits_per_image ?? 2,
          credits_per_video_second: rates.cost_video_std ?? rates.credits_per_video_second ?? 5,
        },
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  app.post("/api/admin/rates", requireAdmin, (req, res) => {
    try {
      const {
        credits_per_image,
        credits_per_video_second,
        cost_image_schnell,
        cost_image_dev,
        cost_video_std,
        cost_video_pro,
        costImageSchnell,
        costImageDev,
        costVideoStd,
        costVideoPro,
        imageRate,
        videoRate,
      } = req.body;

      const imgSchnell = cost_image_schnell ?? costImageSchnell ?? imageRate;
      const imgDev = cost_image_dev ?? costImageDev;
      const vidStd = cost_video_std ?? costVideoStd ?? videoRate;
      const vidPro = cost_video_pro ?? costVideoPro;

      const stmt = db.prepare("INSERT OR REPLACE INTO credit_settings (key, value) VALUES (?, ?)");

      if (imgSchnell !== undefined && imgSchnell !== null) {
        stmt.run("cost_image_schnell", String(imgSchnell));
        stmt.run("credits_per_image", String(imgSchnell));
      }
      if (imgDev !== undefined && imgDev !== null) {
        stmt.run("cost_image_dev", String(imgDev));
      }
      if (vidStd !== undefined && vidStd !== null) {
        stmt.run("cost_video_std", String(vidStd));
        stmt.run("credits_per_video_second", String(vidStd));
      }
      if (vidPro !== undefined && vidPro !== null) {
        stmt.run("cost_video_pro", String(vidPro));
      }

      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Admin analytics endpoint
  app.get("/api/admin/analytics", requireAdmin, (req, res) => {
    try {
      const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
      const suspendedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE suspended = 1").get().count;
      const activeUsers = totalUsers - suspendedUsers;

      const totalCreditsAdded = db.prepare("SELECT COALESCE(SUM(credits_added), 0) as total FROM credit_transactions").get().total;
      const totalCreditsConsumed = db.prepare("SELECT COALESCE(SUM(credits_deducted), 0) as total FROM credit_transactions WHERE action_type IN ('image_generation', 'video_generation')").get().total;

      const activeTasks = db.prepare("SELECT COUNT(*) as count FROM studio_tasks WHERE status = 'pending'").get().count;

      const engineRows = db.prepare("SELECT type, details_json FROM studio_tasks").all();
      const engineCounts = {};
      for (const row of engineRows) {
        let modelName = row.type === "image" ? "flux1-dev" : "video-standard";
        try {
          const details = JSON.parse(row.details_json);
          if (details.model) {
            modelName = details.model.split("/").pop();
          } else if (row.type === "video" && details.tier) {
            modelName = `video-${details.tier}`;
          }
        } catch(e) {}
        engineCounts[modelName] = (engineCounts[modelName] || 0) + 1;
      }

      const engines = Object.entries(engineCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

      const planRows = db.prepare("SELECT subscription_plan as plan, COUNT(*) as count FROM users GROUP BY subscription_plan").all();

      const auditLogs = db.prepare(`
        SELECT a.id, a.actor_id as actorId, a.actor_email as actorEmail, a.target_user_id as targetUserId, u.email as targetUserEmail, a.action_type as actionType, a.old_value as oldValue, a.new_value as newValue, a.timestamp, a.details_json as detailsJson
        FROM audit_logs a
        LEFT JOIN users u ON a.target_user_id = u.id
        ORDER BY a.timestamp DESC
        LIMIT 100
      `).all();

      return res.json({
        ok: true,
        stats: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          totalCreditsAdded,
          totalCreditsConsumed,
          activeTasks
        },
        engines,
        plans: planRows,
        auditLogs
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Database error." });
    }
  });

  // Comprehensive Admin Overview Stats Endpoint
  app.get("/api/admin/overview-stats", requireAdmin, (req, res) => {
    try {
      // User counts
      const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
      const suspendedUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE suspended = 1").get().c;
      const unverifiedUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE email_verified = 0").get().c;
      const activeUsers = totalUsers - suspendedUsers;

      // Revenue stats from payments table (only actual captured Razorpay gateway payments, excluding simulated test data)
      let totalRevenueINR = 0;
      let successfulPaymentsCount = 0;
      try {
        const payRow = db.prepare("SELECT COALESCE(SUM(amount_paise), 0) as total_paise, COUNT(*) as c FROM payments WHERE LOWER(status) IN ('captured', 'credited', 'verified', 'paid', 'success') AND razorpay_payment_id IS NOT NULL AND razorpay_payment_id != '' AND razorpay_payment_id NOT LIKE 'pay_sim_%'").get();
        totalRevenueINR = Math.round((payRow?.total_paise || 0) / 100);
        successfulPaymentsCount = payRow?.c || 0;
      } catch (err) {
        console.error("[admin/overview-stats] revenue query error:", err.message);
      }

      // Support tickets stats
      let openTickets = 0;
      let urgentTickets = 0;
      let unreadSupportReplies = 0;
      try {
        openTickets = db.prepare("SELECT COUNT(*) as c FROM support_tickets WHERE status IN ('open', 'in_progress')").get().c;
        urgentTickets = db.prepare("SELECT COUNT(*) as c FROM support_tickets WHERE priority IN ('urgent', 'high') AND status IN ('open', 'in_progress')").get().c;
        unreadSupportReplies = db.prepare("SELECT COUNT(DISTINCT ticket_id) as c FROM support_replies WHERE is_admin = 0 AND read_by_admin = 0").get().c;
      } catch {}

      // Messages and newsletter
      let unreadContactMessages = 0;
      try {
        unreadContactMessages = db.prepare("SELECT COUNT(*) as c FROM contact_messages WHERE read = 0").get().c;
      } catch {}

      let newsletterSubscribers = 0;
      try {
        newsletterSubscribers = db.prepare("SELECT COUNT(*) as c FROM newsletter_subscribers").get().c;
      } catch {}

      // Recent audit activity (last 6 actions)
      let recentAuditLogs = [];
      try {
        recentAuditLogs = db.prepare(`
          SELECT a.id, a.actor_email as actorEmail, a.action_type as actionType, a.timestamp, u.email as targetEmail
          FROM audit_logs a
          LEFT JOIN users u ON a.target_user_id = u.id
          ORDER BY a.timestamp DESC
          LIMIT 6
        `).all();
      } catch {}

      return res.json({
        ok: true,
        users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers, unverified: unverifiedUsers },
        financials: { totalRevenueINR, successfulPaymentsCount },
        support: { openTickets, urgentTickets, unreadSupportReplies },
        communications: { unreadContactMessages, newsletterSubscribers },
        recentActivity: recentAuditLogs,
      });
    } catch (e) {
      console.error("[admin/overview-stats] error:", e);
      return res.status(500).json({ ok: false, error: "Failed to load overview stats." });
    }
  });

  // ─── ADMIN: User Credits Adjustment with Full Audit Trail ────────────────
  app.post("/api/admin/users/:id/credits", requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { amount, creditType = "promotional", reason } = req.body || {};
      if (typeof amount !== "number" || amount === 0) {
        return res.status(400).json({ ok: false, error: "A valid non-zero adjustment amount is required." });
      }
      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return res.status(400).json({ ok: false, error: "A non-empty reason is required for administrative credit adjustments." });
      }

      const adminUser = { id: req.admin.sub, email: req.admin.email };
      const adjustment = CreditWalletService.adjustCreditsAdmin(db, id, amount, creditType, adminUser, reason);
      const wallet = CreditWalletService.getWallet(db, id);

      return res.json({ ok: true, wallet, adjustment });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Failed to adjust user credits." });
    }
  });

  // ─── ADMIN: Financial Visibility & Margin Analysis ────────────────────────
  app.get("/api/admin/financials", requireAdmin, async (req, res) => {
    try {
      // 1. Credit Supply & Liability Breakdown
      const supplyRow = db.prepare(`
        SELECT 
          COALESCE(SUM(purchased_credits), 0) as totalPurchased,
          COALESCE(SUM(promotional_credits), 0) as totalPromotional,
          COALESCE(SUM(reserved_credits), 0) as totalReserved
        FROM users
      `).get();

      const outstandingPurchasedCredits = supplyRow?.totalPurchased || 0;
      const outstandingPromotionalCredits = supplyRow?.totalPromotional || 0;
      const reservedCredits = supplyRow?.totalReserved || 0;
      const totalCreditSupply = outstandingPurchasedCredits + outstandingPromotionalCredits;

      // Rate settings
      const settingRows = db.prepare("SELECT key, value FROM pricing_settings").all();
      const settings = Object.fromEntries(settingRows.map((r) => [r.key, Number(r.value)]));
      const creditInrRate = settings.credit_inr_rate || 1.0;
      const inrUsdRate = settings.inr_usd_rate || 87.0;

      // Monetary liability = unused purchased credits * creditInrRate
      const monetaryLiabilityINR = Math.round(outstandingPurchasedCredits * creditInrRate);

      // 2. Revenue from payments
      const payRow = db.prepare(`
        SELECT COALESCE(SUM(amount_paise), 0) as total_paise, COUNT(*) as c 
        FROM payments 
        WHERE LOWER(status) IN ('captured', 'credited', 'verified', 'paid', 'success') 
          AND razorpay_payment_id IS NOT NULL 
          AND razorpay_payment_id != '' 
          AND razorpay_payment_id NOT LIKE 'pay_sim_%'
      `).get();
      const totalRevenueINR = Math.round((payRow?.total_paise || 0) / 100);
      const successfulPaymentsCount = payRow?.c || 0;

      // 3. KIE.ai Provider Spend from generation_jobs
      const jobStatsRow = db.prepare(`
        SELECT 
          COUNT(*) as totalJobs,
          COALESCE(SUM(CASE WHEN UPPER(status) = 'COMPLETED' THEN 1 ELSE 0 END), 0) as succeededJobs,
          COALESCE(SUM(CASE WHEN UPPER(status) = 'FAILED' THEN 1 ELSE 0 END), 0) as failedJobs,
          COALESCE(SUM(CASE WHEN UPPER(status) = 'COMPLETED' THEN credit_cost ELSE 0 END), 0) as totalCreditsConsumed,
          COALESCE(SUM(CASE WHEN UPPER(status) IN ('COMPLETED', 'PROCESSING', 'RESERVED') THEN provider_cost_usd ELSE 0 END), 0) as totalKieUsd
        FROM generation_jobs
      `).get();

      const totalJobs = jobStatsRow?.totalJobs || 0;
      const succeededJobs = jobStatsRow?.succeededJobs || 0;
      const failedJobs = jobStatsRow?.failedJobs || 0;
      const totalCreditsConsumed = jobStatsRow?.totalCreditsConsumed || 0;
      const totalKieCostUSD = Number(jobStatsRow?.totalKieUsd || 0);
      const totalKieCostINR = Math.round(totalKieCostUSD * inrUsdRate);

      // Breakdown by Model
      const modelBreakdownRows = db.prepare(`
        SELECT 
          model_id as modelId,
          generation_type as type,
          COUNT(*) as jobsCount,
          COALESCE(SUM(CASE WHEN UPPER(status) = 'COMPLETED' THEN credit_cost ELSE 0 END), 0) as creditsConsumed,
          COALESCE(SUM(CASE WHEN UPPER(status) IN ('COMPLETED', 'PROCESSING', 'RESERVED') THEN provider_cost_usd ELSE 0 END), 0) as totalCostUsd
        FROM generation_jobs
        GROUP BY model_id, generation_type
        ORDER BY jobsCount DESC
      `).all();

      const spendByModel = modelBreakdownRows.map((r) => ({
        modelId: r.modelId,
        type: r.type,
        jobsCount: r.jobsCount,
        creditsConsumed: r.creditsConsumed,
        totalCostUsd: Number(r.totalCostUsd || 0).toFixed(4),
        totalCostInr: Math.round(Number(r.totalCostUsd || 0) * inrUsdRate),
      }));

      // 4. Profit & Gross Margin
      const grossProfitINR = totalRevenueINR - totalKieCostINR;
      const grossMarginPercent = totalRevenueINR > 0
        ? Number(((grossProfitINR / totalRevenueINR) * 100).toFixed(1))
        : 0;

      // 5. Live KIE.ai Provider Balance & Status
      let providerBalance = { ok: false, configured: false, credits: 0, creditsUsd: 0, isSufficientForVideo: false };
      try {
        const { KieProvider } = require("./services/kie-provider");
        providerBalance = await KieProvider.checkProviderBalance();
      } catch (e) {
        providerBalance.error = e.message;
      }

      return res.json({
        ok: true,
        financials: {
          providerBalance,
          creditSupply: {
            outstandingPurchasedCredits,
            outstandingPromotionalCredits,
            reservedCredits,
            totalCreditSupply,
            creditInrRate,
            monetaryLiabilityINR,
          },
          providerSpend: {
            totalJobs,
            succeededJobs,
            failedJobs,
            totalCreditsConsumed,
            totalKieCostUSD: Number(totalKieCostUSD.toFixed(4)),
            totalKieCostINR,
            inrUsdRate,
            spendByModel,
          },
          marginAnalysis: {
            totalRevenueINR,
            successfulPaymentsCount,
            totalKieCostINR,
            grossProfitINR,
            grossMarginPercent,
          },
        },
      });
    } catch (e) {
      console.error("[admin/financials] error:", e);
      return res.status(500).json({ ok: false, error: "Failed to load financial metrics." });
    }
  });

  // ─── ADMIN: Model Registry Management ────────────────────────────────────
  app.get("/api/admin/models", requireAdmin, (req, res) => {
    try {
      const models = ModelRegistryService.getAllModels(db);
      return res.json({ ok: true, models });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Failed to load models." });
    }
  });

  app.patch("/api/admin/models/:id", requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const updated = ModelRegistryService.updateModel(db, id, req.body);

      db.prepare(`
        INSERT INTO audit_logs (id, actor_id, actor_email, target_user_id, action_type, old_value, new_value, timestamp, details_json)
        VALUES (?, ?, ?, 'system', 'update_model_config', ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        req.admin.sub,
        req.admin.email,
        id,
        JSON.stringify(req.body),
        new Date().toISOString(),
        JSON.stringify({ modelId: id, updates: req.body })
      );

      return res.json({ ok: true, model: updated });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message || "Failed to update model." });
    }
  });
}

module.exports = { mountAdminUsersRoutes };
