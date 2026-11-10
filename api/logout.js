/* POST /api/logout — clear the session cookie. */
const COOKIE_NAME = "duchess_admin";

export default function handler(req, res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/`
  );
  res.status(200).json({ ok: true });
}
