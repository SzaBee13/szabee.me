import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/lib/presence.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const context = {
  exports: {},
  module: { exports: {} },
};
context.exports = context.module.exports;
vm.runInNewContext(compiled, context);

const {
  chooseMusicPresence,
  hasPresence,
  normalizePresencePayload,
} = context.module.exports;

const now = Date.parse('2026-05-02T12:00:00.000Z');
const freshPayload = {
  updatedAt: '2026-05-02T11:59:30.000Z',
  music: {
    source: 'MPRIS/spotify',
    title: 'Local track',
    subtitle: 'Local artist',
    updatedAt: '2026-05-02T11:59:30.000Z',
  },
  games: [
    {
      source: 'Steam',
      title: 'A Game',
      updatedAt: '2026-05-02T11:59:30.000Z',
    },
  ],
};

const fresh = normalizePresencePayload(freshPayload, now);
assert.equal(fresh.stale, false);
assert.equal(fresh.music.title, 'Local track');
assert.equal(fresh.games.length, 1);
assert.equal(hasPresence(fresh), true);

const stale = normalizePresencePayload(
  {
    ...freshPayload,
    updatedAt: '2026-05-02T11:55:00.000Z',
  },
  now,
);
assert.equal(stale.stale, true);
assert.equal(hasPresence(stale), false);

const inactive = normalizePresencePayload(
  {
    updatedAt: '2026-05-02T11:59:30.000Z',
    music: {
      source: 'MPRIS/spotify',
      title: 'Paused track',
      active: false,
      updatedAt: '2026-05-02T11:59:30.000Z',
    },
  },
  now,
);
assert.equal(inactive.music, null);

const lastFmMusic = {
  source: 'Last.fm',
  title: 'Remote track',
  updatedAt: '2026-05-02T11:59:30.000Z',
};
assert.equal(chooseMusicPresence(fresh.music, lastFmMusic).title, 'Remote track');
assert.equal(chooseMusicPresence(fresh.music, null).title, 'Local track');

console.log('presence normalization tests passed');
