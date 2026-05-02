import { useState, useEffect } from 'react';

interface Track {
  name: string;
  url: string;
  artist: {
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

type NowPlayingProps = {
  className?: string;
};

export const NowPlaying = ({ className = 'my-8' }: NowPlayingProps) => {
  const [trackTitle, setTrackTitle] = useState('Nothing playing');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackArt, setTrackArt] = useState('');
  const [trackUrl, setTrackUrl] = useState('#');
  const [artistUrl, setArtistUrl] = useState('#');

  const apiKey = import.meta.env.VITE_LASTFM_API_KEY;

  useEffect(() => {
    const updateNowPlaying = async () => {
      try {
        const apiUrl =
          `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=SzaBee13&api_key=${apiKey}&format=json&limit=1`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        const track: Track = data?.recenttracks?.track?.[0];
        const isNowPlaying = Boolean(track?.['@attr']?.nowplaying);

        if (track && isNowPlaying) {
          setTrackTitle(track.name || 'Unknown track');
          setTrackUrl(track.url || '#');

          const artistName = track.artist?.['#text'] || '';
          setTrackArtist(artistName);
          setArtistUrl(
            artistName
              ? `https://www.last.fm/music/${encodeURIComponent(artistName)}`
              : '#'
          );

          const art =
            track.image?.find((img) => img.size === 'extralarge') ||
            track.image?.[0];
          setTrackArt(art?.['#text'] || '');
        } else {
          setTrackTitle('Nothing playing');
          setTrackUrl('#');
          setTrackArtist('');
          setArtistUrl('#');
          setTrackArt('');
        }
      } catch (err) {
        console.error('Failed to fetch Last.fm now playing:', err);
        setTrackTitle('Nothing playing');
        setTrackUrl('#');
        setTrackArtist('');
        setArtistUrl('#');
        setTrackArt('');
      }
    };

    updateNowPlaying();
    const interval = setInterval(updateNowPlaying, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="now-playing-widget" className={`flex flex-col items-center ${className}`}>
      <div className="w-full p-6 bg-white rounded-lg shadow-lg dark:bg-gray-700 md:w-96">
        {trackArt && <img src={trackArt} alt="Album art" className="w-full h-auto mb-4 rounded-lg" />}
        <h3 className="mb-2 text-lg font-bold">
          <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {trackTitle}
          </a>
        </h3>
        {trackArtist && (
          <p className="mb-2 text-sm">
            <a href={artistUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {trackArtist}
            </a>
          </p>
        )}
      </div>
    </div>
  );
};
