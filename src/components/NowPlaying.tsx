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
  
  // Check cache first
  if (albumArtCache.has(cacheKey)) {
    return albumArtCache.get(cacheKey) || null;
  }
  
  try {
    // Try to get album art from iTunes API (no auth required)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
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
      // Convert 100x100 to larger size by modifying URL
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
  
  // First try to get image from Last.fm
  let imageUrl =
    track.image?.find((img) => img.size === 'extralarge')?.['#text'] ||
    track.image?.find((img) => img.size === 'large')?.['#text'] ||
    track.image?.[0]?.['#text'];

  // If Last.fm doesn't have a good image, try to fetch from iTunes
  if (!imageUrl || imageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
    // Last.fm uses this placeholder image when no album art is available
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
  if (kind === 'music') {
    return '♪';
  }

  if (kind === 'game') {
    return '▶';
  }

  if (kind === 'editor') {
    return '{}';
  }

  return '$';
}

function cardAccent(kind: PresenceCard['kind']) {
  if (kind === 'music') {
    return 'from-blue-500 to-cyan-400';
  }

  if (kind === 'game') {
    return 'from-emerald-500 to-lime-400';
  }

  if (kind === 'editor') {
    return 'from-violet-500 to-fuchsia-400';
  }

  return 'from-amber-500 to-orange-400';
}

function PresenceArtwork({ card }: { card: PresenceCard }) {
  if (card.item.icon) {
    return (
      <img
        src={card.item.icon}
        alt=""
        className="object-cover w-16 h-16 rounded-lg shadow-md"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${cardAccent(card.kind)} text-lg font-bold text-white shadow-md`}>
      {fallbackIcon(card.kind)}
    </div>
  );
}

function PresenceActivity({ kind }: { kind: PresenceCard['kind'] }) {
  if (kind !== 'music') {
    return null;
  }

  // More dynamic visualization with varied heights and colors
  const bars = [
    { height: 8, delay: 0.0, color: 'bg-blue-400' },
    { height: 18, delay: 0.05, color: 'bg-blue-500' },
    { height: 11, delay: 0.1, color: 'bg-cyan-400' },
    { height: 24, delay: 0.15, color: 'bg-cyan-500' },
    { height: 14, delay: 0.2, color: 'bg-blue-400' },
    { height: 21, delay: 0.25, color: 'bg-blue-500' },
    { height: 10, delay: 0.3, color: 'bg-cyan-400' },
    { height: 17, delay: 0.35, color: 'bg-cyan-500' },
    { height: 25, delay: 0.4, color: 'bg-blue-400' },
    { height: 13, delay: 0.45, color: 'bg-blue-500' },
    { height: 20, delay: 0.5, color: 'bg-cyan-400' },
    { height: 9, delay: 0.55, color: 'bg-cyan-500' },
  ];

  return (
    <div className="mt-4 flex h-8 items-end gap-1.5">
      {bars.map((bar, index) => (
        <div
          key={`${bar.height}-${index}`}
          className={`w-1.5 rounded-t ${bar.color} animate-pulse`}
          style={{ 
            height: `${bar.height}px`, 
            animationDelay: `${bar.delay}s`,
            animationDuration: '1.5s'
          }}
        />
      ))}
    </div>
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
          {isMusic && (
            <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full shadow-md -bottom-1 -right-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
                <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886.75.625 1.75.625 2.5 0 1.427-1.18 3.255-1.886 5.25-1.886.98 0 1.95.157 2.875.45v-3.75a.75.75 0 00-.5-.707 9.735 9.735 0 00-3.25-.555 9.707 9.707 0 00-5.25-1.217V7.628a2.25 2.25 0 011.25-2.025 8.25 8.25 0 00-6.25-2.957z" />
              </svg>
            </div>
          )}
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

  if (!card.item.url) {
    return content;
  }

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

        if (!mounted) {
          return;
        }

        if (presenceResult.status === 'fulfilled') {
          setPresence(normalizePresencePayload(presenceResult.value));
        }

        if (lastFmResult.status === 'fulfilled') {
          const track = lastFmResult.value?.recenttracks?.track?.[0] as LastFmTrack | undefined;
          lastFmTrackToPresence(track ?? null).then((presenceItem) => {
            if (mounted) {
              setLastFmMusic(presenceItem);
            }
          });
        }

        setError('');
      } catch (err) {
        console.error('Failed to fetch rich presence:', err);
        if (mounted) {
          setError('Presence is temporarily unavailable.');
        }
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
                <div key={card.key} className="odd:bg-gray-50 even:bg-gray-100 dark:odd:bg-gray-800/50 dark:even:bg-gray-700/50 p-2 rounded">
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
