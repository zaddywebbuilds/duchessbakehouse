/* POST /api/upload — upload a cake image or video to GitHub.
   Body (JSON):
     { filename: "cake-41.webp", dataUrl: "data:image/webp;base64,..." }
   Returns for images:
     { ok: true, img: "cake-41.webp", imgFallback: "cake-41.jpg" }
   Returns for videos:
     { ok: true, video: "cake-vid-123.mp4" }

   Images: .webp .jpg/.jpeg — stored in assets/img/
   Videos: .mp4 .mov .webm  — stored in assets/video/ — max 3 MB
   Requires admin session.
*/
import { createHmac, timingSafeEqual } from "crypto";
import { request } from "https";

const COOKIE_NAME = "duchess_admin";
const GITHUB_API = "api.github.com";
const MAX_BYTES = 3 * 1024 * 1024;
const IMG_EXT   = /\.(webp|jpg|jpeg)$/i;
const VID_EXT   = /\.(mp4|mov|webm)$/i;

/* ── auth (same as catalogue.js) ─────────────────────────────────────── */
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
function isAdmin(req) {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) return false;
  const cookies = parseCookie(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  return verifyToken(token, secret);
}

/* ── GitHub helper ────────────────────────────────────────────────────── */
function ghPut(owner, repo, token, filePath, base64Content, message) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ message, content: base64Content });
    const opts = {
      hostname: GITHUB_API,
      path: `/repos/${owner}/${repo}/contents/${filePath}`,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "duchess-bakehouse-admin",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    const req = request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (_) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/* ── handler ──────────────────────────────────────────────────────────── */
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).end("Method Not Allowed"); return; }
  if (!isAdmin(req)) { res.status(401).json({ error: "Not authenticated" }); return; }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) { res.status(500).end("GitHub env vars not configured"); return; }

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    let parsed;
    try { parsed = JSON.parse(body); } catch (_) { res.status(400).json({ error: "Invalid JSON" }); return; }

    const { filename, dataUrl } = parsed;

    /* Validate filename */
    const isImg = IMG_EXT.test(filename || "");
    const isVid = VID_EXT.test(filename || "");
    if (!filename || (!isImg && !isVid) || /[/\\]/.test(filename)) {
      res.status(400).json({ error: "filename must be .webp/.jpg (image) or .mp4/.mov/.webm (video)" });
      return;
    }

    /* Extract base64 from data URL */
    const mimeRe = isImg
      ? /^data:image\/(webp|jpeg|jpg);base64,(.+)$/
      : /^data:video\/(mp4|quicktime|webm);base64,(.+)$/;
    const match = mimeRe.exec(dataUrl || "");
    if (!match) {
      res.status(400).json({ error: "dataUrl MIME type does not match filename extension" });
      return;
    }

    const base64 = match[2];
    if (Buffer.byteLength(base64, "base64") > MAX_BYTES) {
      res.status(413).json({ error: (isVid ? "Video" : "Image") + " too large (max 3 MB)" });
      return;
    }

    const filePath = isImg ? `assets/img/${filename}` : `assets/video/${filename}`;

    try {
      const { status, body: resp } = await ghPut(owner, repo, token, filePath, base64, `admin: upload ${filename}`);
      if (status !== 200 && status !== 201) {
        res.status(502).json({ error: `GitHub ${status}: ${JSON.stringify(resp)}` });
        return;
      }
      if (isImg) {
        res.status(200).json({ ok: true, img: filename, imgFallback: filename.replace(/\.webp$/i, ".jpg") });
      } else {
        res.status(200).json({ ok: true, video: filename });
      }
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
  });
}
