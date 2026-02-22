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

export const NowPlaying = () => {
  const [trackTitle, setTrackTitle] = useState('Nothing playing');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackArt, setTrackArt] = useState('');
  const [trackUrl, setTrackUrl] = useState('#');
  const [artistUrl, setArtistUrl] = useState('#');

  useEffect(() => {
    const updateNowPlaying = async () => {
      try {
        const apiUrl =
          'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=SzaBee13&api_key=01981f06015a661e31fc32a8befeb459&format=json&limit=1';
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
    <div id="now-playing-widget" className="flex flex-col items-center my-8">
      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-lg w-full md:w-96">
        {trackArt && <img src={trackArt} alt="Album art" className="w-full h-auto rounded-lg mb-4" />}
        <h3 className="text-lg font-bold mb-2">
          <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {trackTitle}
          </a>
        </h3>
        {trackArtist && (
          <p className="text-sm mb-2">
            <a href={artistUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {trackArtist}
            </a>
          </p>
        )}
      </div>
    </div>
  );
};
