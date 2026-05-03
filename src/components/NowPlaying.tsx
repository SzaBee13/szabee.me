import { useEffect, useMemo, useState } from 'react';
import type { NormalizedPresence, PresenceItem } from '../lib/presence';
import { chooseMusicPresence, hasPresence, normalizePresencePayload } from '../lib/presence';

interface LastFmTrack {
  name: string;
  url: string;
  artist: {
    '#text': string;
  };
  album?: {
    '#text': string;
  };
  image?: Array<{
    '#text': string;
    size: string;
  }>;
  '@attr'?: {
    nowplaying: string;
  };
}

type PresenceCard = {
  key: string;
  kind: 'music' | 'game' | 'editor' | 'terminal';
  label: string;
  item: PresenceItem;
};

type NowPlayingProps = {
  className?: string;
};

const emptyPresence = normalizePresencePayload(null);

// Simple cache to avoid redundant API calls
const albumArtCache = new Map<string, string | null>();

async function fetchAlbumArt(artist: string, album: string, track: string): Promise<string | null> {
  const cacheKey = `${artist}:${album}:${track}`;

  if (albumArtCache.has(cacheKey)) {
    return albumArtCache.get(cacheKey) || null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(artist)} ${encodeURIComponent(album || track)}&entity=album&limit=1`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      albumArtCache.set(cacheKey, null);
      return null;
    }

    const data = await response.json();
    const albumItem = data.results?.[0];

    if (albumItem?.artworkUrl100) {
      const imageUrl = albumItem.artworkUrl100.replace('100x100bb', '600x600bb');
      albumArtCache.set(cacheKey, imageUrl);
      return imageUrl;
    }

    albumArtCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error('Error fetching album art:', error);
    albumArtCache.set(cacheKey, null);
    return null;
  }
}

async function lastFmTrackToPresence(track: LastFmTrack | null): Promise<PresenceItem | null> {
  if (!track?.['@attr']?.nowplaying) {
    return null;
  }

  const artistName = track.artist?.['#text'] || '';
  const albumName = track.album?.['#text'] || '';
  const trackName = track.name || '';

  let imageUrl =
    track.image?.find((img) => img.size === 'extralarge')?.['#text'] ||
    track.image?.find((img) => img.size === 'large')?.['#text'] ||
    track.image?.[0]?.['#text'];

  if (!imageUrl || imageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
    const fetchedImageUrl = await fetchAlbumArt(artistName, albumName, trackName);
    if (fetchedImageUrl) {
      imageUrl = fetchedImageUrl;
    }
  }

  return {
    source: 'Last.fm',
    title: trackName || 'Unknown track',
    subtitle: artistName,
    detail: albumName,
    updatedAt: new Date().toISOString(),
    icon: imageUrl || undefined,
    url: track.url || undefined,
    active: true,
  };
}

function buildCards(presence: NormalizedPresence, lastFmMusic: PresenceItem | null): PresenceCard[] {
  const cards: PresenceCard[] = [];
  const music = chooseMusicPresence(presence.music, lastFmMusic);

  if (music) {
    cards.push({ key: `music-${music.source}-${music.title}`, kind: 'music', label: 'Music', item: music });
  }

  presence.games.forEach((item, index) => {
    cards.push({ key: `game-${item.source}-${item.title}-${index}`, kind: 'game', label: 'Game', item });
  });

  presence.editors.forEach((item, index) => {
    cards.push({ key: `editor-${item.source}-${item.title}-${index}`, kind: 'editor', label: 'Coding', item });
  });

  presence.terminals.forEach((item, index) => {
    cards.push({ key: `terminal-${item.source}-${item.title}-${index}`, kind: 'terminal', label: 'Terminal', item });
  });

  return cards;
}

function fallbackIcon(kind: PresenceCard['kind']) {
  if (kind === 'music') return '♪';
  if (kind === 'game') return '▶';
  if (kind === 'editor') return '{}';
  return '$';
}

function cardAccent(kind: PresenceCard['kind']) {
  if (kind === 'music') return 'from-blue-500 to-cyan-400';
  if (kind === 'game') return 'from-emerald-500 to-lime-400';
  if (kind === 'editor') return 'from-violet-500 to-fuchsia-400';
  return 'from-amber-500 to-orange-400';
}

function PresenceArtwork({ card }: { card: PresenceCard }) {
  if (card.item.icon) {
    return (
      <img
        src={card.item.icon}
        alt="Album art"
        className="object-cover w-24 h-24 rounded-lg shadow-md"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${cardAccent(card.kind)} text-lg font-bold text-white shadow-md`}>
      {fallbackIcon(card.kind)}
    </div>
  );
}

