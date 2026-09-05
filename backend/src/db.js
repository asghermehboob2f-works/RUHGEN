const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { hashPassword } = require("./auth");

/**
 * Resolve directory for SQLite and local JSON (seeds, legacy migration).
 * - Default: `backend/data` next to this file (self-contained deploy).
 * - Override: absolute `DATA_DIR` (e.g. mounted volume in production).
 *
 * @param {string} projectRoot - monorepo root (parent of /backend); used for legacy `<root>/data` paths only
 * @returns {{ dataDir: string, backendRoot: string }}
 */
function resolveDataDirs(projectRoot) {
  const backendRoot = path.resolve(__dirname, "..");
  const fromEnv = process.env.DATA_DIR && String(process.env.DATA_DIR).trim();
  const dataDir = fromEnv ? path.resolve(projectRoot, fromEnv) : path.join(backendRoot, "data");
  return { dataDir, backendRoot };
}

/** If DB only exists under legacy repo `data/`, copy into `dataDir` once (stop server on old path first if WAL is active). */
function maybeMigrateLegacySqlite(dataDir, projectRoot) {
  const dest = path.join(dataDir, "ruhgen.sqlite");
  const legacy = path.join(projectRoot, "data", "ruhgen.sqlite");
  if (fs.existsSync(dest) || !fs.existsSync(legacy)) return;
  fs.mkdirSync(dataDir, { recursive: true });
  fs.copyFileSync(legacy, dest);
  for (const suffix of ["-wal", "-shm"]) {
    const l = legacy + suffix;
    if (fs.existsSync(l)) fs.copyFileSync(l, dest + suffix);
  }
}

function siteContentSeedPath(dataDir, projectRoot) {
  const repoBackend = path.join(projectRoot, "backend", "data", "site-content.json");
  if (fs.existsSync(repoBackend)) return repoBackend;
  const repoData = path.join(projectRoot, "data", "site-content.json");
  if (fs.existsSync(repoData)) return repoData;
  const primary = path.join(dataDir, "site-content.json");
  if (fs.existsSync(primary)) return primary;
  return primary;
}

function legacyContactPath(dataDir, projectRoot) {
  const primary = path.join(dataDir, "contact-messages.json");
  if (fs.existsSync(primary)) return primary;
  return path.join(projectRoot, "data", "contact-messages.json");
}

function legacySubscribersPath(dataDir, projectRoot) {
  const primary = path.join(dataDir, "newsletter-subscribers.json");
  if (fs.existsSync(primary)) return primary;
  return path.join(projectRoot, "data", "newsletter-subscribers.json");
}

/**
 * @param {string} projectRoot - monorepo root (parent of /backend)
 * @returns {{ db: import("better-sqlite3").Database; dataDir: string }}
 */
