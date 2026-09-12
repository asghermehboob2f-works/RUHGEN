/**
 * End-to-End Automated Test Script for Password Reset & OTP Flow
 */
const path = require("node:path");
const projectRoot = path.resolve(__dirname, "..");
const { openDb } = require(path.join(projectRoot, "backend", "src", "db.js"));
const { hashPassword } = require(path.join(projectRoot, "backend", "src", "auth"));
const crypto = require("node:crypto");
const http = require("node:http");
const express = require("express");
const { mountUserAuthRoutes } = require(path.join(projectRoot, "backend", "src", "user-auth-routes.js"));

function hashToken(t) {
  return crypto.createHash("sha256").update(t).digest("hex");
}

async function runTests() {
  console.log("=================================================");
  console.log("RUHGEN Password Reset & OTP Flow Audit Test Suite");
  console.log("=================================================");

  const { db } = openDb(projectRoot);

  // Setup express test server on ephemeral port
  const app = express();
  app.use(express.json());
  mountUserAuthRoutes(app, { db });

  const server = await new Promise((resolve) => {
    const srv = app.listen(0, "127.0.0.1", () => resolve(srv));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`[test] Test server listening on ${baseUrl}`);

  const postJson = (urlPath, body) => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const req = http.request(
        `${baseUrl}${urlPath}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
          },
        },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => (raw += chunk));
          res.on("end", () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(raw) });
            } catch {
              resolve({ status: res.statusCode, raw });
            }
          });
        }
      );
      req.on("error", reject);
      req.write(data);
      req.end();
    });
  };

  let testPassed = 0;
  let testFailed = 0;

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      testPassed++;
    } else {
      console.error(`  ✕ FAIL: ${msg}`);
      testFailed++;
    }
  };

  try {
    // Clean up any old test account
    const testEmail = "test_pwd_reset_user@ruhgen.local";
    db.prepare("DELETE FROM users WHERE email = ?").run(testEmail);

    console.log("\n[Test 1] Non-Existent Email Request");
    const res1 = await postJson("/api/auth/forgot-password", { email: "nonexistent_email_9999@domain.com" });
    assert(res1.status === 404, `Status should be 404 Not Found (got ${res1.status})`);
    assert(res1.data.ok === false, `ok should be false`);
    assert(
      res1.data.error && res1.data.error.includes("No account exists"),
      `Error should clearly state account non-existence: "${res1.data.error}"`
    );

    console.log("\n[Test 2] Valid Existing User Request");
    // Create test user
    const initialPass = "OriginalPass123!";
    const initialHash = hashPassword(initialPass);
    const userId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, created_at, email_verified, verification_status)
       VALUES (?, ?, ?, ?, ?, 1, 'verified')`
    ).run(userId, testEmail, "Test Reset User", initialHash, nowIso);

    const res2 = await postJson("/api/auth/forgot-password", { email: testEmail });
    assert(res2.status === 200, `Status should be 200 OK (got ${res2.status})`);
    assert(res2.data.ok === true, `ok should be true`);

    const userRow1 = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    assert(userRow1.reset_token_hash !== null, "reset_token_hash should be populated");
    assert(userRow1.reset_otp_hash !== null, "reset_otp_hash should be populated");
    assert(userRow1.reset_otp_attempts === 0, "reset_otp_attempts should be initialized to 0");

    console.log("\n[Test 3] 60-Second Resend Cooldown");
    const res3 = await postJson("/api/auth/forgot-password", { email: testEmail });
    assert(res3.status === 429, `Status should be 429 Too Many Requests (got ${res3.status})`);
    assert(res3.data.error && res3.data.error.includes("Please wait"), `Error message should mention cooldown: "${res3.data.error}"`);

    console.log("\n[Test 4] Verify Invalid OTP Code");
    const res4 = await postJson("/api/auth/verify-reset", { email: testEmail, otp: "000000" });
    assert(res4.status === 400, `Status should be 400 Bad Request (got ${res4.status})`);
    assert(res4.data.ok === false, `ok should be false`);

    const userRow2 = db.prepare("SELECT reset_otp_attempts FROM users WHERE id = ?").get(userId);
    assert(userRow2.reset_otp_attempts === 1, `reset_otp_attempts should be 1 (got ${userRow2.reset_otp_attempts})`);

    console.log("\n[Test 5] Max Failed Attempts Lockout (5 attempts)");
    for (let i = 0; i < 4; i++) {
      await postJson("/api/auth/verify-reset", { email: testEmail, otp: "000000" });
    }
    const res5 = await postJson("/api/auth/verify-reset", { email: testEmail, otp: "000000" });
    assert(res5.status === 429, `Status should be 429 Too Many Requests (got ${res5.status})`);
    assert(res5.data.error && res5.data.error.includes("Too many failed attempts"), `Error: "${res5.data.error}"`);

    console.log("\n[Test 6] Generate Fresh Code & Validate Valid OTP");
    // Clear cooldown in DB for re-requesting
    db.prepare("UPDATE users SET last_resend_at = NULL WHERE id = ?").run(userId);
    
    const res6 = await postJson("/api/auth/forgot-password", { email: testEmail });
    assert(res6.status === 200, `Status should be 200 OK`);

    const freshUser = db.prepare("SELECT reset_otp_hash, reset_token_hash FROM users WHERE id = ?").get(userId);
    assert(freshUser.reset_otp_hash !== null, "New OTP hash stored");

    // Find the 6-digit OTP that matches freshUser.reset_otp_hash
    let activeOtp = null;
    for (let code = 100000; code <= 999999; code++) {
      const codeStr = String(code);
      if (hashToken(codeStr) === freshUser.reset_otp_hash) {
        activeOtp = codeStr;
        break;
      }
    }
    assert(activeOtp !== null, `Found matching 6-digit OTP code in database: ${activeOtp}`);

    console.log("\n[Test 7] Reset Password with Same Password");
    const res7 = await postJson("/api/auth/reset-password", {
      email: testEmail,
      otp: activeOtp,
      newPassword: initialPass,
    });
    assert(res7.status === 400, `Status should be 400 Bad Request`);
    assert(res7.data.error && res7.data.error.includes("must be different"), `Error message: "${res7.data.error}"`);

    console.log("\n[Test 8] Reset Password with Successful New Password");
    const newPass = "BrandNewPass999#";
    const res8 = await postJson("/api/auth/reset-password", {
      email: testEmail,
      otp: activeOtp,
      newPassword: newPass,
    });
    assert(res8.status === 200, `Status should be 200 OK (got ${res8.status})`);
    assert(res8.data.ok === true, `ok should be true`);

    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    assert(updatedUser.reset_token_hash === null, "reset_token_hash should be cleared to NULL");
    assert(updatedUser.reset_otp_hash === null, "reset_otp_hash should be cleared to NULL");
    assert(updatedUser.reset_token_expiry === null, "reset_token_expiry should be cleared to NULL");
    assert(updatedUser.reset_otp_expiry === null, "reset_otp_expiry should be cleared to NULL");
    assert(updatedUser.reset_otp_attempts === 0, "reset_otp_attempts reset to 0");

    console.log("\n[Test 9] Prevent Re-use of Used OTP Code");
    const res9 = await postJson("/api/auth/reset-password", {
      email: testEmail,
      otp: activeOtp,
      newPassword: "AnotherPassword123!",
    });
    assert(res9.status === 400, `Status should be 400 Bad Request (got ${res9.status})`);

    console.log("\n[Test 10] Login Verification");
    const loginOld = await postJson("/api/auth/login", { email: testEmail, password: initialPass });
    assert(loginOld.status === 401, `Old password login should be rejected with 401`);

    const loginNew = await postJson("/api/auth/login", { email: testEmail, password: newPass });
    assert(loginNew.status === 200, `New password login should succeed with 200 OK`);
    assert(loginNew.data.ok === true, `Login returned user session token`);

    // Clean up test account
    db.prepare("DELETE FROM users WHERE email = ?").run(testEmail);

  } catch (err) {
    console.error("\n[test] Unexpected test runner exception:", err);
    testFailed++;
  } finally {
    server.close();
  }

  console.log("\n=================================================");
  console.log(`Test Results: ${testPassed} Passed, ${testFailed} Failed`);
  console.log("=================================================");

  if (testFailed > 0) {
    process.exit(1);
  }
}

runTests();
