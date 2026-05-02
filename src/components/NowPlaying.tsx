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
      <div className="w-full max-w-md p-6 transition-all duration-300 bg-white shadow-lg rounded-xl dark:bg-gray-800 hover:shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Now Playing</h2>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">LIVE</span>
          </div>
        </div>
        
        {trackArt ? (
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex-shrink-0">
              <img 
                src={trackArt} 
                alt="Album art" 
                className="object-cover w-32 h-32 rounded-lg shadow-md md:w-40 md:h-40"
              />
            </div>
            <div className="flex flex-col justify-center flex-grow">
              <h3 className="mb-1 text-lg font-bold text-gray-800 dark:text-white line-clamp-2">
                <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  {trackTitle}
                </a>
              </h3>
              {trackArtist && (
                <p className="mb-3 text-base text-gray-600 dark:text-gray-300">
                  <a href={artistUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                    by {trackArtist}
                  </a>
                </p>
              )}
              <div className="flex items-center mt-2">
                <div className="flex items-center justify-center w-10 h-10 mr-3 text-white bg-blue-500 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                {/* Live music flow visualization */}
                <div className="flex items-end justify-center flex-grow h-8 space-x-1">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-1 bg-blue-400 animate-pulse"
                      style={{
                        height: `${Math.floor(Math.random() * 20) + 5}px`,
                        animationDuration: `${Math.random() * 0.5 + 0.3}s`,
                        animationDelay: `${Math.random() * 0.2}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex items-center justify-center w-32 h-32 mb-4 bg-gray-200 border-2 border-dashed dark:bg-gray-700 rounded-xl md:w-40 md:h-40">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{trackTitle}</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Check back later for music updates</p>
          </div>
        )}
      </div>
    </div>
  );
};
