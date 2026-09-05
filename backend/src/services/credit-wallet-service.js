/**
 * credit-wallet-service.js
 * Production-Grade Ledger-Based Credit Economy & Transaction Safe Wallet.
 * 
 * - Distinguishes Purchased Credits vs Promotional Credits.
 * - Prevents double-spending, race conditions, and negative balances via atomic SQLite transactions.
 * - Enforces full double-entry audit trail across all credit operations.
 */

const crypto = require("node:crypto");

class CreditWalletService {
  /**
   * Get user wallet balances
   */
  static getWallet(db, userId) {
    const user = db
      .prepare(
        `SELECT id, email, credits, purchased_credits, promotional_credits, reserved_credits,
                suspended, generation_disabled
         FROM users
         WHERE id = ?`
      )
      .get(userId);

    if (!user) throw new Error("User not found.");

    const purchased = Number(user.purchased_credits || 0);
    const promotional = Number(user.promotional_credits || 0);
    const reserved = Number(user.reserved_credits || 0);
    const available = Math.max(0, purchased + promotional - reserved);

    return {
      userId: user.id,
      email: user.email,
      purchased,
      promotional,
      reserved,
      available,
      totalHeld: purchased + promotional,
      suspended: Boolean(user.suspended),
      generationDisabled: Boolean(user.generation_disabled),
    };
  }

  /**
   * Atomically reserve credits for a generation job
   */
  static reserveCredits(db, userId, amount, jobId, metadata = {}) {
    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("Reservation amount must be a positive number.");
    }

