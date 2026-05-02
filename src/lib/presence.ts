export type PresenceItem = {
  source: string;
  title: string;
  subtitle?: string;
  detail?: string;
  startedAt?: string;
  updatedAt: string;
  icon?: string;
  url?: string;
  active?: boolean;
};

export type PresencePayload = {
  music?: PresenceItem | null;
  games?: PresenceItem[];
  editors?: PresenceItem[];
  terminals?: PresenceItem[];
  updatedAt?: string;
};

export type NormalizedPresence = {
  music: PresenceItem | null;
  games: PresenceItem[];
  editors: PresenceItem[];
  terminals: PresenceItem[];
  updatedAt: string | null;
  stale: boolean;
};

export const PRESENCE_TTL_MS = 2 * 60 * 1000;

const PRESENCE_SECTIONS = ['games', 'editors', 'terminals'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

export function normalizePresenceItem(value: unknown, nowMs = Date.now(), ttlMs = PRESENCE_TTL_MS): PresenceItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const source = asString(value.source);
  const title = asString(value.title);
  const updatedAt = asString(value.updatedAt);

  if (!source || !title || !updatedAt || !isFreshIso(updatedAt, nowMs, ttlMs) || value.active === false) {
    return null;
  }

  return {
    source,
    title,
    subtitle: asString(value.subtitle),
    detail: asString(value.detail),
    startedAt: asString(value.startedAt),
    updatedAt,
    icon: asString(value.icon),
    url: asString(value.url),
    active: true,
  };
}

export function normalizePresencePayload(
  value: unknown,
  nowMs = Date.now(),
  ttlMs = PRESENCE_TTL_MS,
): NormalizedPresence {
  const empty: NormalizedPresence = {
    music: null,
    games: [],
    editors: [],
    terminals: [],
    updatedAt: null,
    stale: true,
  };

  if (!isRecord(value)) {
    return empty;
  }

  const updatedAt = asString(value.updatedAt);
  const stale = !isFreshIso(updatedAt, nowMs, ttlMs);
  if (stale) {
    return { ...empty, updatedAt: updatedAt ?? null };
  }

  const normalized: NormalizedPresence = {
    music: normalizePresenceItem(value.music, nowMs, ttlMs),
    games: [],
    editors: [],
    terminals: [],
    updatedAt: updatedAt ?? null,
    stale: false,
  };

  for (const section of PRESENCE_SECTIONS) {
    const items = Array.isArray(value[section]) ? value[section] : [];
    normalized[section] = items
      .map((item) => normalizePresenceItem(item, nowMs, ttlMs))
      .filter((item): item is PresenceItem => Boolean(item));
  }

  return normalized;
}

export function hasPresence(payload: NormalizedPresence): boolean {
  return Boolean(
    payload.music ||
    payload.games.length ||
    payload.editors.length ||
    payload.terminals.length,
  );
}

export function chooseMusicPresence(localMusic: PresenceItem | null, lastFmMusic: PresenceItem | null): PresenceItem | null {
  return lastFmMusic ?? localMusic;
}
