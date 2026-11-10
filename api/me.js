/* GET /api/me — returns 200 {ok:true} when the session cookie is valid,
   401 otherwise. The admin dashboard calls this on boot to decide whether
   to show the login form or the dashboard. */
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "duchess_admin";

function parseCookie(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((p) => p.trim().split("=").map(decodeURIComponent))
  );
}

function verifyToken(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const expected = createHmac("sha256", secret).update(parts[0]).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[1]);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default function handler(req, res) {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) { res.status(500).end("Server not configured"); return; }

  const cookies = parseCookie(req.headers.cookie);
  const token = cookies[COOKIE_NAME];

  if (token && verifyToken(token, secret)) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
}