    let result;
    db.transaction(() => {
      const user = db
        .prepare(
          `SELECT id, credits, purchased_credits, promotional_credits, reserved_credits,
                  suspended, generation_disabled
           FROM users
           WHERE id = ?`
        )
        .get(userId);

      if (!user) throw new Error("User not found.");
      if (user.suspended === 1) throw new Error("Your account has been suspended.");
      if (user.generation_disabled === 1) throw new Error("Generation is disabled for your account.");

      const purchased = Number(user.purchased_credits || 0);
      const promotional = Number(user.promotional_credits || 0);
      const currentReserved = Number(user.reserved_credits || 0);
      const available = purchased + promotional - currentReserved;

      if (available < amount) {
        const err = new Error("INSUFFICIENT_CREDITS");
        err.status = 400;
        err.details = { available, required: amount, pendingHolds: currentReserved };
        throw err;
      }

      const newReserved = currentReserved + amount;
      const newAvailable = Math.max(0, purchased + promotional - newReserved);

      // Atomically update user reservation and spendable credits
      db.prepare(
        `UPDATE users
         SET reserved_credits = ?, credits = ?
         WHERE id = ?`
      ).run(newReserved, newAvailable, userId);

      const txId = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO credit_transactions (
          id, user_id, action_type, credits_added, credits_deducted,
          previous_balance, new_balance, timestamp, source, reason,
          credit_type, purchased_delta, promotional_delta, reserved_delta,
          job_id, details_json, metadata_json
        ) VALUES (?, ?, 'RESERVATION', 0, 0, ?, ?, ?, 'studio', ?, 'mixed', 0, 0, ?, ?, ?, ?)`
      ).run(
        txId,
        userId,
        available,
        newAvailable,
        now,
        metadata.reason || `Reserved ${amount} credits for generation job`,
        amount,
        jobId,
        JSON.stringify(metadata),
        JSON.stringify(metadata)
      );

      result = {
        txId,
        availableBalance: newAvailable,
        reservedCredits: newReserved,
      };
    })();

    return result;
  }

  /**
   * Finalize consumption when a job succeeds
   */
  static finalizeConsumption(db, userId, amount, jobId, metadata = {}) {
    let result;
    db.transaction(() => {
      const user = db
        .prepare(
          `SELECT id, credits, purchased_credits, promotional_credits, reserved_credits
           FROM users
           WHERE id = ?`
        )
        .get(userId);

      if (!user) throw new Error("User not found.");

      const purchased = Number(user.purchased_credits || 0);
      const promotional = Number(user.promotional_credits || 0);
      const reserved = Number(user.reserved_credits || 0);
      const prevAvailable = Math.max(0, purchased + promotional - reserved);

      // Decrement reserved credits
      const newReserved = Math.max(0, reserved - amount);

      // Consume promotional credits first to reduce customer liability, then purchased
      const promoDeduct = Math.min(promotional, amount);
      const purchasedDeduct = Math.max(0, amount - promoDeduct);

      const newPromo = Math.max(0, promotional - promoDeduct);
      const newPurchased = Math.max(0, purchased - purchasedDeduct);
      const newAvailable = Math.max(0, newPurchased + newPromo - newReserved);

      db.prepare(
        `UPDATE users
         SET purchased_credits = ?, promotional_credits = ?, reserved_credits = ?, credits = ?
         WHERE id = ?`
      ).run(newPurchased, newPromo, newReserved, newAvailable, userId);

      const creditType = purchasedDeduct > 0 ? (promoDeduct > 0 ? "mixed" : "purchased") : "promotional";
      const txId = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO credit_transactions (
          id, user_id, action_type, credits_added, credits_deducted,
          previous_balance, new_balance, timestamp, source, reason,
          credit_type, purchased_delta, promotional_delta, reserved_delta,
          job_id, details_json, metadata_json
        ) VALUES (?, ?, 'CONSUMPTION', 0, ?, ?, ?, ?, 'studio', ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        txId,
        userId,
        amount,
        prevAvailable,
        newAvailable,
        now,
        metadata.reason || `Generation completed (${amount} credits consumed)`,
        creditType,
        -purchasedDeduct,
        -promoDeduct,
        -amount,
        jobId,
        JSON.stringify(metadata),
        JSON.stringify(metadata)
      );

      result = {
        txId,
        newAvailable,
        newPurchased,
        newPromo,
      };
    })();

    return result;
  }

  /**
   * Release reserved credits when a job fails or is cancelled
   */
  static releaseReservation(db, userId, amount, jobId, reason = "Job failed upstream", metadata = {}) {
    let result;
    db.transaction(() => {
      const user = db
        .prepare(
          `SELECT id, credits, purchased_credits, promotional_credits, reserved_credits
           FROM users
           WHERE id = ?`
        )
        .get(userId);

      if (!user) return;

      const purchased = Number(user.purchased_credits || 0);
      const promotional = Number(user.promotional_credits || 0);
      const reserved = Number(user.reserved_credits || 0);
      const prevAvailable = Math.max(0, purchased + promotional - reserved);

      const newReserved = Math.max(0, reserved - amount);
      const newAvailable = Math.max(0, purchased + promotional - newReserved);

      db.prepare(
        `UPDATE users
         SET reserved_credits = ?, credits = ?
         WHERE id = ?`
      ).run(newReserved, newAvailable, userId);

      const txId = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO credit_transactions (
          id, user_id, action_type, credits_added, credits_deducted,
          previous_balance, new_balance, timestamp, source, reason,
          credit_type, purchased_delta, promotional_delta, reserved_delta,
          job_id, details_json, metadata_json
        ) VALUES (?, ?, 'RELEASE', 0, 0, ?, ?, ?, 'studio', ?, 'mixed', 0, 0, ?, ?, ?, ?)`
      ).run(
        txId,
        userId,
        prevAvailable,
        newAvailable,
        now,
        `Reservation released: ${reason}`,
        -amount,
        jobId,
        JSON.stringify(metadata),
        JSON.stringify(metadata)
      );

      result = { txId, newAvailable, newReserved };
    })();

    return result;
  }

  /**
   * Grant purchased credits upon verified server payment
   */
  static creditPurchased(db, userId, amount, paymentId, metadata = {}) {
    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("Credit amount must be positive.");
    }

    let result;
    db.transaction(() => {
      const user = db
        .prepare(
          `SELECT id, credits, purchased_credits, promotional_credits, reserved_credits
           FROM users
           WHERE id = ?`
        )
        .get(userId);

      if (!user) throw new Error("User not found.");

      const prevPurchased = Number(user.purchased_credits || 0);
      const promotional = Number(user.promotional_credits || 0);
      const reserved = Number(user.reserved_credits || 0);
      const prevAvailable = Math.max(0, prevPurchased + promotional - reserved);

      const newPurchased = prevPurchased + amount;
      const newAvailable = Math.max(0, newPurchased + promotional - reserved);

      db.prepare(
        `UPDATE users
         SET purchased_credits = ?, credits = ?
         WHERE id = ?`
      ).run(newPurchased, newAvailable, userId);

      const txId = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO credit_transactions (
          id, user_id, action_type, credits_added, credits_deducted,
          previous_balance, new_balance, timestamp, source, reason,
          credit_type, purchased_delta, promotional_delta, reserved_delta,
          payment_id, details_json, metadata_json
        ) VALUES (?, ?, 'PURCHASE', ?, 0, ?, ?, ?, 'payment', ?, 'purchased', ?, 0, 0, ?, ?, ?)`
      ).run(
        txId,
        userId,
        amount,
        prevAvailable,
        newAvailable,
        now,
        metadata.reason || `Purchased package (${amount} credits)`,
        amount,
        paymentId,
        JSON.stringify(metadata),
        JSON.stringify(metadata)
      );

      result = { txId, newAvailable, newPurchased };
    })();

    return result;
  }

  /**
   * Admin manual credit adjustment with complete audit trail
   */
  static adjustCreditsAdmin(db, userId, amount, creditType = "promotional", adminUser, reason) {
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      throw new Error("A reason must be provided for administrative credit adjustments.");
    }

    let result;
    db.transaction(() => {
      const user = db
        .prepare(
          `SELECT id, email, credits, purchased_credits, promotional_credits, reserved_credits
           FROM users
           WHERE id = ?`
        )
        .get(userId);

      if (!user) throw new Error("Target user not found.");

      const isPromo = creditType.toLowerCase() === "promotional";
      const prevPurchased = Number(user.purchased_credits || 0);
      const prevPromo = Number(user.promotional_credits || 0);
      const reserved = Number(user.reserved_credits || 0);
      const prevAvailable = Math.max(0, prevPurchased + prevPromo - reserved);

      let newPurchased = prevPurchased;
      let newPromo = prevPromo;

      if (isPromo) {
        newPromo = Math.max(0, prevPromo + amount);
      } else {
        newPurchased = Math.max(0, prevPurchased + amount);
      }

      const newAvailable = Math.max(0, newPurchased + newPromo - reserved);

      db.prepare(
        `UPDATE users
         SET purchased_credits = ?, promotional_credits = ?, credits = ?
         WHERE id = ?`
      ).run(newPurchased, newPromo, newAvailable, userId);

      const txId = crypto.randomUUID();
      const now = new Date().toISOString();
      const details = {
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        reason: reason.trim(),
        creditType: isPromo ? "promotional" : "purchased",
        amount,
      };

      db.prepare(
        `INSERT INTO credit_transactions (
          id, user_id, action_type, credits_added, credits_deducted,
          previous_balance, new_balance, timestamp, source, reason,
          credit_type, purchased_delta, promotional_delta, reserved_delta,
          details_json, metadata_json
        ) VALUES (?, ?, 'ADMIN_ADJUSTMENT', ?, ?, ?, ?, ?, 'admin', ?, ?, ?, ?, 0, ?, ?)`
      ).run(
        txId,
        userId,
        amount > 0 ? amount : 0,
        amount < 0 ? Math.abs(amount) : 0,
        prevAvailable,
        newAvailable,
        now,
        `Admin: ${reason.trim()}`,
        isPromo ? "promotional" : "purchased",
        isPromo ? 0 : amount,
        isPromo ? amount : 0,
        JSON.stringify(details),
        JSON.stringify(details)
      );

      db.prepare(
        `INSERT INTO audit_logs (
          id, actor_id, actor_email, target_user_id, action_type,
          old_value, new_value, timestamp, details_json
        ) VALUES (?, ?, ?, ?, 'adjust_credits', ?, ?, ?, ?)`
      ).run(
        crypto.randomUUID(),
        adminUser.id,
        adminUser.email,
        userId,
        String(prevAvailable),
        String(newAvailable),
        now,
        JSON.stringify(details)
      );

      result = { txId, newAvailable, newPurchased, newPromo };
    })();

    return result;
  }

  /**
   * Deduct purchased credits upon refund
   */
  static refundPurchased(db, userId, amount, paymentId, reason = "Payment refund", metadata = {}) {
    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("Refund amount must be positive.");
    }

    let result;
    db.transaction(() => {
      const user = db
        .prepare(
          `SELECT id, credits, purchased_credits, promotional_credits, reserved_credits
           FROM users
           WHERE id = ?`
        )
        .get(userId);

      if (!user) return;

      const prevPurchased = Number(user.purchased_credits || 0);
      const promotional = Number(user.promotional_credits || 0);
      const reserved = Number(user.reserved_credits || 0);
      const prevAvailable = Math.max(0, prevPurchased + promotional - reserved);

      const deductAmount = Math.min(prevPurchased, amount);
      const newPurchased = Math.max(0, prevPurchased - deductAmount);
      const newAvailable = Math.max(0, newPurchased + promotional - reserved);

      db.prepare(
        `UPDATE users
         SET purchased_credits = ?, credits = ?
         WHERE id = ?`
      ).run(newPurchased, newAvailable, userId);

      const txId = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO credit_transactions (
          id, user_id, action_type, credits_added, credits_deducted,
          previous_balance, new_balance, timestamp, source, reason,
          credit_type, purchased_delta, promotional_delta, reserved_delta,
          payment_id, details_json, metadata_json
        ) VALUES (?, ?, 'REFUND', 0, ?, ?, ?, ?, 'payment', ?, 'purchased', ?, 0, 0, ?, ?, ?)`
      ).run(
        txId,
        userId,
        deductAmount,
        prevAvailable,
        newAvailable,
        now,
        reason,
        -deductAmount,
        paymentId,
        JSON.stringify(metadata),
        JSON.stringify(metadata)
      );

      result = { txId, newAvailable, newPurchased, deducted: deductAmount };
    })();

    return result;
  }
}

module.exports = { CreditWalletService };
