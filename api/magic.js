/* GET /api/magic?token=... — validate a magic-link token and issue a session.
   On success: sets the session cookie and redirects to /admin.
   On failure: redirects to /admin?error=link_expired.
*/
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "duchess_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours session after clicking the link

function verifyMagicToken(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const expected = createHmac("sha256", secret).update(parts[0]).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[1]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    if (!payload.exp || Date.now() > payload.exp) return null; // expired
    return payload;
  } catch (_) { return null; }
}

function signSession(secret) {
  const data = Buffer.from(JSON.stringify({ iat: Date.now(), role: "admin" })).toString("base64url");
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return data + "." + sig;
}

export default function handler(req, res) {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) { res.status(500).end("Server not configured"); return; }

  const token = new URL(req.url, "https://dummy").searchParams.get("token") || "";
  const payload = verifyMagicToken(token, secret);

  if (!payload) {
    res.setHeader("Location", "/admin?error=link_expired");
    res.status(302).end();
    return;
  }

  const session = signSession(secret);
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${session}; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}; Path=/`
  );
  res.setHeader("Location", "/admin");
  res.status(302).end();
}
