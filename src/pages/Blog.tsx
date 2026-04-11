import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import blogMetadata from '../assets/blogs/Blogs.json';
import { useTheme } from '../hooks/useTheme';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';
import { RSSFeed } from '../components/RSSFeed';
import { PageMeta } from '../components/PageMeta';

type BlogMetadata = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
};

const markdownModules = import.meta.glob('../assets/blogs/*.md', {
  query: '?raw',
  import: 'default',
});

marked.setOptions({
  gfm: true,
  breaks: true,
});

function normalizeTitle(value: string): string {
  return value
    .replace(/[*_`~]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function removeMatchingTopHeading(markdown: string, title: string): string {
  const match = markdown.match(/^\uFEFF?(?:\s*\r?\n)*#\s+(.+?)\s*#*\s*(?:\r?\n|$)/);
  if (!match) {
    return markdown;
  }

  const headingText = normalizeTitle(match[1]);
  const metadataTitle = normalizeTitle(title);

  if (headingText !== metadataTitle) {
    return markdown;
  }

  return markdown.slice(match[0].length).replace(/^\s*\r?\n/, '');
}

export default function Blog() {
  const { isDarkMode } = useTheme();
  const { slug } = useParams();
  const [contentHtml, setContentHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const blogs = useMemo(
    () =>
      [...(blogMetadata as BlogMetadata[])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [],
  );

  const selectedBlog = useMemo(() => blogs.find((item) => item.slug === slug), [blogs, slug]);

  const filteredBlogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return blogs;
    }

    return blogs.filter((item) => {
      const haystack = [item.title, item.description, item.slug, ...(item.tags ?? [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [blogs, searchQuery]);

  useEffect(() => {
    if (!slug || !selectedBlog) {
      setContentHtml('');
      setIsLoading(false);
      return;
    }

    const markdownPath = `../assets/blogs/${slug}.md`;
    const loadMarkdown = markdownModules[markdownPath];

    if (!loadMarkdown) {
      setContentHtml('');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    (async () => {
      const raw = (await loadMarkdown()) as string;
      const cleanedMarkdown = removeMatchingTopHeading(raw, selectedBlog.title);
      const rendered = await marked.parse(cleanedMarkdown);
      if (isMounted) {
        setContentHtml(DOMPurify.sanitize(rendered));
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedBlog, slug]);

  const pageClasses = isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const cardClasses = isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white';

  if (!slug) {
    return (
      <div className={`min-h-screen ${pageClasses}`}>
        <PageMeta
          title="Blogs | SzaBee13"
          description="Notes, experiments, and updates from SzaBee13."
          path="/blogs"
        />
        <Navbar />

        <main className="max-w-4xl px-4 py-10 pt-16 mx-auto">
          <h1 className="mb-2 text-4xl font-bold">Blogs</h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
            Notes, experiments, and updates.
          </p>

          <div className="mb-6">
            <label htmlFor="blog-search" className="sr-only">Search blogs</label>
            <input
              id="blog-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search blogs by title, tag, or description..."
              className={`w-full rounded-lg border px-4 py-3 outline-none transition-colors ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-400'
                  : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-500'
              }`}
            />
          </div>

          <div className="grid gap-4">
            {filteredBlogs.map((item) => (
              <article key={item.slug} className={`rounded-xl border p-5 transition-shadow hover:shadow-lg ${cardClasses}`}>
                <p className={`mb-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(item.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <h2 className="mb-2 text-2xl font-semibold">
                  <Link to={`/blogs/${item.slug}`} className="hover:underline">{item.title}</Link>
                </h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>{item.description}</p>
                <div className="flex flex-wrap gap-2">
                  {(item.tags ?? []).map((tag) => (
                    <span
                      key={`${item.slug}-${tag}`}
                      className={`rounded-full px-2 py-1 text-xs ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}

            {filteredBlogs.length === 0 && (
              <div className={`rounded-xl border p-5 ${cardClasses}`}>
                <h2 className="mb-2 text-xl font-semibold">No blogs found</h2>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  No posts match "{searchQuery.trim()}".
                </p>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageClasses}`}>
      <PageMeta
        title={selectedBlog ? `${selectedBlog.title} | SzaBee13` : 'Blog not found | SzaBee13'}
        description={selectedBlog?.description ?? `No post exists for slug: ${slug}`}
        path={selectedBlog ? `/blogs/${selectedBlog.slug}` : '/blogs'}
        type="article"
        noIndex={!selectedBlog}
      />
      <Navbar />

      <main className="max-w-4xl px-4 py-10 mx-auto">
        {!selectedBlog && (
          <div className="p-5 border rounded-xl border-red-400/40 bg-red-500/10">
            <h1 className="mb-2 text-2xl font-bold">Blog not found</h1>
            <p className="mb-4">No post exists for slug: {slug}</p>
            <Link to="/blogs" className="font-semibold hover:underline">Back to blogs</Link>
          </div>
        )}

        {selectedBlog && (
          <article>
            <p className={`mb-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date(selectedBlog.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h1 className="mb-3 text-4xl font-bold">{selectedBlog.title}</h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>{selectedBlog.description}</p>

            {isLoading ? (
              <p>Loading post...</p>
            ) : (
              <div
                className={`blog-markdown ${isDarkMode ? 'blog-markdown-dark' : 'blog-markdown-light'}`}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            )}
          </article>
        )}
      </main>
      <div className="max-w-4xl px-4 py-6 mx-auto">
        <RSSFeed />
      </div>
      <Footer />
    </div>
  );
}
