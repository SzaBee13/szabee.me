import { Redis } from '@upstash/redis/cloudflare';
import { normalizePresencePayload } from '../../src/lib/presence';

const OWNER_UUID = '1d71a065-cb52-4f87-9d00-4e5240d8d017';
const OWNER_EMAIL = 'miabajodlol@gmail.com';
const PRESENCE_KEY = 'szabee:presence:latest';

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
    return sendJson(200, normalizePresencePayload(stored));
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

    await redis.set(PRESENCE_KEY, normalized, { ex: 180 });
    return sendJson(200, { ok: true, presence: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update presence.';
    const status = message.includes('not allowed') ? 403 : message.includes('token') ? 401 : 400;
    return sendJson(status, { error: message });
  }
}
