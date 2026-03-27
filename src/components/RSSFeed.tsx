import { useTheme } from '../hooks/useTheme';

export function RSSFeed() {
  const { isDarkMode } = useTheme();

  return (
    <a
      href="/rss.xml"
      target="_blank"
      rel="noopener noreferrer"
      title="Subscribe to RSS Feed"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isDarkMode
          ? 'bg-orange-900 text-orange-200 hover:bg-orange-800'
          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="6.18" cy="17.82" r="2.18" />
        <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
      </svg>
      <span>RSS Feed</span>
    </a>
  );
}