// Each bar has its own duration and height range to look organic and alive
const EQ_BARS: Array<{ minH: number; maxH: number; duration: number; delay: number }> = [
  { minH: 4,  maxH: 12, duration: 0.9,  delay: 0.00 },
  { minH: 8,  maxH: 26, duration: 0.7,  delay: 0.08 },
  { minH: 6,  maxH: 20, duration: 1.1,  delay: 0.16 },
  { minH: 10, maxH: 30, duration: 0.65, delay: 0.05 },
  { minH: 4,  maxH: 18, duration: 0.85, delay: 0.22 },
  { minH: 12, maxH: 28, duration: 0.75, delay: 0.11 },
  { minH: 6,  maxH: 24, duration: 1.0,  delay: 0.19 },
  { minH: 8,  maxH: 16, duration: 0.6,  delay: 0.03 },
  { minH: 10, maxH: 32, duration: 0.8,  delay: 0.25 },
  { minH: 4,  maxH: 22, duration: 0.95, delay: 0.14 },
  { minH: 8,  maxH: 20, duration: 0.7,  delay: 0.07 },
  { minH: 6,  maxH: 14, duration: 1.05, delay: 0.21 },
  { minH: 10, maxH: 24, duration: 0.8,  delay: 0.09 },
  { minH: 4,  maxH: 18, duration: 0.9,  delay: 0.17 },
  { minH: 8,  maxH: 30, duration: 0.68, delay: 0.24 },
  { minH: 6,  maxH: 20, duration: 1.0,  delay: 0.02 },
  { minH: 12, maxH: 26, duration: 0.72, delay: 0.13 },
  { minH: 4,  maxH: 16, duration: 0.88, delay: 0.20 },
  { minH: 8,  maxH: 28, duration: 0.78, delay: 0.06 },
  { minH: 6,  maxH: 22, duration: 1.08, delay: 0.18 },
  { minH: 10, maxH: 32, duration: 0.62, delay: 0.10 },
  { minH: 4,  maxH: 14, duration: 0.92, delay: 0.23 },
  { minH: 8,  maxH: 24, duration: 0.76, delay: 0.04 },
  { minH: 6,  maxH: 18, duration: 1.02, delay: 0.15 },
];

