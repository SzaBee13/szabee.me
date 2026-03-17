
import { useTheme } from '../../hooks/useTheme';

function resolveSlug(): string | null {
  // Prefer explicit ?slug= query param
  const fromQuery = new URLSearchParams(window.location.search).get('slug');
  if (fromQuery) return fromQuery;

  // Fall back to the Referer header value exposed via document.referrer.
  // When s.szabee.me/some-slug redirects here the browser sets referrer to
  // that origin, so we can extract the path segment as the slug.
  try {
    const ref = document.referrer;
    if (ref) {
      const url = new URL(ref);
      if (url.hostname === 's.szabee.me') {
        const path = url.pathname.replace(/^\//, '').trim();
        if (path) return path;
      }
    }
  } catch {
    // malformed referrer – ignore
  }
  return null;
}

export function ShareNotFound() {
  const { isDarkMode } = useTheme();
  const slug = resolveSlug();

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}
    >
      <div className="max-w-md text-center">
        <p className={`text-6xl font-extrabold mb-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>404</p>
        <h1 className="mb-2 text-2xl font-bold">Short link not found</h1>
        <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {slug ? (
            <>
              The short link <span className={`font-mono font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>s.szabee.me/{slug}</span> does not exist or has been removed.
            </>
          ) : (
            'This short link does not exist or has been removed.'
          )}
        </p>
        <a
          href="https://szabee.me"
          className={`inline-block px-6 py-2 rounded-lg font-medium transition-colors ${
            isDarkMode
              ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          Go to szabee.me
        </a>
      </div>
    </div>
  );
}