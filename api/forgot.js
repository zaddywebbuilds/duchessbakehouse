/* POST /api/forgot — send a one-hour magic-link login email.
   Body: { email: "..." }
   The email must match the ADMIN_EMAIL env var exactly (case-insensitive).
   The magic link token is a stateless HMAC — no database needed.

   Required env vars:
     ADMIN_EMAIL     — the baker's email address
     COOKIE_SECRET   — same signing secret used by api/login.js
     RESEND_API_KEY  — from resend.com (free tier works fine)
*/
import { createHmac } from "crypto";
import { request } from "https";

const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function makeToken(email, secret) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + EXPIRY_MS })).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return payload + "." + sig;
}

function sendEmail(apiKey, to, link) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: "Duchess Bakehouse Admin <onboarding@resend.dev>",
      to: [to],
      subject: "Your Duchess Bakehouse admin login link",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem">
          <p style="font-size:1.1rem;font-weight:700;color:#7b1a30">Duchess Bakehouse</p>
          <p>Here is your one-time login link. It expires in <strong>1 hour</strong>.</p>
          <p style="margin:1.5rem 0">
            <a href="${link}"
               style="background:#7b1a30;color:#fff;padding:.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:700">
              Sign in to admin panel
            </a>
          </p>
          <p style="font-size:.85rem;color:#666">
            If you did not request this, ignore this email — your account remains secure.
            <br>Link: <a href="${link}">${link}</a>
          </p>
        </div>`,
    });
    const opts = {
      hostname: "api.resend.com",
      path: "/emails",
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    const req = request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).end("Method Not Allowed"); return; }

  const adminEmail = process.env.ADMIN_EMAIL;
  const secret = process.env.COOKIE_SECRET;
  const resendKey = process.env.RESEND_API_KEY;

  if (!adminEmail || !secret || !resendKey) {
    res.status(500).json({ error: "Server not fully configured (ADMIN_EMAIL / RESEND_API_KEY missing)" });
    return;
  }

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    let given;
    try { given = (JSON.parse(body).email || "").trim().toLowerCase(); }
    catch (_) { res.status(400).json({ error: "Bad request" }); return; }

    /* Always return 200 — never confirm whether the email exists. */
    if (given !== adminEmail.toLowerCase()) {
      res.status(200).json({ ok: true });
      return;
    }

    const host = req.headers["x-forwarded-host"] || req.headers.host || "duchessbakehouse.vercel.app";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const token = makeToken(adminEmail, secret);
    const link = `${proto}://${host}/api/magic?token=${encodeURIComponent(token)}`;

    try {
      const { status } = await sendEmail(resendKey, adminEmail, link);
      if (status >= 400) {
        res.status(502).json({ error: "Email could not be sent. Check RESEND_API_KEY." });
        return;
      }
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });
}
