import type { IncomingMessage, ServerResponse } from 'node:http';
import { Redis } from '@upstash/redis';
import { normalizePresencePayload } from '../src/lib/presence';

const OAUTH_BASE = 'https://oauth.szabee.me';
const OWNER_UUID = '1d71a065-cb52-4f87-9d00-4e5240d8d017';
const OWNER_EMAIL = 'miabajodlol@gmail.com';
const PRESENCE_KEY = 'szabee:presence:latest';

type OAuthUser = {
  uuid: string;
  email: string;
  display_name?: string;
};

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += String(chunk);
    });

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });

    req.on('error', reject);
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

function extractBearer(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header) {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function validateOwner(token: string): Promise<OAuthUser> {
  const response = await fetch(`${OAUTH_BASE}/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Access token is invalid or expired.');
  }

  const user = (await response.json()) as OAuthUser;
  const isOwner =
    user.uuid?.toLowerCase() === OWNER_UUID.toLowerCase() ||
    user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  if (!isOwner) {
    throw new Error('Authenticated account is not allowed to publish presence.');
  }

  return user;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const redis = getRedis();

  if (req.method === 'GET') {
    const stored = redis ? await redis.get(PRESENCE_KEY) : null;
    sendJson(res, 200, normalizePresencePayload(parseStoredPresence(stored)));
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('allow', 'GET, POST');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  if (!redis) {
    sendJson(res, 500, {
      error: 'Presence storage is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
    });
    return;
  }

  const token = extractBearer(req);
  if (!token) {
    sendJson(res, 401, { error: 'Missing bearer token.' });
    return;
  }

  try {
    await validateOwner(token);

    const body = await readBody(req);
    const now = new Date().toISOString();
    const payload = {
      ...(typeof body === 'object' && body !== null ? body : {}),
      updatedAt: now,
    };
    const normalized = normalizePresencePayload(payload);

    await redis.set(PRESENCE_KEY, normalized, { ex: 180 });
    sendJson(res, 200, { ok: true, presence: normalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update presence.';
    const status = message.includes('not allowed') ? 403 : message.includes('token') ? 401 : 400;
    sendJson(res, status, { error: message });
  }
}
