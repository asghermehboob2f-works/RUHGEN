#!/usr/bin/env node
/**
 * RUHGEN Production SMTP Diagnostic & Verification CLI Tool
 * Safely tests DNS, TCP port 465/587, TLS certificate, and SMTP authentication.
 * 
 * Usage:
 *   node scripts/test-smtp.cjs
 *   node scripts/test-smtp.cjs --send=your-email@domain.com
 *   npm run test:email
 *
 * Security:
 *   NEVER logs, prints, or exposes the SMTP password or secrets.
 */

const path = require("node:path");
const dns = require("node:dns");
const net = require("node:net");
const tls = require("node:tls");

// Load environment from project root
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") });

const { getSmtpConfig } = require("../backend/src/config");
const { sendMail, verifyConnection } = require("../backend/src/email-service");

const config = getSmtpConfig();

console.log("\n============================================================");
console.log("  RUHGEN SMTP INFRASTRUCTURE & CONNECTIVITY DIAGNOSTICS");
console.log("============================================================\n");

console.log(`[Config] SMTP Host       : ${config.host}`);
console.log(`[Config] SMTP Port       : ${config.port}`);
console.log(`[Config] SMTP Protocol   : ${config.port === 465 ? "SSL (Implicit TLS)" : "STARTTLS"}`);
console.log(`[Config] SMTP Username   : ${config.username || "(not set)"}`);
console.log(`[Config] SMTP Password   : ${config.password ? `[CONFIGURED, length ${config.password.length}]` : "[MISSING]"}`);
console.log(`[Config] From Address    : ${config.fromAddress}`);
console.log(`[Config] From Name       : ${config.fromName}`);
console.log("------------------------------------------------------------\n");

function testDns(host) {
  return new Promise((resolve) => {
    process.stdout.write(`[1/4] DNS Resolution (${host}) ... `);
    dns.lookup(host, (err, address, family) => {
      if (err) {
        console.log(`❌ FAILED (${err.message})`);
        resolve({ ok: false, error: err.message });
      } else {
        console.log(`✅ OK -> ${address} (IPv${family})`);
        resolve({ ok: true, address });
      }
    });
  });
}

function testTcp(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    process.stdout.write(`[2/4] TCP Connectivity (${host}:${port}) ... `);
    const start = Date.now();
    const sock = net.createConnection({ host, port, timeout: timeoutMs }, () => {
      const ms = Date.now() - start;
      console.log(`✅ OK (${ms}ms)`);
      sock.end();
      resolve({ ok: true, latencyMs: ms });
    });

    sock.on("timeout", () => {
      console.log(`❌ TIMEOUT (> ${timeoutMs}ms)`);
      sock.destroy();
      resolve({ ok: false, error: "Connection timed out" });
    });

    sock.on("error", (err) => {
      console.log(`❌ FAILED (${err.message})`);
      resolve({ ok: false, error: err.message });
    });
  });
}

function testTls(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    process.stdout.write(`[3/4] TLS Certificate & Handshake (${host}:${port}) ... `);
    const sock = tls.connect({
      host,
      port,
      servername: host,
      timeout: timeoutMs,
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
    }, () => {
      const cert = sock.getPeerCertificate();
      const auth = sock.authorized;
      if (auth) {
        console.log(`✅ OK (Issuer: ${cert.issuer?.CN || cert.issuer?.O || "Valid"}, Expires: ${cert.valid_to || "N/A"})`);
        sock.end();
        resolve({ ok: true, cert });
      } else {
        console.log(`❌ CERT UNAUTHORIZED (${sock.authorizationError})`);
        sock.end();
        resolve({ ok: false, error: sock.authorizationError });
      }
    });

    sock.on("timeout", () => {
      console.log(`❌ TLS TIMEOUT (> ${timeoutMs}ms)`);
      sock.destroy();
      resolve({ ok: false, error: "TLS handshake timed out" });
    });

    sock.on("error", (err) => {
      console.log(`❌ TLS ERROR (${err.message})`);
      resolve({ ok: false, error: err.message });
    });
  });
}

async function run() {
  const dnsRes = await testDns(config.host);
  if (!dnsRes.ok) {
    console.log("\n❌ Halting diagnostics: Hostname cannot be resolved.\n");
    process.exit(1);
  }

  const tcpRes = await testTcp(config.host, config.port);
  if (!tcpRes.ok) {
    console.log("\n❌ Halting diagnostics: Cannot connect to SMTP port. Check outbound firewall/hosting network rules.\n");
    process.exit(1);
  }

  if (config.port === 465) {
    await testTls(config.host, 465);
  }

  process.stdout.write(`[4/4] SMTP Authentication (user: ${config.username}) ... `);
  const verifyRes = await verifyConnection();

  if (verifyRes.ok) {
    console.log(`✅ OK — Server accepted credentials!`);
    console.log("\n🎉 SMTP INFRASTRUCTURE IS OPERATIONAL AND READY TO SEND!");

    // Check if user requested a test email
    const sendArg = process.argv.find((a) => a.startsWith("--send="));
    if (sendArg) {
      const recipient = sendArg.split("=")[1]?.trim();
      if (recipient) {
        console.log(`\n[Dispatch] Sending test email to: ${recipient} ...`);
        const result = await sendMail({
          to: recipient,
          subject: "RUHGEN SMTP Verification Test",
          html: "<p>This is a successful transactional test email from <strong>RUHGEN</strong>.</p>",
          text: "This is a successful transactional test email from RUHGEN.",
        });
        if (result.ok) {
          console.log(`✅ Test email delivered successfully! Message ID: ${result.messageId}`);
        } else {
          console.log(`❌ Test email delivery failed: ${result.error}`);
        }
      }
    } else {
      console.log(`\nTip: To send a real test email, run:`);
      console.log(`     node scripts/test-smtp.cjs --send=your-email@domain.com\n`);
    }
  } else {
    console.log(`❌ FAILED`);
    console.log(`\n  Reason: ${verifyRes.message}`);
    if (verifyRes.message && verifyRes.message.includes("535")) {
      console.log("\n  ⚠️  EXACT ROOT CAUSE (535 Authentication Failed):");
      console.log("  The mail server at " + config.host + " is online, reachable, and active,");
      console.log("  but the password in .env does NOT match the password set in Hostinger/mail panel for " + config.username + ".");
      console.log("  Please set the mailbox password in Hostinger Email Management to match your .env,");
      console.log("  or update MAIL_PASSWORD in .env with the exact password created in Hostinger.");
    }
  }

  console.log("============================================================\n");
}

run().catch((e) => {
  console.error("Diagnostic error:", e.message);
  process.exit(1);
});
