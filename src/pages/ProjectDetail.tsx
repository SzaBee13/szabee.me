import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import projectsData from '../assets/projects.json';
import projectBlogsData from '../assets/project-blogs/ProjectBlogs.json';
import { useTheme } from '../hooks/useTheme';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';

interface ProjectLink {
  label: string;
  url: string;
}

interface ProjectLinksObject {
  github?: string;
}

interface Project {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  links?: ProjectLink[] | ProjectLinksObject;
}

interface ProjectBlogMetadata {
  projectSlug: string;
  slug: string;
  title: string;
  description: string;
  date: string;
}

interface GitHubRelease {
  id: number;
  html_url: string;
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string;
  draft: boolean;
}

type ProjectUpdate =
  | {
      kind: 'blog';
      slug: string;
      title: string;
      description: string;
      date: string;
      blog: ProjectBlogMetadata;
    }
  | {
      kind: 'release';
      slug: string;
      title: string;
      description: string;
      date: string;
      releaseUrl: string;
      body: string;
    };

const projectBlogModules = import.meta.glob('../assets/project-blogs/**/*.md', {
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

function getProjectLinks(project: Project): ProjectLink[] {
  if (!project.links) {
    return [];
  }

  if (Array.isArray(project.links)) {
    return project.links;
  }

  const links: ProjectLink[] = [];
  if (typeof project.links.github === 'string' && project.links.github.trim()) {
    links.push({ label: 'GitHub', url: project.links.github.trim() });
  }
  return links;
}

function getGitHubRepoFromProject(project: Project): string | null {
  const githubUrl = getProjectLinks(project)
    .map((link) => link.url)
    .find((url) => {
      const normalized = url.toLowerCase();
      return normalized.includes('github.com/') && !normalized.includes('/releases');
    });

  if (!githubUrl) {
    return null;
  }

  try {
    const parsed = new URL(githubUrl);
    if (parsed.hostname !== 'github.com') {
      return null;
    }

    const [owner, repo] = parsed.pathname.split('/').filter(Boolean);
    if (!owner || !repo) {
      return null;
    }

    return `${owner}/${repo}`;
  } catch {
    return null;
  }
}

function buildReleaseDescription(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return 'Release published on GitHub.';
  }

  const singleLine = trimmed.replace(/\s+/g, ' ').slice(0, 180);
  return singleLine.length < trimmed.length ? `${singleLine}...` : singleLine;
}

export default function ProjectDetail() {
  const { isDarkMode } = useTheme();
  const { slug } = useParams();
  const [contentHtml, setContentHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [githubReleases, setGithubReleases] = useState<ProjectUpdate[]>([]);

  const allProjects: Project[] = useMemo(
    () => [...projectsData.projects, ...projectsData.classProjects],
    [],
  );

  const project = useMemo(() => allProjects.find((p) => p.slug === slug), [allProjects, slug]);

  const projectBlogs = useMemo(() => {
    if (!slug) return [];
    return (projectBlogsData as ProjectBlogMetadata[])
      .filter((blog) => blog.projectSlug === slug)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [slug]);

  const projectLinks = useMemo(() => (project ? getProjectLinks(project) : []), [project]);

  const githubRepo = useMemo(() => (project ? getGitHubRepoFromProject(project) : null), [project]);

  const projectUpdates = useMemo<ProjectUpdate[]>(() => {
    const blogUpdates: ProjectUpdate[] = projectBlogs.map((blog) => ({
      kind: 'blog',
      slug: blog.slug,
      title: blog.title,
      description: blog.description,
      date: blog.date,
      blog,
    }));

    return [...blogUpdates, ...githubReleases].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [projectBlogs, githubReleases]);

  useEffect(() => {
    if (!githubRepo) {
      setGithubReleases([]);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases?per_page=10`, {
          signal: controller.signal,
          headers: {
            Accept: 'application/vnd.github+json',
          },
        });

        if (!response.ok) {
          setGithubReleases([]);
          return;
        }

        const releases = (await response.json()) as GitHubRelease[];
        const normalized = releases
          .filter((release) => !release.draft)
          .map<ProjectUpdate>((release) => {
            const releaseTitle = release.name?.trim() || release.tag_name;
            const releaseBody = release.body ?? '';
            return {
              kind: 'release',
              slug: `release-${release.id}`,
              title: `${releaseTitle} (GitHub Release)`,
              description: buildReleaseDescription(releaseBody),
              date: release.published_at,
              releaseUrl: release.html_url,
              body: releaseBody,
            };
          });

        setGithubReleases(normalized);
      } catch {
        setGithubReleases([]);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [githubRepo]);

  useEffect(() => {
    if (!project) {
      setContentHtml('');
      setIsLoading(false);
      return;
    }

    if (projectUpdates.length === 0) {
      setContentHtml('');
      setIsLoading(false);
      return;
    }

    const firstUpdate = projectUpdates[0];

    let isMounted = true;
    setIsLoading(true);

    (async () => {
      try {
        if (firstUpdate.kind === 'blog') {
          const markdownPath = `../assets/project-blogs/${firstUpdate.blog.projectSlug}/${firstUpdate.blog.slug}.md`;
          const loadMarkdown = projectBlogModules[markdownPath];
          if (!loadMarkdown) {
            setContentHtml('');
            setIsLoading(false);
            return;
          }

          const raw = (await loadMarkdown()) as string;
          const cleanedMarkdown = removeMatchingTopHeading(raw, firstUpdate.blog.title);
          const rendered = await marked.parse(cleanedMarkdown);
          if (isMounted) {
            setContentHtml(DOMPurify.sanitize(rendered));
            setIsLoading(false);
          }
          return;
        }

        const rendered = await marked.parse(firstUpdate.body || '_No release notes provided._');
        if (isMounted) {
          setContentHtml(DOMPurify.sanitize(rendered));
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setContentHtml('');
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [project, projectUpdates]);

  const pageClasses = isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const cardClasses = isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white';

  const getTagColor = (tag: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      'Javascript': { bg: isDarkMode ? 'bg-blue-900' : 'bg-blue-100', text: isDarkMode ? 'text-blue-300' : 'text-blue-800' },
      'Python': { bg: isDarkMode ? 'bg-blue-900' : 'bg-blue-100', text: isDarkMode ? 'text-blue-300' : 'text-blue-800' },
      'Backend': { bg: isDarkMode ? 'bg-green-900' : 'bg-green-100', text: isDarkMode ? 'text-green-300' : 'text-green-800' },
      'Frontend': { bg: isDarkMode ? 'bg-green-900' : 'bg-green-100', text: isDarkMode ? 'text-green-300' : 'text-green-800' },
      'Tools': { bg: isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100', text: isDarkMode ? 'text-yellow-300' : 'text-yellow-800' },
      'Utils': { bg: isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100', text: isDarkMode ? 'text-yellow-300' : 'text-yellow-800' },
      'Fun': { bg: isDarkMode ? 'bg-pink-900' : 'bg-pink-100', text: isDarkMode ? 'text-pink-300' : 'text-pink-800' },
      'Programming Language': { bg: isDarkMode ? 'bg-purple-900' : 'bg-purple-100', text: isDarkMode ? 'text-purple-300' : 'text-purple-800' },
      'Windows': { bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100', text: isDarkMode ? 'text-gray-300' : 'text-gray-800' },
      'Linux': { bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100', text: isDarkMode ? 'text-gray-300' : 'text-gray-800' },
      'MacOS': { bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100', text: isDarkMode ? 'text-gray-300' : 'text-gray-800' },
      'Client': { bg: isDarkMode ? 'bg-red-900' : 'bg-red-100', text: isDarkMode ? 'text-red-300' : 'text-red-800' },
      'Fortnite': { bg: isDarkMode ? 'bg-red-900' : 'bg-red-100', text: isDarkMode ? 'text-red-300' : 'text-red-800' },
      'LSMP': { bg: isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100', text: isDarkMode ? 'text-indigo-300' : 'text-indigo-800' },
      'OAuth': { bg: isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100', text: isDarkMode ? 'text-indigo-300' : 'text-indigo-800' },
      'Escape': { bg: isDarkMode ? 'bg-teal-900' : 'bg-teal-100', text: isDarkMode ? 'text-teal-300' : 'text-teal-800' },
      'Szabfun': { bg: isDarkMode ? 'bg-pink-900' : 'bg-pink-100', text: isDarkMode ? 'text-pink-300' : 'text-pink-800' },
      'Chat': { bg: isDarkMode ? 'bg-purple-900' : 'bg-purple-100', text: isDarkMode ? 'text-purple-300' : 'text-purple-800' },
      'Spigot': { bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100', text: isDarkMode ? 'text-gray-300' : 'text-gray-800' },
      'Java': { bg: isDarkMode ? 'bg-orange-900' : 'bg-orange-100', text: isDarkMode ? 'text-orange-300' : 'text-orange-800' },
      'Minecraft': { bg: isDarkMode ? 'bg-green-900' : 'bg-green-100', text: isDarkMode ? 'text-green-300' : 'text-green-800' },
      'Next.js': { bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100', text: isDarkMode ? 'text-gray-300' : 'text-gray-800' },
      'Guesser': { bg: isDarkMode ? 'bg-blue-900' : 'bg-blue-100', text: isDarkMode ? 'text-blue-300' : 'text-blue-800' },
      'Multi Language': { bg: isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100', text: isDarkMode ? 'text-indigo-300' : 'text-indigo-800' },
    };
    return colorMap[tag] || { bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-100', text: isDarkMode ? 'text-gray-300' : 'text-gray-800' };
  };

  if (!project) {
    return (
      <div className={`min-h-screen ${pageClasses}`}>
        <Navbar />
        <main className="max-w-4xl px-4 py-10 pt-16 mx-auto">
          <div className="p-5 border rounded-xl border-red-400/40 bg-red-500/10">
            <h1 className="mb-2 text-2xl font-bold">Project not found</h1>
            <p className="mb-4">No project exists for slug: {slug}</p>
            <Link to="/projects" className="font-semibold hover:underline">
              Back to projects
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageClasses}`}>
      <Navbar />

      <main className="max-w-4xl px-4 py-10 pt-16 mx-auto">
        {/* Back Button */}
        <div className="my-6">
          <Link
            to="/projects"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <article className="mb-8">
          <h1 className="mb-3 text-4xl font-bold">{project.title}</h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-6 text-lg`}>
            {project.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => {
              const colors = getTagColor(tag);
              return (
                <span
                  key={`${project.slug}-${tag}`}
                  className={`px-3 py-1 text-xs font-semibold rounded ${colors.bg} ${colors.text}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>

          {/* Links */}
          {projectLinks.length > 0 && (
            <div className="flex flex-col gap-3 mb-8 md:flex-row md:gap-4">
              {projectLinks.map((link) => {
                const isGitHub = link.label.toLowerCase().includes('github');
                const isVisit = link.label.toLowerCase().includes('visit');
                return (
                  <a
                    key={`${project.slug}-${link.label}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2.5 flex items-center justify-center gap-2 rounded font-medium transition ${
                      isGitHub
                        ? isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                        : isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isGitHub && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 .5C5.648.5.5 5.648.5 12c0 5.086 3.292 9.396 7.86 10.93.574.106.786-.25.786-.554 0-.273-.01-1.004-.015-1.97-3.2.696-3.875-1.544-3.875-1.544-.523-1.33-1.277-1.684-1.277-1.684-1.043-.714.08-.7.08-.7 1.152.08 1.756 1.184 1.756 1.184 1.025 1.754 2.69 1.247 3.344.954.104-.743.4-1.247.727-1.534-2.553-.29-5.238-1.277-5.238-5.683 0-1.255.448-2.28 1.184-3.084-.12-.29-.512-1.457.112-3.037 0 0 .96-.307 3.144 1.176a10.94 10.94 0 0 1 5.728 0c2.184-1.483 3.144-1.176 3.144-1.176.624 1.58.232 2.747.112 3.037.736.804 1.184 1.83 1.184 3.084 0 4.417-2.69 5.39-5.252 5.673.408.352.776 1.048.776 2.112 0 1.526-.015 2.756-.015 3.13 0 .308.208.666.792.554C20.708 21.396 24 17.086 24 12 24 5.648 18.352.5 12 .5z" />
                      </svg>
                    )}
                    {isVisit && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    )}
                    {link.label}
                  </a>
                );
              })}
            </div>
          )}
        </article>

        {/* Project Updates/Blog Section */}
        {projectUpdates.length > 0 && (
          <section>
            <h2 className="mb-6 text-3xl font-bold">Project Updates</h2>

            {/* Latest Blog Post */}
            {contentHtml && projectUpdates[0] && (
              <article className={`rounded-xl border p-6 mb-8 ${cardClasses}`}>
                <h3 className="mb-2 text-2xl font-semibold">{projectUpdates[0].title}</h3>
                <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(projectUpdates[0].date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {projectUpdates[0].kind === 'release' && (
                  <p className="mb-4">
                    <a
                      href={projectUpdates[0].releaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-500 hover:underline"
                    >
                      View release on GitHub
                    </a>
                  </p>
                )}
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

            {/* All Project Blogs */}
            {projectUpdates.length > 1 && (
              <div>
                <h3 className="mb-4 text-xl font-semibold">All Updates</h3>
                <div className="grid gap-4">
                  {projectUpdates.slice(1).map((update) => (
                    <article
                      key={update.slug}
                      className={`rounded-xl border p-4 transition-shadow hover:shadow-lg ${cardClasses}`}
                    >
                      <p className={`mb-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(update.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <h4 className="mb-2 text-lg font-semibold">{update.title}</h4>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{update.description}</p>
                      {update.kind === 'release' && (
                        <a
                          href={update.releaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 font-semibold text-blue-500 hover:underline"
                        >
                          Open release notes
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
