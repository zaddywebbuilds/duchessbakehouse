/* /api/catalogue — read and write assets/data/catalogue.json via GitHub API.
   GET  — returns the current catalogue (no auth required; it's already public).
   PUT  — replaces catalogue.json; requires admin session cookie.

   Required env vars (all present if Vercel is linked to the GitHub repo):
     GITHUB_TOKEN  — fine-grained PAT with Contents: read & write on this repo
     GITHUB_OWNER  — e.g. zaddywebbuilds
     GITHUB_REPO   — e.g. duchessbakehouse
     COOKIE_SECRET — same value used by api/login.js
*/
import { createHmac, timingSafeEqual } from "crypto";
import { request } from "https";

const COOKIE_NAME = "duchess_admin";
const FILE_PATH = "assets/data/catalogue.json";
const GITHUB_API = "api.github.com";

/* ── auth ─────────────────────────────────────────────────────────────── */
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

/* ── GitHub helpers ───────────────────────────────────────────────────── */
function ghRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: GITHUB_API,
      path,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "duchess-bakehouse-admin",
        ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
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
    if (payload) req.write(payload);
    req.end();
  });
}

async function getFile(owner, repo, token) {
  const { status, body } = await ghRequest(
    "GET",
    `/repos/${owner}/${repo}/contents/${FILE_PATH}`,
    null,
    token
  );
  if (status === 200) return body; // { sha, content, ... }
  if (status === 404) return null;
  throw new Error(`GitHub GET ${status}: ${JSON.stringify(body)}`);
}

async function putFile(owner, repo, token, content, sha, message) {
  const encoded = Buffer.from(content).toString("base64");
  const body = { message, content: encoded, ...(sha ? { sha } : {}) };
  const { status, body: resp } = await ghRequest(
    "PUT",
    `/repos/${owner}/${repo}/contents/${FILE_PATH}`,
    body,
    token
  );
  if (status === 200 || status === 201) return resp;
  throw new Error(`GitHub PUT ${status}: ${JSON.stringify(resp)}`);
}

/* ── handler ──────────────────────────────────────────────────────────── */
export default async function handler(req, res) {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!owner || !repo || !token) {
    res.status(500).end("GitHub env vars not configured");
    return;
  }

  /* GET — public read */
  if (req.method === "GET") {
    try {
      const file = await getFile(owner, repo, token);
      if (!file) { res.status(404).json({ error: "Not found" }); return; }
      const json = Buffer.from(file.content, "base64").toString("utf-8");
      res.setHeader("Content-Type", "application/json");
      res.status(200).end(json);
    } catch (e) {
      res.status(502).json({ error: e.message });
    }
    return;
  }

  /* PUT — admin write */
  if (req.method === "PUT") {
    if (!isAdmin(req)) { res.status(401).json({ error: "Not authenticated" }); return; }

    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      let parsed;
      try { parsed = JSON.parse(body); }
      catch (_) { res.status(400).json({ error: "Invalid JSON" }); return; }

      /* Basic schema check — must have a cakes array. */
      if (!parsed || !Array.isArray(parsed.cakes)) {
        res.status(400).json({ error: "Body must be {cakes: [...]}" });
        return;
      }

      /* Sanitise — only keep known fields. */
      parsed.cakes = parsed.cakes.map((c) => ({
        slug: String(c.slug || "").replace(/[^a-z0-9-]/g, "").slice(0, 80),
        name: String(c.name || "").slice(0, 120),
        category: String(c.category || "").slice(0, 40),
        sub: String(c.sub || "").slice(0, 160),
        alt: String(c.alt || "").slice(0, 300),
        img: String(c.img || "").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 80),
        imgFallback: String(c.imgFallback || "").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 80),
        featured: Boolean(c.featured),
        tall: Boolean(c.tall),
        price: String(c.price || "").slice(0, 80),
        description: String(c.description || "").slice(0, 500),
      }));

      try {
        const existing = await getFile(owner, repo, token);
        const sha = existing ? existing.sha : undefined;
        const content = JSON.stringify(parsed, null, 2) + "\n";
        await putFile(owner, repo, token, content, sha, "admin: update catalogue.json");
        res.status(200).json({ ok: true, cakes: parsed.cakes.length });
      } catch (e) {
        res.status(502).json({ error: e.message });
      }
    });
    return;
  }

  res.status(405).end("Method Not Allowed");
}
