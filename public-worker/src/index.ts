const ALLOWED_ORIGINS = new Set([
  "https://furbolog-hub.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);
const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;
const encoder = new TextEncoder();

type Game = "dropfish" | "agroclick";
type ClientPayload = {
  game?: unknown;
  installId?: unknown;
  telegramInitData?: unknown;
  result?: unknown;
};

function corsHeaders(request: Request): Headers {
  const origin = request.headers.get("Origin") ?? "";
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  });
  if (ALLOWED_ORIGINS.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

function moscowClock(now = Date.now()) {
  const shifted = new Date(now + MOSCOW_OFFSET_MS);
  const day = shifted.toISOString().slice(0, 10);
  const nextMidnightShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + 1,
  );
  return { day, serverNow: now, resetAt: nextMidnightShifted - MOSCOW_OFFSET_MS };
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function hmac(key: ArrayBuffer | Uint8Array, value: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
}

function timingSafeHexEqual(left: string, right: string): boolean {
  if (left.length !== right.length || left.length % 2 !== 0) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 2) {
    difference |= Number.parseInt(left.slice(index, index + 2), 16)
      ^ Number.parseInt(right.slice(index, index + 2), 16);
  }
  return difference === 0;
}

async function telegramUserId(initData: string, botToken: string): Promise<string | null> {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  if (!receivedHash || !Number.isFinite(authDate)) return null;
  if (Math.abs(Date.now() / 1000 - authDate) > 24 * 60 * 60) return null;

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = await hmac(encoder.encode("WebAppData"), botToken);
  const expectedHash = toHex(await hmac(secretKey, dataCheckString));
  if (!timingSafeHexEqual(receivedHash.toLowerCase(), expectedHash)) return null;

  try {
    const user = JSON.parse(params.get("user") ?? "{}") as { id?: unknown };
    return typeof user.id === "number" || typeof user.id === "string" ? String(user.id) : null;
  } catch {
    return null;
  }
}

async function resolveIdentity(payload: ClientPayload, env: Env) {
  const initData = typeof payload.telegramInitData === "string" ? payload.telegramInitData : "";
  if (initData && env.TELEGRAM_BOT_TOKEN) {
    const userId = await telegramUserId(initData, env.TELEGRAM_BOT_TOKEN);
    if (!userId) throw new Error("telegram_invalid");
    return { hash: await sha256(`telegram:${userId}`), mode: "telegram" as const };
  }
  const installId = typeof payload.installId === "string" ? payload.installId : "";
  if (!/^[a-f0-9-]{32,64}$/i.test(installId)) throw new Error("identity_invalid");
  return { hash: await sha256(`browser:${installId}`), mode: "browser" as const };
}

function parseGame(value: unknown): Game | null {
  return value === "dropfish" || value === "agroclick" ? value : null;
}

async function readPayload(request: Request): Promise<ClientPayload> {
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (contentLength > 16_384) throw new Error("payload_too_large");
  return request.json<ClientPayload>();
}

async function claim(request: Request, env: Env): Promise<Response> {
  const payload = await readPayload(request);
  const game = parseGame(payload.game);
  if (!game) return json(request, { error: "invalid_game" }, 400);
  const identity = await resolveIdentity(payload, env);
  const clock = moscowClock();
  const now = clock.serverNow;

  const insert = await env.DB.prepare(
    `INSERT OR IGNORE INTO daily_sessions
      (identity_hash, game, moscow_day, mode, started_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(identity.hash, game, clock.day, identity.mode, now, now).run();

  if (!insert.success) return json(request, { error: "storage_error" }, 503);
  await env.DB.prepare(
    `UPDATE daily_sessions SET last_seen_at = ?
      WHERE identity_hash = ? AND game = ? AND moscow_day = ?`,
  ).bind(now, identity.hash, game, clock.day).run();

  const existing = await env.DB.prepare(
    `SELECT started_at, finished_at FROM daily_sessions
      WHERE identity_hash = ? AND game = ? AND moscow_day = ?`,
  ).bind(identity.hash, game, clock.day).first<{ started_at: number; finished_at: number | null }>();

  const created = Number(insert.meta.changes ?? 0) > 0;
  return json(request, {
    allowed: created || Boolean(existing && !existing.finished_at),
    resumed: !created && Boolean(existing && !existing.finished_at),
    finished: Boolean(existing?.finished_at),
    mode: identity.mode,
    day: clock.day,
    serverNow: clock.serverNow,
    resetAt: clock.resetAt,
  });
}

async function finish(request: Request, env: Env): Promise<Response> {
  const payload = await readPayload(request);
  const game = parseGame(payload.game);
  if (!game) return json(request, { error: "invalid_game" }, 400);
  const identity = await resolveIdentity(payload, env);
  const clock = moscowClock();
  const resultText = JSON.stringify(payload.result ?? null).slice(0, 8_000);
  const resultCode = crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();

  const update = await env.DB.prepare(
    `UPDATE daily_sessions
      SET finished_at = COALESCE(finished_at, ?), last_seen_at = ?,
          result_json = COALESCE(result_json, ?), result_code = COALESCE(result_code, ?)
      WHERE identity_hash = ? AND game = ? AND moscow_day = ?`,
  ).bind(
    clock.serverNow,
    clock.serverNow,
    resultText,
    resultCode,
    identity.hash,
    game,
    clock.day,
  ).run();
  if (!update.success || Number(update.meta.changes ?? 0) < 1) {
    return json(request, { error: "session_not_found" }, 409);
  }
  const row = await env.DB.prepare(
    `SELECT result_code FROM daily_sessions
      WHERE identity_hash = ? AND game = ? AND moscow_day = ?`,
  ).bind(identity.hash, game, clock.day).first<{ result_code: string }>();
  return json(request, {
    ok: true,
    resultCode: row?.result_code,
    serverNow: clock.serverNow,
    resetAt: clock.resetAt,
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json(request, { error: "origin_denied" }, 403);
    if (request.method === "OPTIONS") {
      const headers = corsHeaders(request);
      headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      headers.set("Access-Control-Max-Age", "86400");
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405);
    const path = new URL(request.url).pathname;
    try {
      if (path === "/v1/session/claim") return await claim(request, env);
      if (path === "/v1/session/finish") return await finish(request, env);
      return json(request, { error: "not_found" }, 404);
    } catch (error) {
      const code = error instanceof Error ? error.message : "unknown_error";
      const status = code === "payload_too_large" ? 413 : code.startsWith("telegram_") ? 401 : 400;
      console.error(JSON.stringify({ event: "request_error", path, code }));
      return json(request, { error: code }, status);
    }
  },
} satisfies ExportedHandler<Env>;