function PresenceActivity({ kind }: { kind: PresenceCard['kind'] }) {
  if (kind !== 'music') return null;

  return (
    <>
      {/* Inject keyframes via a style tag — works without a build-step */}
      <style>{`
        @keyframes eq-bounce {
          0%, 100% { transform: scaleY(var(--eq-min)); }
          50%       { transform: scaleY(var(--eq-max)); }
        }
      `}</style>

      <div className="mt-4 flex w-full h-8 items-end gap-[3px]" aria-hidden>
        {EQ_BARS.map((bar, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 origin-bottom rounded-sm"
            style={{
              height: `${bar.maxH}px`,
              background: `linear-gradient(to top, #3b82f6, #22d3ee)`,
              '--eq-min': `${bar.minH / bar.maxH}`,
              '--eq-max': '1',
              animation: `eq-bounce ${bar.duration}s ease-in-out ${bar.delay}s infinite`,
              willChange: 'transform',
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  );
}

function PresenceCardView({ card }: { card: PresenceCard }) {
  const isMusic = card.kind === 'music';

  const content = (
    <article className={`h-full rounded-xl border border-gray-200 bg-white/30 dark:border-gray-700 dark:bg-gray-800/30 backdrop-blur-md p-5 transition-all duration-300 shadow-md hover:shadow-lg ${
      isMusic ? 'ring-1 ring-blue-500/20 hover:ring-blue-500/30' : ''
    }`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">{card.label}</span>
        <span className="px-2 py-1 text-xs font-semibold text-red-600 rounded-full bg-red-500/10 dark:text-red-300">LIVE</span>
      </div>

      <div className="flex gap-4">
        <div className={`flex-shrink-0 ${isMusic ? 'relative' : ''}`}>
          <PresenceArtwork card={card} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 line-clamp-2 dark:text-white">{card.item.title}</h3>
          {card.item.subtitle && (
            <p className="mt-1 text-sm text-gray-600 truncate dark:text-gray-300">{card.item.subtitle}</p>
          )}
          {card.item.detail && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">{card.item.detail}</p>
          )}
          <p className="mt-2 text-xs font-medium text-gray-500 truncate dark:text-gray-400">{card.item.source}</p>
        </div>
      </div>

      <PresenceActivity kind={card.kind} />
    </article>
  );

  if (!card.item.url) return content;

  return (
    <a href={card.item.url} target="_blank" rel="noopener noreferrer" className="block h-full">
      {content}
    </a>
  );
}

export const NowPlaying = ({ className = 'my-8' }: NowPlayingProps) => {
  const [presence, setPresence] = useState<NormalizedPresence>(emptyPresence);
  const [lastFmMusic, setLastFmMusic] = useState<PresenceItem | null>(null);
  const [error, setError] = useState('');

  const apiKey = import.meta.env.VITE_LASTFM_API_KEY;

  useEffect(() => {
    let mounted = true;

    const updateNowPlaying = async () => {
      try {
        const [presenceResult, lastFmResult] = await Promise.allSettled([
          fetch('/api/presence').then((res) => (res.ok ? res.json() : null)),
          apiKey
            ? fetch(
                `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=SzaBee13&api_key=${apiKey}&format=json&limit=1`,
              ).then((res) => (res.ok ? res.json() : null))
            : Promise.resolve(null),
        ]);

        if (!mounted) return;

        if (presenceResult.status === 'fulfilled') {
          setPresence(normalizePresencePayload(presenceResult.value));
        }

        if (lastFmResult.status === 'fulfilled') {
          const track = lastFmResult.value?.recenttracks?.track?.[0] as LastFmTrack | undefined;
          lastFmTrackToPresence(track ?? null).then((presenceItem) => {
            if (mounted) setLastFmMusic(presenceItem);
          });
        }

        setError('');
      } catch (err) {
        console.error('Failed to fetch rich presence:', err);
        if (mounted) setError('Presence is temporarily unavailable.');
      }
    };

    void updateNowPlaying();
    const interval = window.setInterval(updateNowPlaying, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [apiKey]);

  const cards = useMemo(() => buildCards(presence, lastFmMusic), [lastFmMusic, presence]);
  const hasAnyPresence = cards.length > 0 && (lastFmMusic || hasPresence(presence));

  return (
    <div id="now-playing-widget" className={`flex flex-col items-center ${className}`}>
      <div className="w-full max-w-5xl p-5 transition-all duration-300 border border-gray-200 shadow-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg dark:border-gray-700 rounded-xl hover:shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Now Playing</h2>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">LIVE</span>
          </div>
        </div>

        {hasAnyPresence ? (
          <div className="grid gap-4 px-2 pb-2">
            {cards.map((card) => (
              <div key={card.key} className="p-2 rounded odd:bg-gray-50 even:bg-gray-100 dark:odd:bg-gray-800/50 dark:even:bg-gray-700/50">
                <PresenceCardView card={card} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-gray-300 border-dashed rounded-lg dark:border-gray-700">
            <div className="flex items-center justify-center w-24 h-24 mb-4 text-3xl font-bold text-gray-400 bg-gray-100 rounded-lg dark:bg-gray-700">
              ♪
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Nothing active</h3>
            <p className="max-w-sm mt-2 text-sm text-gray-500 dark:text-gray-400">
              Music, games, coding, and terminal sessions will appear here when they are live.
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p>}
      </div>
    </div>
  );
};