function openDb(projectRoot) {
  const { dataDir } = resolveDataDirs(projectRoot);
  maybeMigrateLegacySqlite(dataDir, projectRoot);

  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "ruhgen.sqlite");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("synchronous = NORMAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      submitted_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      subscribed_at TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'footer'
    );
    CREATE TABLE IF NOT EXISTS site_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      suspended INTEGER NOT NULL DEFAULT 0,
      subscription_plan TEXT NOT NULL DEFAULT 'free',
      subscription_status TEXT NOT NULL DEFAULT 'active',
      admin_notes TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    CREATE INDEX IF NOT EXISTS idx_users_created ON users (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_contact_messages_submitted ON contact_messages (submitted_at DESC);

    -- Community: posts shared by members (images/videos generated in studio
    -- or pasted external URLs).  Counters are denormalized for fast feed reads.
    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('image','video')),
      media_url TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      prompt TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      width INTEGER NOT NULL DEFAULT 0,
      height INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      saves INTEGER NOT NULL DEFAULT 0,
      comments_count INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      removed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_community_posts_created
      ON community_posts (removed, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_community_posts_user
      ON community_posts (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_community_posts_kind
      ON community_posts (kind, removed, created_at DESC);

    CREATE TABLE IF NOT EXISTS community_likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_community_likes_user
      ON community_likes (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS community_saves (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_community_saves_user
      ON community_saves (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_community_comments_post
      ON community_comments (post_id, created_at DESC);

    -- Per-IP/per-user view tracking so view counts can't be inflated by spam.
    CREATE TABLE IF NOT EXISTS community_views (
      post_id TEXT NOT NULL,
      viewer_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, viewer_key)
    );

    CREATE TABLE IF NOT EXISTS academy_tutorials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      video_url TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      duration TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      premium INTEGER NOT NULL DEFAULT 0,
      instructor TEXT NOT NULL DEFAULT 'RUHGEN Masterclass',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academy_courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      subcategory TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      difficulty TEXT NOT NULL DEFAULT 'Beginner',
      premium INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      display_order INTEGER NOT NULL DEFAULT 0,
      instructor TEXT NOT NULL DEFAULT 'RUHGEN Masterclass',
      views INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academy_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      display_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academy_subcategories (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT DEFAULT '',
      display_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES academy_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS academy_views (
      content_id TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'tutorial',
      viewer_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (content_id, content_type, viewer_key)
    );

    CREATE TABLE IF NOT EXISTS academy_likes (
      content_id TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'tutorial',
      viewer_key TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (content_id, content_type, viewer_key)
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Migrate users table columns safely if existing DB schema is older
  const addUsersCol = (name, def) => {
    try {
      const currentCols = db.pragma("table_info(users)");
      if (!currentCols.some((c) => c.name === name)) {
        db.exec(`ALTER TABLE users ADD COLUMN ${name} ${def}`);
        console.log(`[db] Added ${name} column to users table`);
      }
    } catch (err) {
      if (!err.message.includes("duplicate column")) {
        console.error(`[db] Failed to add ${name} to users:`, err.message);
      }
    }
  };

  addUsersCol("credits", "INTEGER NOT NULL DEFAULT 0");
  addUsersCol("purchased_credits", "INTEGER NOT NULL DEFAULT 0");
  addUsersCol("promotional_credits", "INTEGER NOT NULL DEFAULT 0");
  addUsersCol("reserved_credits", "INTEGER NOT NULL DEFAULT 0");
  addUsersCol("generation_disabled", "INTEGER NOT NULL DEFAULT 0");
  addUsersCol("special_access", "INTEGER NOT NULL DEFAULT 0");
  addUsersCol("role", "TEXT NOT NULL DEFAULT 'user'");
  addUsersCol("team_id", "TEXT DEFAULT NULL");
  addUsersCol("team_role", "TEXT DEFAULT NULL");

  // Backfill purchased_credits vs promotional_credits for legacy users
  try {
    const unbackfilled = db.prepare("SELECT id, credits FROM users WHERE purchased_credits = 0 AND promotional_credits = 0 AND credits > 0").all();
    if (unbackfilled.length > 0) {
      const updateStmt = db.prepare("UPDATE users SET promotional_credits = ?, purchased_credits = ?, reserved_credits = 0 WHERE id = ?");
      for (const u of unbackfilled) {
        let paidCredits = 0;
        try {
          const payRow = db.prepare("SELECT COALESCE(SUM(credits_to_grant), 0) as paid_credits FROM payments WHERE user_id = ? AND LOWER(status) IN ('captured', 'paid', 'verified', 'credited')").get(u.id);
          paidCredits = payRow?.paid_credits || 0;
        } catch {}
        if (paidCredits > 0) {
          const purchased = Math.min(u.credits, paidCredits);
          const promo = Math.max(0, u.credits - purchased);
          updateStmt.run(promo, purchased, u.id);
        } else {
          updateStmt.run(u.credits, 0, u.id);
        }
      }
      console.log(`[db] Backfilled credit separation for ${unbackfilled.length} user accounts.`);
    }
  } catch (backfillErr) {
    console.error("[db] Credit backfill error:", backfillErr.message);
  }

  // --- Email verification & Auth Reset columns ---
  const verCols = [
    ["suspended", "INTEGER NOT NULL DEFAULT 0"],
    ["email_verified", "INTEGER NOT NULL DEFAULT 0"],
    ["email_verified_at", "TEXT DEFAULT NULL"],
    ["verification_status", "TEXT NOT NULL DEFAULT 'pending'"],
    ["verification_deadline", "TEXT DEFAULT NULL"],
    ["verification_token_hash", "TEXT DEFAULT NULL"],
    ["verification_token_expiry", "TEXT DEFAULT NULL"],
    ["otp_hash", "TEXT DEFAULT NULL"],
    ["otp_expiry", "TEXT DEFAULT NULL"],
    ["otp_attempts", "INTEGER NOT NULL DEFAULT 0"],
    ["last_resend_at", "TEXT DEFAULT NULL"],
    ["resend_count_today", "INTEGER NOT NULL DEFAULT 0"],
    ["resend_day", "TEXT DEFAULT NULL"],
    ["last_reminder_at", "TEXT DEFAULT NULL"],
    ["reminder_count", "INTEGER NOT NULL DEFAULT 0"],
    ["reset_token_hash", "TEXT DEFAULT NULL"],
    ["reset_token_expiry", "TEXT DEFAULT NULL"],
    ["reset_otp_hash", "TEXT DEFAULT NULL"],
    ["reset_otp_expiry", "TEXT DEFAULT NULL"],
    ["reset_otp_attempts", "INTEGER NOT NULL DEFAULT 0"],
  ];
  for (const [col, def] of verCols) {
    addUsersCol(col, def);
  }

  // Create credit-related tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      credits_added INTEGER NOT NULL DEFAULT 0,
      credits_deducted INTEGER NOT NULL DEFAULT 0,
      previous_balance INTEGER NOT NULL,
      new_balance INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      source TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      details_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS studio_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      credits INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_studio_tasks_user_status_created
      ON studio_tasks (user_id, status, created_at DESC);
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      timestamp TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
      ON audit_logs (timestamp DESC);
    CREATE TABLE IF NOT EXISTS email_verification_audit (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      timestamp TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_email_ver_audit_ts
      ON email_verification_audit (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_email_ver_audit_user
      ON email_verification_audit (target_user_id, timestamp DESC);

    -- ── Razorpay Payment Records ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      internal_transaction_id TEXT DEFAULT NULL,
      user_id TEXT NOT NULL,
      razorpay_order_id TEXT NOT NULL UNIQUE,
      razorpay_payment_id TEXT UNIQUE DEFAULT NULL,
      razorpay_signature TEXT DEFAULT NULL,
      plan_id TEXT NOT NULL,
      plan_name_snapshot TEXT NOT NULL DEFAULT '',
      amount_paise INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      credits_to_grant INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'CREATED',
      payment_method TEXT DEFAULT NULL,
      payment_method_metadata TEXT DEFAULT '{}',
      failure_reason TEXT DEFAULT NULL,
      failure_code TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      paid_at TEXT DEFAULT NULL,
      verified_at TEXT DEFAULT NULL,
      credited_at TEXT DEFAULT NULL,
      captured_at TEXT DEFAULT NULL,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrate payments table columns if existing DB schema is older
  const payCols = db.pragma("table_info(payments)");
  const addPayCol = (name, def) => {
    if (!payCols.some((c) => c.name === name)) {
      try {
        db.exec(`ALTER TABLE payments ADD COLUMN ${name} ${def}`);
        console.log(`[db] Added ${name} column to payments table`);
      } catch (err) {
        console.error(`[db] Failed to add ${name} to payments:`, err.message);
      }
    }
  };

  addPayCol("internal_transaction_id", "TEXT DEFAULT NULL");
  addPayCol("plan_name_snapshot", "TEXT NOT NULL DEFAULT ''");
  addPayCol("credits_to_grant", "INTEGER NOT NULL DEFAULT 0");
  addPayCol("razorpay_signature", "TEXT DEFAULT NULL");
  addPayCol("payment_method", "TEXT DEFAULT NULL");
  addPayCol("payment_method_metadata", "TEXT DEFAULT '{}'");
  addPayCol("failure_reason", "TEXT DEFAULT NULL");
  addPayCol("failure_code", "TEXT DEFAULT NULL");
  addPayCol("updated_at", "TEXT DEFAULT ''");
  addPayCol("paid_at", "TEXT DEFAULT NULL");
  addPayCol("verified_at", "TEXT DEFAULT NULL");
  addPayCol("credited_at", "TEXT DEFAULT NULL");

  // Backfill internal_transaction_id for legacy records
  const legacyNoTx = db
    .prepare("SELECT id, created_at FROM payments WHERE internal_transaction_id IS NULL OR internal_transaction_id = ''")
    .all();
  if (legacyNoTx.length > 0) {
    const stmt = db.prepare("UPDATE payments SET internal_transaction_id = ?, updated_at = ? WHERE id = ?");
    for (const r of legacyNoTx) {
      const txId = `TXN-${Date.now()}-${r.id.slice(0, 8).toUpperCase()}`;
      stmt.run(txId, new Date().toISOString(), r.id);
    }
    console.log(`[db] Backfilled internal_transaction_id for ${legacyNoTx.length} legacy payment records`);
  }

  // Create payment indexes safely
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_user_created
      ON payments (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_payments_status_created
      ON payments (status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_payments_order_id
      ON payments (razorpay_order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_payment_id
      ON payments (razorpay_payment_id);
    CREATE INDEX IF NOT EXISTS idx_payments_internal_tx
      ON payments (internal_transaction_id);

    -- ── Webhook Events (Idempotency & Reconciliation) ────────────────────
    CREATE TABLE IF NOT EXISTS webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      received_at TEXT NOT NULL,
      payload_hash TEXT NOT NULL DEFAULT '',
      processing_status TEXT NOT NULL DEFAULT 'processed',
      processing_result TEXT NOT NULL DEFAULT '',
      payment_id TEXT DEFAULT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_webhook_events_received
      ON webhook_events (received_at DESC);

    -- ── Audit Logs for Payment & Admin Operations ───────────────────────
    CREATE TABLE IF NOT EXISTS payment_audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_type TEXT NOT NULL DEFAULT 'system',
      action TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT 'payment',
      target_id TEXT NOT NULL DEFAULT '',
      transaction_id TEXT DEFAULT NULL,
      timestamp TEXT NOT NULL,
      ip_address TEXT DEFAULT NULL,
      user_agent TEXT DEFAULT NULL,
      details_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_payment_audit_ts
      ON payment_audit_logs (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_payment_audit_tx
      ON payment_audit_logs (transaction_id);

    -- ── Admin Payment Configuration Storage ──────────────────────────────
    CREATE TABLE IF NOT EXISTS admin_payment_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- ── Payment Security / Fraud Logs ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS payment_security_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event TEXT NOT NULL,
      razorpay_order_id TEXT DEFAULT NULL,
      razorpay_payment_id TEXT DEFAULT NULL,
      ip_address TEXT DEFAULT NULL,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_payment_security_ts
      ON payment_security_logs (timestamp DESC);

    -- ── Support Tickets ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user
      ON support_tickets (user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_status
      ON support_tickets (status, updated_at DESC);

    -- ── Support Replies ──────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS support_replies (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      author_name TEXT NOT NULL DEFAULT '',
      read_by_user INTEGER NOT NULL DEFAULT 0,
      read_by_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_support_replies_ticket
      ON support_replies (ticket_id, created_at ASC);

    -- ── Support Attachments ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS support_attachments (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL DEFAULT '',
      size INTEGER NOT NULL DEFAULT 0,
      mimetype TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    );
  `);

  // Migrate credit_transactions table columns
  const credCols = db.pragma("table_info(credit_transactions)");
  const addCredCol = (name, def) => {
    if (!credCols.some((c) => c.name === name)) {
      try {
        db.exec(`ALTER TABLE credit_transactions ADD COLUMN ${name} ${def}`);
        console.log(`[db] Added ${name} column to credit_transactions table`);
      } catch (err) {
        if (!err.message.includes("duplicate column")) {
          console.error(`[db] Failed to add ${name} to credit_transactions:`, err.message);
        }
      }
    }
  };
  addCredCol("reference_type", "TEXT NOT NULL DEFAULT 'PAYMENT'");
  addCredCol("reference_id", "TEXT NOT NULL DEFAULT ''");
  addCredCol("credit_type", "TEXT NOT NULL DEFAULT 'purchased'");
  addCredCol("purchased_delta", "INTEGER NOT NULL DEFAULT 0");
  addCredCol("promotional_delta", "INTEGER NOT NULL DEFAULT 0");
  addCredCol("reserved_delta", "INTEGER NOT NULL DEFAULT 0");
  addCredCol("job_id", "TEXT DEFAULT NULL");
  addCredCol("payment_id", "TEXT DEFAULT NULL");
  addCredCol("metadata_json", "TEXT NOT NULL DEFAULT '{}'");

  // ── Generation Jobs & Model Registry Tables ─────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS generation_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      idempotency_key TEXT UNIQUE,
      generation_type TEXT NOT NULL CHECK (generation_type IN ('image', 'video')),
      model_id TEXT NOT NULL,
      kie_model_id TEXT NOT NULL,
      provider_task_id TEXT,
      status TEXT NOT NULL DEFAULT 'QUEUED',
      requested_params_json TEXT NOT NULL DEFAULT '{}',
      sanitized_params_json TEXT NOT NULL DEFAULT '{}',
      credit_cost INTEGER NOT NULL DEFAULT 0,
      provider_cost_usd REAL NOT NULL DEFAULT 0.0,
      output_urls_json TEXT NOT NULL DEFAULT '[]',
      error_message TEXT,
      provider_raw_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_gen_jobs_user_status_created
      ON generation_jobs (user_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_gen_jobs_provider_task
      ON generation_jobs (provider_task_id);
    CREATE INDEX IF NOT EXISTS idx_gen_jobs_status
      ON generation_jobs (status);

    CREATE TABLE IF NOT EXISTS model_registry (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('image', 'video')),
      tier TEXT NOT NULL CHECK (tier IN ('standard', 'premium')),
      kie_model_id TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      base_provider_cost REAL NOT NULL DEFAULT 0.005,
      credit_cost_type TEXT NOT NULL DEFAULT 'fixed' CHECK (credit_cost_type IN ('fixed', 'per_second')),
      base_credit_cost INTEGER NOT NULL DEFAULT 2,
      min_margin_percent REAL NOT NULL DEFAULT 65.0,
      supported_aspect_ratios TEXT NOT NULL DEFAULT '["1:1","16:9","9:16","4:3","3:2","4:5","2:3"]',
      supported_resolutions TEXT NOT NULL DEFAULT '["1024x1024"]',
      supported_durations TEXT NOT NULL DEFAULT '[5, 10]',
      supported_controls TEXT NOT NULL DEFAULT '[]',
      max_duration INTEGER DEFAULT 10,
      max_resolution TEXT DEFAULT '1080p',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pricing_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Support tickets table migrations for priority and internal notes
  const ticketCols = db.pragma("table_info(support_tickets)");

  if (!ticketCols.some(c => c.name === "priority")) {
    db.exec("ALTER TABLE support_tickets ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'");
  }
  if (!ticketCols.some(c => c.name === "internal_notes")) {
    db.exec("ALTER TABLE support_tickets ADD COLUMN internal_notes TEXT NOT NULL DEFAULT ''");
  }

  // Support attachments migration
  const attachCols = db.pragma("table_info(support_attachments)");
  if (!attachCols.some(c => c.name === "original_name")) {
    db.exec("ALTER TABLE support_attachments ADD COLUMN original_name TEXT NOT NULL DEFAULT ''");
  }

  // Academy tutorials column migrations
  const acadCols = db.pragma("table_info(academy_tutorials)");
  const addAcadCol = (name, def) => {
    if (!acadCols.some((c) => c.name === name)) {
      try {
        db.exec(`ALTER TABLE academy_tutorials ADD COLUMN ${name} ${def}`);
        console.log(`[db] Added ${name} column to academy_tutorials table`);
      } catch (err) {
        console.error(`[db] Failed to add ${name} to academy_tutorials:`, err.message);
      }
    }
  };
  addAcadCol("course_id", "TEXT DEFAULT NULL");
  addAcadCol("video_source", "TEXT NOT NULL DEFAULT 'external'");
  addAcadCol("subcategory", "TEXT NOT NULL DEFAULT ''");
  addAcadCol("tags", "TEXT NOT NULL DEFAULT '[]'");
  addAcadCol("status", "TEXT NOT NULL DEFAULT 'published'");
  addAcadCol("display_order", "INTEGER NOT NULL DEFAULT 0");
  addAcadCol("updated_at", "TEXT DEFAULT NULL");

  // Seed default rates if not present
  const stmtSetting = db.prepare("INSERT OR IGNORE INTO credit_settings (key, value) VALUES (?, ?)");
  stmtSetting.run("credits_per_image", "2");
  stmtSetting.run("credits_per_video_second", "4");
  stmtSetting.run("cost_image_schnell", "2");
  stmtSetting.run("cost_image_dev", "4");
  stmtSetting.run("cost_video_std", "4");
  stmtSetting.run("cost_video_pro", "8");

  seedModelRegistryIfEmpty(db);
  seedPricingSettingsIfEmpty(db);
  seedSiteContentIfEmpty(db, dataDir, projectRoot);
  migrateLegacyJsonIfEmpty(db, dataDir, projectRoot);
  syncSiteContentFromSeedFile(db, dataDir, projectRoot);
  seedAcademyTutorialsIfEmpty(db);
  seedAcademyCategoriesAndCoursesIfEmpty(db);
  seedFaqsIfEmpty(db);
  ensureAdminFromEnv(db);
  return { db, dataDir };
}

/** Strip BOM/CR and optional wrapping quotes from .env values (Windows-friendly). */
function normalizeSeedName() {
  let n = String(process.env.ADMIN_SEED_NAME ?? "Site Admin")
    .replace(/^\uFEFF/, "")
    .trim();
  if ((n.startsWith('"') && n.endsWith('"')) || (n.startsWith("'") && n.endsWith("'"))) {
    n = n.slice(1, -1).trim();
  }
  return n || "Site Admin";
}

function getSeedCredentials() {
  const email = String(process.env.ADMIN_SEED_EMAIL ?? "admin@ruhgen.local")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
  const rawPw = process.env.ADMIN_SEED_PASSWORD;
  const password =
    rawPw != null && String(rawPw).replace(/^\uFEFF/, "").trim() !== ""
      ? String(rawPw).replace(/^\uFEFF/, "").trim()
      : "admin123";
  const name = normalizeSeedName();
  return { email, password, name };
}

/**
 * Keeps SQLite `admins` in sync with ADMIN_SEED_* from .env when the API starts.
 * - Empty table: insert one operator from env.
 * - Exactly one row: update email, password hash, and name from env (so changing .env fixes login).
 * - Multiple rows: update only the row whose email matches ADMIN_SEED_EMAIL.
 * Set ADMIN_SEED_DISABLE_SYNC=1 to only seed an empty DB (legacy behavior).
 */
function ensureAdminFromEnv(db) {
  const legacyOnly = ["1", "true", "yes"].includes(
    String(process.env.ADMIN_SEED_DISABLE_SYNC ?? "")
      .trim()
      .toLowerCase()
  );
  if (legacyOnly) {
    seedAdminsIfEmptyOnly(db);
    return;
  }

  const { email, password, name } = getSeedCredentials();
  const password_hash = hashPassword(password);

  const count = db.prepare("SELECT COUNT(*) AS c FROM admins").get().c;
  if (count === 0) {
    const crypto = require("node:crypto");
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    db.prepare(
      "INSERT INTO admins (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(id, email, password_hash, name, created_at);
    return;
  }

  if (count === 1) {
    const row = db.prepare("SELECT id FROM admins LIMIT 1").get();
    if (row) {
      db.prepare("UPDATE admins SET email = ?, password_hash = ?, name = ? WHERE id = ?").run(
        email,
        password_hash,
        name,
        row.id
      );
    }
    return;
  }

  const found = db.prepare("SELECT id FROM admins WHERE email = ?").get(email);
  if (found) {
    db.prepare("UPDATE admins SET password_hash = ?, name = ? WHERE id = ?").run(
      password_hash,
      name,
      found.id
    );
  }
}

function seedAdminsIfEmptyOnly(db) {
  const crypto = require("node:crypto");
  const n = db.prepare("SELECT COUNT(*) AS c FROM admins").get().c;
  if (n > 0) return;

  const { email, password, name } = getSeedCredentials();
  const id = crypto.randomUUID();
  const password_hash = hashPassword(password);
  const created_at = new Date().toISOString();

  db.prepare(
    "INSERT INTO admins (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, email, password_hash, name, created_at);
}

function seedSiteContentIfEmpty(db, dataDir, projectRoot) {
  const row = db.prepare("SELECT json FROM site_content WHERE id = 1").get();
  if (row) return;
  const seedPath = siteContentSeedPath(dataDir, projectRoot);
  if (fs.existsSync(seedPath)) {
    const json = fs.readFileSync(seedPath, "utf8");
    JSON.parse(json);
    db.prepare("INSERT INTO site_content (id, json) VALUES (1, ?)").run(json);
    return;
  }
  const fallback = JSON.stringify({
    hero: { previews: [] },
    gallery: { items: [] },
    showcase: {
      slides: [
        {
          id: "show-1",
          title: "Face swap",
          caption:
            "Identity-aware blends that respect lighting, skin tone, and camera angle—built for believable hero shots.",
          videoSrc: "",
        },
        {
          id: "show-2",
          title: "Background genius",
          caption:
            "Replace environments in one pass—studio cyclorama, matte painting, or full CG—with depth-aware separation.",
          videoSrc: "",
        },
        {
          id: "show-3",
          title: "Motion trials",
          caption:
            "Export ultra-short motion snippets for socials and client review without burning full-length credits.",
          videoSrc: "",
        },
      ],
    },
    pillars: DEFAULT_PILLARS,
    stats: DEFAULT_STATS,
    testimonials: DEFAULT_TESTIMONIALS,
  });
  db.prepare("INSERT INTO site_content (id, json) VALUES (1, ?)").run(fallback);
}

/**
 * Admin UI reads site content from SQLite. The repo's `data/site-content.json` contains
 * the user's uploaded assets, custom visualizer presets, and site configuration.
 * Sync directly from the seed file to ensure SQLite on boot always has the current content.
 */
function syncSiteContentFromSeedFile(db, dataDir, projectRoot) {
  const seedPath = siteContentSeedPath(dataDir, projectRoot);
  if (!fs.existsSync(seedPath)) return;
  let seedJson;
  try {
    seedJson = fs.readFileSync(seedPath, "utf8");
    JSON.parse(seedJson); // validate JSON
  } catch {
    return;
  }

  const row = db.prepare("SELECT json FROM site_content WHERE id = 1").get();
  if (!row) {
    db.prepare("INSERT INTO site_content (id, json) VALUES (1, ?)").run(seedJson);
  } else {
    db.prepare("UPDATE site_content SET json = ? WHERE id = 1").run(seedJson);
  }
}

function heroPreviewHasSrc(p) {
  return p && typeof p.src === "string" && p.src.trim() !== "";
}

function syncHeroPreviewsFromSeed(data, seed) {
  const seedPrev = seed?.hero?.previews;
  if (!Array.isArray(seedPrev) || seedPrev.length === 0) return false;
  if (!seedPrev.some(heroPreviewHasSrc)) return false;

  const dbPrev = data.hero?.previews;
  if (!Array.isArray(dbPrev) || dbPrev.length === 0) {
    data.hero = JSON.parse(JSON.stringify(seed.hero));
    return true;
  }
  const allMissing = dbPrev.every((p) => !heroPreviewHasSrc(p));
  if (allMissing) {
    data.hero = JSON.parse(JSON.stringify(seed.hero));
    return true;
  }

  const byId = new Map(seedPrev.filter((p) => p && p.id).map((p) => [p.id, p]));
  let changed = false;
  for (let i = 0; i < dbPrev.length; i++) {
    const p = dbPrev[i];
    if (!p || heroPreviewHasSrc(p)) continue;
    let s = byId.get(p.id);
    if (!s || !heroPreviewHasSrc(s)) s = seedPrev[i];
    if (s && heroPreviewHasSrc(s)) {
      p.src = s.src;
      if (typeof s.alt === "string" && s.alt.trim()) p.alt = s.alt;
      if (typeof s.prompt === "string") p.prompt = s.prompt;
      changed = true;
    }
  }
  return changed;
}

function galleryItemHasSrc(g) {
  return g && typeof g.src === "string" && g.src.trim() !== "";
}

function syncGalleryItemsFromSeed(data, seed) {
  const seedItems = seed?.gallery?.items;
  if (!Array.isArray(seedItems) || seedItems.length === 0) return false;
  if (!seedItems.some(galleryItemHasSrc)) return false;

  const dbItems = data.gallery?.items;
  if (!Array.isArray(dbItems) || dbItems.length === 0) {
    data.gallery = JSON.parse(JSON.stringify(seed.gallery));
    return true;
  }
  const allMissing = dbItems.every((g) => !galleryItemHasSrc(g));
  if (allMissing) {
    data.gallery = JSON.parse(JSON.stringify(seed.gallery));
    return true;
  }

  const byId = new Map(seedItems.filter((g) => g && g.id).map((g) => [g.id, g]));
  let changed = false;
  for (let i = 0; i < dbItems.length; i++) {
    const g = dbItems[i];
    if (!g || galleryItemHasSrc(g)) continue;
    let s = byId.get(g.id);
    if (!s || !galleryItemHasSrc(s)) s = seedItems[i];
    if (s && galleryItemHasSrc(s)) {
      g.src = s.src;
      if (typeof s.alt === "string" && s.alt.trim()) g.alt = s.alt;
      if (typeof s.prompt === "string") g.prompt = s.prompt;
      if (typeof s.category === "string" && s.category.trim()) g.category = s.category;
      changed = true;
    }
  }
  return changed;
}

function slideHasVideo(s) {
  return s && typeof s.videoSrc === "string" && s.videoSrc.trim() !== "";
}

function syncShowcaseSlidesFromSeed(data, seed) {
  const seedSlides = seed?.showcase?.slides;
  if (!Array.isArray(seedSlides) || seedSlides.length === 0) return false;
  if (!seedSlides.some(slideHasVideo)) return false;

  const dbSlides = data.showcase?.slides;
  if (!Array.isArray(dbSlides) || dbSlides.length === 0) {
    data.showcase = JSON.parse(JSON.stringify(seed.showcase));
    return true;
  }
  const allMissing = dbSlides.every((s) => !slideHasVideo(s));
  if (allMissing) {
    data.showcase = JSON.parse(JSON.stringify(seed.showcase));
    return true;
  }

  const byId = new Map(seedSlides.filter((s) => s && s.id).map((s) => [s.id, s]));
  let changed = false;
  for (let i = 0; i < dbSlides.length; i++) {
    const slide = dbSlides[i];
    if (!slide || slideHasVideo(slide)) continue;
    let src = byId.get(slide.id);
    if (!src || !slideHasVideo(src)) src = seedSlides[i];
    if (src && slideHasVideo(src)) {
      slide.videoSrc = src.videoSrc;
      if (typeof src.title === "string" && src.title.trim()) slide.title = src.title;
      if (typeof src.caption === "string" && src.caption.trim()) slide.caption = src.caption;
      changed = true;
    }
  }
  return changed;
}

function migrateLegacyJsonIfEmpty(db, dataDir, projectRoot) {
  const contactFile = legacyContactPath(dataDir, projectRoot);
  const n = db.prepare("SELECT COUNT(*) AS c FROM contact_messages").get().c;
  if (n === 0 && fs.existsSync(contactFile)) {
    try {
      const raw = fs.readFileSync(contactFile, "utf8");
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      const ins = db.prepare(
        "INSERT OR IGNORE INTO contact_messages (id, name, email, message, submitted_at) VALUES (?, ?, ?, ?, ?)"
      );
      for (const row of data) {
        if (
          row &&
          typeof row.id === "string" &&
          typeof row.name === "string" &&
          typeof row.email === "string" &&
          typeof row.message === "string" &&
          typeof row.submittedAt === "string"
        ) {
          ins.run(row.id, row.name, row.email, row.message, row.submittedAt);
        }
      }
    } catch {
      /* ignore corrupt legacy file */
    }
  }

  const subFile = legacySubscribersPath(dataDir, projectRoot);
  const ns = db.prepare("SELECT COUNT(*) AS c FROM newsletter_subscribers").get().c;
  if (ns === 0 && fs.existsSync(subFile)) {
    try {
      const raw = fs.readFileSync(subFile, "utf8");
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      const ins = db.prepare(
        "INSERT OR IGNORE INTO newsletter_subscribers (email, subscribed_at, source) VALUES (?, ?, ?)"
      );
      for (const row of data) {
        if (
          row &&
          typeof row.email === "string" &&
          typeof row.subscribedAt === "string"
        ) {
          const source = typeof row.source === "string" ? row.source : "footer";
          ins.run(row.email.trim().toLowerCase(), row.submittedAt, source);
        }
      }
    } catch {
      /* ignore */
    }
  }
}

const DEFAULT_PILLARS = [
  {
    id: "pil-1",
    title: "Iterate at the speed of thought",
    body: "Tight feedback loops from prompt to pixel—so you stay in flow instead of waiting on renders.",
    accent: "#00D4FF",
    glowColor: "rgba(0, 212, 255, 0.04)",
    cap1: "Core latency: 14ms",
    cap2: "Edge rendering",
  },
  {
    id: "pil-2",
    title: "Cinematic fidelity, production discipline",
    body: "HDR-aware looks, consistent aspect pipelines, and exports that slot into review and finishing.",
    accent: "#7B61FF",
    glowColor: "rgba(123, 97, 255, 0.04)",
    cap1: "10-bit HDR color",
    cap2: "DAM Export Ready",
  },
  {
    id: "pil-3",
    title: "Built for teams, not just tabs",
    body: "Policies, audit trails, and burst capacity when launch week refuses to be predictable.",
    accent: "#FF2E9A",
    glowColor: "rgba(255, 46, 154, 0.04)",
    cap1: "Concurrence: Unlimited",
    cap2: "SLA-backed",
  },
];

const DEFAULT_STATS = [
  {
    id: "stat-1",
    label: "Generations delivered",
    value: "12.4M+",
    sub: "and counting",
    glowColor: "rgba(123, 97, 255, 0.05)",
    textColor: "from-brand-purple to-white",
    accentColor: "#7B61FF",
    pct: 88,
  },
  {
    id: "stat-2",
    label: "Median time to first frame",
    value: "4.2s",
    sub: "Pro tier, global edge",
    glowColor: "rgba(0, 212, 255, 0.05)",
    textColor: "from-brand-cyan to-white",
    accentColor: "#00D4FF",
    pct: 95,
  },
  {
    id: "stat-3",
    label: "Creators & studios",
    value: "84K+",
    sub: "in 120+ countries",
    glowColor: "rgba(255, 46, 154, 0.05)",
    textColor: "from-brand-pink to-white",
    accentColor: "#FF2E9A",
    pct: 74,
  },
  {
    id: "stat-4",
    label: "Peak output resolution",
    value: "8K",
    sub: "HDR-ready exports",
    glowColor: "rgba(123, 97, 255, 0.05)",
    textColor: "from-brand-purple via-white to-brand-cyan",
    accentColor: "#7B61FF",
    pct: 99,
  },
];

const DEFAULT_TESTIMONIALS = [
  {
    id: "test-1",
    body: "We replaced a week of mood-board iteration with one RUHGEN session. The team finally stopped fighting over references and started shipping.",
    name: "Elena Voss",
    role: "Creative Director, Northwind Studio",
    avatarColor: "from-brand-purple to-indigo-950/40",
    hoverColor: "group-hover:text-brand-purple/70",
    initials: "EV",
  },
  {
    id: "test-2",
    body: "Latency is honestly wild. I can iterate on a shot while the director is still in the room—feels like a realtime renderer for ideas.",
    name: "Marcus Chen",
    role: "VFX Supervisor",
    avatarColor: "from-brand-cyan to-teal-950/40",
    hoverColor: "group-hover:text-brand-cyan/70",
    initials: "MC",
  },
  {
    id: "test-3",
    body: "The API slots straight into our asset pipeline. Webhooks fire when renders finish; our DAM ingests frames without anyone touching FTP.",
    name: "Priya Nair",
    role: "Head of Platform, Lumen Labs",
    avatarColor: "from-brand-pink to-rose-950/40",
    hoverColor: "group-hover:text-brand-pink/70",
    initials: "PN",
  },
];

function upgradeExistingSiteContent(db) {
  const row = db.prepare("SELECT json FROM site_content WHERE id = 1").get();
  if (!row) return;
  let data;
  try {
    data = JSON.parse(row.json);
  } catch (e) {
    return;
  }

  let changed = false;
  if (!data.pillars || !Array.isArray(data.pillars) || data.pillars.length === 0) {
    data.pillars = DEFAULT_PILLARS;
    changed = true;
  }
  if (!data.stats || !Array.isArray(data.stats) || data.stats.length === 0) {
    data.stats = DEFAULT_STATS;
    changed = true;
  }
  if (!data.testimonials || !Array.isArray(data.testimonials) || data.testimonials.length === 0) {
    data.testimonials = DEFAULT_TESTIMONIALS;
    changed = true;
  }
  if (!data.spotlightFeatures) {
    data.spotlightFeatures = [];
    changed = true;
  }
  if (!data.spotlightTemplates) {
    data.spotlightTemplates = [];
    changed = true;
  }
  if (!data.upcomingFeatures) {
    data.upcomingFeatures = [];
    changed = true;
  }
  if (!data.plans || !Array.isArray(data.plans) || data.plans.length === 0) {
    data.plans = [
      {
        id: "free",
        name: "Free",
        monthlyPrice: 0,
        yearlyPrice: 0,
        credits: 120,
        features: [
          "120 Credits Included",
          "Standard Image Generation Access",
          "Standard Video Generation Access",
          "Up to 2K Quality",
          "Standard Rendering Queue",
          "Community Support",
          "Core Creative Tools",
          "Basic Generation History"
        ],
        cta: "Get Started Free",
        available: true
      },
      {
        id: "pro",
        name: "Pro",
        monthlyPrice: 499,
        yearlyPrice: 4799,
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
        cta: "Upgrade to Pro",
        available: true
      },
      {
        id: "pro_plus",
        name: "Pro Plus",
        monthlyPrice: 999,
        yearlyPrice: 9599,
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
        cta: "Go Pro Plus",
        available: true
      },
      {
        id: "custom",
        name: "Custom",
        monthlyPrice: 0,
        yearlyPrice: 0,
        credits: 0,
        features: [
          "Custom Credit Allocation",
          "Dedicated Infrastructure",
          "Private Deployments",
          "Team Management",
          "Custom AI Models",
          "Custom Integrations",
          "Dedicated Account Manager",
          "Enterprise Security",
          "Priority Support",
          "Flexible Licensing",
          "API Scaling",
          "Personalized Workflows"
        ],
        description: "Tell us what you need and we will build a tailored creative environment around your workflow.",
        cta: "Contact Sales",
        available: true
      }
    ];
    changed = true;
  }

  if (changed) {
    db.prepare("UPDATE site_content SET json = ? WHERE id = 1").run(JSON.stringify(data));
    console.log("[db] upgraded site content table in SQLite database to include pillars, stats, testimonials, spotlight fields, and pricing plans.");
  }
}

function seedAcademyTutorialsIfEmpty(db) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM academy_tutorials").get().c;
  if (count > 0) {
    try {
      // Migrate existing records from 'premium' to 'workflows'
      db.prepare("UPDATE academy_tutorials SET category = 'workflows' WHERE category = 'premium'").run();
      db.prepare("UPDATE academy_tutorials SET title = 'Cinematic Film Composition & Rendering' WHERE title LIKE 'Premium Course%'").run();
    } catch (err) {
      console.error("[db] error migrating old academy categories:", err.message);
    }
    return;
  }

  const crypto = require("node:crypto");
  const baseDate = new Date();
  
  const tutorials = [
    {
      id: crypto.randomUUID(),
      title: "Understanding Spatial Rendering & Lighting",
      description: "Deep dive into the platform's spatial rendering capabilities. Learn how to map lighting vectors for cinematic realism.",
      video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
      thumbnail_url: "",
      category: "features",
      duration: "12 min",
      difficulty: "Beginner",
      views: 0,
      likes: 0,
      premium: 0,
      instructor: "Elena Voss (Creative Director)",
      created_at: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: "Mastering Character Consistency",
      description: "Learn how to maintain perfect character traits across multiple scenes using reference plates and seed locking.",
      video_url: "https://www.w3schools.com/html/movie.mp4",
      thumbnail_url: "",
      category: "courses",
      duration: "25 min",
      difficulty: "Intermediate",
      views: 0,
      likes: 0,
      premium: 0,
      instructor: "Marcus Chen (VFX Lead)",
      created_at: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: "Advanced Workflow Integration",
      description: "A complete masterclass on stringing together image generation, upscale nodes, and custom aspect ratio controls.",
      video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
      thumbnail_url: "",
      category: "masterclasses",
      duration: "42 min",
      difficulty: "Advanced",
      views: 0,
      likes: 0,
      premium: 1,
      instructor: "Priya Nair (Platform Head)",
      created_at: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: "Cinematic Film Composition & Rendering",
      description: "End-to-end blueprint for developing a fully animated, high-fidelity short film entirely within the studio suite.",
      video_url: "https://www.w3schools.com/html/movie.mp4",
      thumbnail_url: "",
      category: "workflows",
      duration: "3.5 hours",
      difficulty: "Advanced",
      views: 0,
      likes: 0,
      premium: 1,
      instructor: "RUHGEN Founders",
      created_at: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO academy_tutorials (
      id, title, description, video_url, thumbnail_url, category, duration, difficulty, views, likes, premium, instructor, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of tutorials) {
    stmt.run(
      t.id, t.title, t.description, t.video_url, t.thumbnail_url, t.category, t.duration, t.difficulty, t.views, t.likes, t.premium, t.instructor, t.created_at
    );
  }
  console.log(`[db] Seeded ${tutorials.length} default tutorials into academy_tutorials.`);
}

function seedAcademyCategoriesAndCoursesIfEmpty(db) {
  const now = new Date().toISOString();

  // 1. Seed Categories & Subcategories
  const catCount = db.prepare("SELECT COUNT(*) AS c FROM academy_categories").get().c;
  if (catCount === 0) {
    const categories = [
      { id: "cat-features", name: "Feature Understanding", slug: "features", description: "Deep dives into core platform capabilities and settings.", order: 1 },
      { id: "cat-courses", name: "Courses", slug: "courses", description: "Comprehensive, multi-lesson structured learning paths.", order: 2 },
      { id: "cat-masterclasses", name: "Masterclasses", slug: "masterclasses", description: "Advanced techniques taught by industry experts.", order: 3 },
      { id: "cat-workflows", name: "Advanced Workflows", slug: "workflows", description: "End-to-end multi-step pipelines and production blueprints.", order: 4 },
    ];

    const stmtCat = db.prepare("INSERT INTO academy_categories (id, name, slug, description, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?)");
    for (const c of categories) {
      stmtCat.run(c.id, c.name, c.slug, c.description, c.order, now);
    }

    const subcategories = [
      { id: "sub-feat-1", category_id: "cat-features", name: "Prompt Engineering", slug: "prompt-engineering", order: 1 },
      { id: "sub-feat-2", category_id: "cat-features", name: "Aspect Ratios", slug: "aspect-ratios", order: 2 },
      { id: "sub-feat-3", category_id: "cat-features", name: "Model Selection", slug: "model-selection", order: 3 },
      { id: "sub-crs-1", category_id: "cat-courses", name: "Generative Fundamentals", slug: "generative-fundamentals", order: 1 },
      { id: "sub-crs-2", category_id: "cat-courses", name: "Character Design", slug: "character-design", order: 2 },
      { id: "sub-crs-3", category_id: "cat-courses", name: "Lighting & Composition", slug: "lighting-composition", order: 3 },
      { id: "sub-mst-1", category_id: "cat-masterclasses", name: "Spatial Rendering", slug: "spatial-rendering", order: 1 },
      { id: "sub-mst-2", category_id: "cat-masterclasses", name: "Motion & Animation", slug: "motion-animation", order: 2 },
      { id: "sub-mst-3", category_id: "cat-masterclasses", name: "VFX Pipelines", slug: "vfx-pipelines", order: 3 },
      { id: "sub-wf-1", category_id: "cat-workflows", name: "Node Automation", slug: "node-automation", order: 1 },
      { id: "sub-wf-2", category_id: "cat-workflows", name: "Film Production", slug: "film-production", order: 2 },
      { id: "sub-wf-3", category_id: "cat-workflows", name: "Upscaling & Export", slug: "upscaling-export", order: 3 },
    ];

    const stmtSub = db.prepare("INSERT INTO academy_subcategories (id, category_id, name, slug, description, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const s of subcategories) {
      stmtSub.run(s.id, s.category_id, s.name, s.slug, s.description || "", s.order, now);
    }
    console.log("[db] Seeded default academy categories and subcategories.");
  }

  // 2. Seed Courses
  const courseCount = db.prepare("SELECT COUNT(*) AS c FROM academy_courses").get().c;
  if (courseCount === 0) {
    const courseId = "course-1";
    db.prepare(`
      INSERT INTO academy_courses (
        id, title, description, thumbnail_url, category, subcategory, tags, difficulty, premium, status, display_order, instructor, views, likes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      courseId,
      "Generative AI Studio Master Course",
      "A complete end-to-end structured course taking you from beginner prompt engineering to high-end cinematic production.",
      "",
      "courses",
      "generative-fundamentals",
      JSON.stringify(["Generative AI", "Production", "Masterclass"]),
      "Intermediate",
      0,
      "published",
      1,
      "RUHGEN Founders & VFX Leads",
      1200,
      340,
      now,
      now
    );
    console.log("[db] Seeded default academy course.");

    // Link existing tutorials to subcategories / tags / course if missing
    try {
      db.prepare("UPDATE academy_tutorials SET subcategory = 'spatial-rendering', tags = ? WHERE category = 'features' AND (subcategory IS NULL OR subcategory = '')").run(JSON.stringify(["Lighting", "Rendering", "Spatial"]));
      db.prepare("UPDATE academy_tutorials SET course_id = ?, subcategory = 'character-design', tags = ? WHERE category = 'courses' AND (subcategory IS NULL OR subcategory = '')").run(courseId, JSON.stringify(["Character", "Consistency", "Seed Lock"]));
      db.prepare("UPDATE academy_tutorials SET subcategory = 'vfx-pipelines', tags = ? WHERE category = 'masterclasses' AND (subcategory IS NULL OR subcategory = '')").run(JSON.stringify(["VFX", "Upscaling", "Aspect Ratio"]));
      db.prepare("UPDATE academy_tutorials SET course_id = ?, subcategory = 'film-production', tags = ? WHERE category = 'workflows' AND (subcategory IS NULL OR subcategory = '')").run(courseId, JSON.stringify(["Film", "Composition", "Short Film"]));
    } catch (e) {
      console.error("[db] Failed updating tutorial subcategories:", e.message);
    }
  }
}

function seedFaqsIfEmpty(db) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM faqs").get().c;
  if (count > 0) return;

  const crypto = require("node:crypto");
  const now = new Date().toISOString();

  const faqs = [
    {
      id: "create",
      category: "product",
      question: "What can I create with RUHGEN?",
      answer: "Still images, image sequences, and short-form cinematic clips from text—or combine reference frames and style prompts. Pro and Studio add higher resolutions, longer outputs, and batch workflows.",
    },
    {
      id: "pricing-teams",
      category: "billing",
      question: "How does pricing scale for teams?",
      answer: "Free is for experimentation. Pro fits solo creators and small squads with pooled monthly generations. Studio adds seats, shared prompt libraries, audit logs, and priority infrastructure.",
    },
    {
      id: "commercial",
      category: "billing",
      question: "Can I use outputs commercially?",
      answer: "Yes on Pro and Studio within the license terms in your agreement. Free tier is for personal exploration—upgrade before client or broadcast work.",
    },
    {
      id: "api",
      category: "teams",
      question: "Do you offer an API?",
      answer: "Studio includes REST hooks, webhooks on job completion, and signed URLs for assets so you can automate ingest into DAMs, MAMs, or custom render farms.",
    },
    {
      id: "privacy",
      category: "security",
      question: "How do you handle data privacy?",
      answer: "Prompts and uploads are encrypted in transit. Retention defaults are configurable on Studio; we never sell your data or train on private Studio content without a contract addendum.",
    },
    {
      id: "seats",
      category: "teams",
      question: "How do seats and shared libraries work?",
      answer: "Studio workspaces can add seats with role-based access. Shared prompt libraries and brand-safe style presets stay in sync so art direction doesn’t drift between contributors.",
    },
    {
      id: "credits",
      category: "billing",
      question: "What happens when I run out of credits?",
      answer: "You’ll see a clear notice before jobs start. Upgrade your plan, purchase a top-up where available, or wait for your monthly reset—your drafts and prompts are never deleted.",
    },
    {
      id: "exports",
      category: "product",
      question: "Which export formats are supported?",
      answer: "Common image formats plus sequence-friendly options for pipelines. Video exports target review-friendly codecs; Studio can expose additional formats and passes depending on your plan.",
    }
  ];

  const stmt = db.prepare(
    "INSERT INTO faqs (id, category, question, answer, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  );

  for (const faq of faqs) {
    stmt.run(faq.id, faq.category, faq.question, faq.answer, now, now);
  }
  console.log(`[db] Seeded ${faqs.length} default FAQs.`);
}

function seedModelRegistryIfEmpty(db) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM model_registry").get().c;
  if (count > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO model_registry (
      id, name, type, tier, kie_model_id, enabled, base_provider_cost,
      credit_cost_type, base_credit_cost, min_margin_percent,
      supported_aspect_ratios, supported_resolutions, supported_durations,
      supported_controls, max_duration, max_resolution, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Standard Image (KIE.ai Flux Flex text-to-image)
  insert.run(
    "image-flux-standard",
    "RUHGEN Standard Image",
    "image",
    "standard",
    "flux-2/flex-text-to-image",
    1,
    0.004,
    "fixed",
    2,
    70.0,
    JSON.stringify(["1:1", "16:9", "9:16", "4:3", "3:2", "4:5", "2:3"]),
    JSON.stringify(["1024x1024", "1280x720", "720x1280"]),
    JSON.stringify([]),
    JSON.stringify(["prompt", "negative_prompt", "aspect_ratio", "style", "image_reference", "denoise", "guidance_scale"]),
    null,
    "1024x1024",
    now,
    now
  );

  // 2. Premium Image (KIE.ai Flux Pro text-to-image)
  insert.run(
    "image-flux-premium",
    "RUHGEN Premium Image",
    "image",
    "premium",
    "flux-2/pro-text-to-image",
    1,
    0.010,
    "fixed",
    4,
    70.0,
    JSON.stringify(["1:1", "16:9", "9:16", "4:3", "3:2", "4:5", "2:3"]),
    JSON.stringify(["1024x1024", "1280x720", "720x1280"]),
    JSON.stringify([]),
    JSON.stringify(["prompt", "negative_prompt", "aspect_ratio", "style", "image_reference", "denoise", "guidance_scale"]),
    null,
    "1024x1024",
    now,
    now
  );

  // 3. Standard Video (KIE.ai Kling 2.6 - Cheapest Suitable Video Model)
  insert.run(
    "video-kling-standard",
    "RUHGEN Standard Video",
    "video",
    "standard",
    "kling-2.6/text-to-video",
    1,
    0.055,
    "per_second",
    3,
    70.0,
    JSON.stringify(["16:9", "9:16", "1:1"]),
    JSON.stringify(["720p"]),
    JSON.stringify([5]),
    JSON.stringify(["prompt", "negative_prompt", "aspect_ratio", "duration", "sound"]),
    5,
    "720p",
    now,
    now
  );

  // 4. Premium Omni Video (KIE.ai Kling 3.0 Omni - Mid-Tier Omni Model)
  insert.run(
    "video-kling-premium",
    "RUHGEN Premium Omni Video",
    "video",
    "premium",
    "kling-3.0-omni/text-to-video",
    1,
    0.110,
    "per_second",
    6,
    65.0,
    JSON.stringify(["16:9", "9:16", "1:1"]),
    JSON.stringify(["720p", "1080p"]),
    JSON.stringify([5, 10]),
    JSON.stringify(["prompt", "negative_prompt", "aspect_ratio", "duration", "resolution", "sound", "camera_control", "image_urls"]),
    10,
    "1080p",
    now,
    now
  );

  console.log("[db] Initialized Model Registry with production KIE.ai video models.");
}

function seedPricingSettingsIfEmpty(db) {
  const now = new Date().toISOString();
  const stmt = db.prepare("INSERT OR IGNORE INTO pricing_settings (key, value, updated_at) VALUES (?, ?, ?)");
  stmt.run("credit_inr_rate", "1.0", now);
  stmt.run("inr_usd_rate", "87.0", now);
  stmt.run("pg_fee_percent", "2.36", now);
  stmt.run("infra_allowance_percent", "10.0", now);
  stmt.run("min_platform_margin_percent", "60.0", now);
  stmt.run("default_new_user_promo_credits", "0", now);
}

module.exports = { openDb };
