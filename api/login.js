/* POST /api/login — verify admin password, issue a signed session cookie.
   Required env vars:
     ADMIN_PASSWORD  — the plaintext password the baker will use
     COOKIE_SECRET   — a random string (32+ chars) used to sign the cookie
*/
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "duchess_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function sign(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return data + "." + sig;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.COOKIE_SECRET;

  if (!password || !secret) {
    console.error("ADMIN_PASSWORD or COOKIE_SECRET not set");
    res.status(500).end("Server not configured");
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    let given;
    try {
      given = JSON.parse(body).password || "";
    } catch (_) {
      res.status(400).end("Bad request");
      return;
    }

    /* Constant-time comparison to prevent timing attacks. */
    const a = Buffer.from(given.padEnd(64));
    const b = Buffer.from(password.padEnd(64));
    const match = a.length === b.length && timingSafeEqual(a, b);

    if (!match) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    const token = sign({ iat: Date.now(), role: "admin" }, secret);
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}; Path=/`
    );
    res.status(200).json({ ok: true });
  });
}
