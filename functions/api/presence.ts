import { Redis } from '@upstash/redis/cloudflare';

const OWNER_UUID = '1d71a065-cb52-4f87-9d00-4e5240d8d017';
const OWNER_EMAIL = 'miabajodlol@gmail.com';
const PRESENCE_KEY = 'szabee:presence:latest';
const PRESENCE_TTL_MS = 2 * 60 * 1000;

function sendJson(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

function parseStoredPresence(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isFreshIso(value: string | undefined, nowMs: number, ttlMs: number): boolean {
  if (!value) {
    return false;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) && nowMs - time <= ttlMs;
}

function normalizePresenceItem(value: unknown, nowMs: number, ttlMs: number) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const obj = value as Record<string, unknown>;
  const source = asString(obj.source);
  const title = asString(obj.title);
  const updatedAt = asString(obj.updatedAt);

  if (!source || !title || !updatedAt || !isFreshIso(updatedAt, nowMs, ttlMs) || obj.active === false) {
    return null;
  }

  return {
    source,
    title,
    subtitle: asString(obj.subtitle),
    detail: asString(obj.detail),
    startedAt: asString(obj.startedAt),
    updatedAt,
    icon: asString(obj.icon),
    url: asString(obj.url),
    active: true,
  };
}

function normalizePresencePayload(value: unknown, nowMs: number = Date.now(), ttlMs: number = PRESENCE_TTL_MS) {
  const empty = {
    music: null,
    games: [],
    editors: [],
    terminals: [],
    updatedAt: null,
    stale: true,
  };

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return empty;
  }

  const obj = value as Record<string, unknown>;
  const updatedAt = asString(obj.updatedAt);
  const stale = !isFreshIso(updatedAt, nowMs, ttlMs);
  if (stale) {
    return { ...empty, updatedAt: updatedAt ?? null };
  }

  const sections = ['games', 'editors', 'terminals'] as const;
  const normalized = {
    music: normalizePresenceItem(obj.music, nowMs, ttlMs),
    games: [],
    editors: [],
    terminals: [],
    updatedAt: updatedAt ?? null,
    stale: false,
  };

  for (const section of sections) {
    const items = Array.isArray(obj[section]) ? obj[section] : [];
    normalized[section] = items
      .map((item) => normalizePresenceItem(item, nowMs, ttlMs))
      .filter(Boolean);
  }

  return normalized;
}

async function extractBearer(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization');
  if (!header) {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function validateOwner(token: string): Promise<{ uuid: string; email: string }> {
  const response = await fetch('https://oauth.szabee.me/user', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Access token is invalid or expired.');
  }

  const user = (await response.json()) as { uuid: string; email: string };
  const isOwner =
    user.uuid?.toLowerCase() === OWNER_UUID.toLowerCase() ||
    user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  if (!isOwner) {
    throw new Error('Authenticated account is not allowed to publish presence.');
  }

  return user;
}

export async function onRequest(context: { request: Request; env: Record<string, string> }): Promise<Response> {
  const { request } = context;

  if (request.method === 'GET') {
    const redis = getRedis();
    const stored = redis ? await redis.get(PRESENCE_KEY) : null;
    return sendJson(200, normalizePresencePayload(parseStoredPresence(stored)));
  }

  if (request.method !== 'POST') {
    return sendJson(405, { error: 'Method not allowed.', allowed: 'GET, POST' });
  }

  const redis = getRedis();
  if (!redis) {
    return sendJson(500, {
      error: 'Presence storage is not configured.',
    });
  }

  const token = await extractBearer(request);
  if (!token) {
    return sendJson(401, { error: 'Missing bearer token.' });
  }

  try {
    await validateOwner(token);

    const body = await request.json().catch(() => ({}));
    const now = new Date().toISOString();
    const payload = {
      ...(typeof body === 'object' && body !== null ? body : {}),
      updatedAt: now,
    };
    const normalized = normalizePresencePayload(payload);

    await redis.set(PRESENCE_KEY, JSON.stringify(normalized), { ex: 180 });
    return sendJson(200, { ok: true, presence: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update presence.';
    const status = message.includes('not allowed') ? 403 : message.includes('token') ? 401 : 400;
    return sendJson(status, { error: message });
  }
}
