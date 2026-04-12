import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Navbar } from '../components/Navbar';
import Footer from '../components/Footer';
import { PageMeta } from '../components/PageMeta';

type OAuthUser = {
  uuid: string;
  email: string;
  display_name: string;
};

type BlogItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
  content: string;
};

type ProjectLink = {
  label: string;
  url: string;
};

type ProjectItem = {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  links: ProjectLink[];
};

type AdminContent = {
  blogs: BlogItem[];
  projects: ProjectItem[];
  classProjects: ProjectItem[];
};

const OAUTH_BASE = 'https://oauth.szabee.me';
const OWNER_UUID = '1d71a065-cb52-4f87-9d00-4e5240d8d017';
const OWNER_EMAIL = 'miabajodlol@gmail.com';

const LS_ACCESS_TOKEN = 'szabee.admin.access_token';
const LS_REFRESH_TOKEN = 'szabee.admin.refresh_token';

const PKCE_STATE_KEY = 'szabee.admin.oauth_state';
const PKCE_VERIFIER_KEY = 'szabee.admin.oauth_verifier';

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toTagString(tags: string[] | undefined): string {
  return (tags ?? []).join(', ');
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(new Uint8Array(digest));
}

function randomString(length = 64): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes).slice(0, length);
}

function initialBlog(): BlogItem {
  const today = new Date().toISOString().slice(0, 10);
  return {
    slug: '',
    title: '',
    description: '',
    date: today,
    tags: [],
    content: '',
  };
}

function initialProject(): ProjectItem {
  return {
    title: '',
    slug: '',
    description: '',
    tags: [],
    links: [{ label: 'GitHub', url: '' }],
  };
}

export default function AdminPage() {
  const { isDarkMode } = useTheme();

  const clientId = (import.meta.env.VITE_PUBLIC_SZABEE_OAUTH_CLIENT_ID
    ?? import.meta.env.VITE_SZABEE_OAUTH_CLIENT_ID
    ?? '') as string;

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState('');
  const [accessToken, setAccessToken] = useState<string>(() => localStorage.getItem(LS_ACCESS_TOKEN) ?? '');
  const [refreshToken, setRefreshToken] = useState<string>(() => localStorage.getItem(LS_REFRESH_TOKEN) ?? '');
  const [currentUser, setCurrentUser] = useState<OAuthUser | null>(null);

  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState('');
  const [content, setContent] = useState<AdminContent | null>(null);

  const [blogDraft, setBlogDraft] = useState<BlogItem>(initialBlog());
  const [selectedBlogSlug, setSelectedBlogSlug] = useState('');

  const [projectSection, setProjectSection] = useState<'projects' | 'classProjects'>('projects');
  const [projectDraft, setProjectDraft] = useState<ProjectItem>(initialProject());
  const [selectedProjectSlug, setSelectedProjectSlug] = useState('');

  const [saveStatus, setSaveStatus] = useState('');

  const panelClasses = isDarkMode
    ? 'bg-gray-900 text-white border-gray-700'
    : 'bg-white text-gray-900 border-gray-200';

  const cardClasses = isDarkMode
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-200 text-gray-900';

  const authorized = useMemo(() => {
    if (!currentUser) {
      return false;
    }

    return (
      currentUser.uuid.toLowerCase() === OWNER_UUID.toLowerCase()
      || currentUser.email.toLowerCase() === OWNER_EMAIL.toLowerCase()
    );
  }, [currentUser]);

  const projectsForSection = useMemo(() => {
    if (!content) {
      return [];
    }

    return projectSection === 'projects' ? content.projects : content.classProjects;
  }, [content, projectSection]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    void fetchCurrentUser(accessToken);
    // We intentionally hydrate once from persisted token on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void handleOAuthCallback();
    // Callback handling runs on mount and reads env-configured client ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    void loadAdminContent();
  }, [authorized]);

  async function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (!code && !error) {
      return;
    }

    if (error) {
      setAuthError(`OAuth failed: ${error}`);
      return;
    }

    const savedState = sessionStorage.getItem(PKCE_STATE_KEY);
    const savedVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);

    if (!state || !savedState || state !== savedState || !savedVerifier) {
      setAuthError('OAuth state verification failed. Please sign in again.');
      return;
    }

    if (!clientId.trim()) {
      setAuthError('Client ID is required for token exchange.');
      return;
    }

    setIsAuthorizing(true);
    setAuthError('');

    try {
      const redirectUri = `${window.location.origin}/admin`;
      const response = await fetch(`${OAUTH_BASE}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId.trim(),
          code_verifier: savedVerifier,
        }),
      });

      const payload = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        error?: string;
      };

      if (!response.ok || !payload.access_token) {
        throw new Error(payload.error ?? 'Token exchange failed.');
      }

      const nextAccessToken = payload.access_token;
      const nextRefreshToken = payload.refresh_token ?? '';

      localStorage.setItem(LS_ACCESS_TOKEN, nextAccessToken);
      localStorage.setItem(LS_REFRESH_TOKEN, nextRefreshToken);
      setAccessToken(nextAccessToken);
      setRefreshToken(nextRefreshToken);

      await fetchCurrentUser(nextAccessToken);

      params.delete('code');
      params.delete('state');
      params.delete('error');
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
      window.history.replaceState({}, '', nextUrl);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'OAuth flow failed.');
    } finally {
      setIsAuthorizing(false);
      sessionStorage.removeItem(PKCE_STATE_KEY);
      sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    }
  }

  async function fetchCurrentUser(token: string) {
    const response = await fetch(`${OAUTH_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      clearAuth();
      setAuthError('Access token is invalid or expired. Please sign in again.');
      return;
    }

    const user = (await response.json()) as OAuthUser;
    setCurrentUser(user);

    if (
      user.uuid.toLowerCase() !== OWNER_UUID.toLowerCase()
      && user.email.toLowerCase() !== OWNER_EMAIL.toLowerCase()
    ) {
      clearAuth();
      setAuthError('Authenticated, but this account is not allowed to access the admin panel.');
    }
  }

  function clearAuth() {
    localStorage.removeItem(LS_ACCESS_TOKEN);
    localStorage.removeItem(LS_REFRESH_TOKEN);
    setAccessToken('');
    setRefreshToken('');
    setCurrentUser(null);
  }

  async function startOAuthSignIn() {
    if (!clientId.trim()) {
      setAuthError('Set your OAuth client ID first.');
      return;
    }

    setAuthError('');
    setIsAuthorizing(true);

    try {
      const verifier = randomString(96);
      const challenge = await sha256(verifier);
      const state = randomString(36);
      const redirectUri = `${window.location.origin}/admin`;

      sessionStorage.setItem(PKCE_STATE_KEY, state);
      sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId.trim(),
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      });

      window.location.href = `${OAUTH_BASE}/oauth2/authorize?${params.toString()}`;
    } catch (error) {
      setIsAuthorizing(false);
      setAuthError(error instanceof Error ? error.message : 'Could not start sign in.');
    }
  }

  async function loadAdminContent() {
    setIsLoadingContent(true);
    setContentError('');

    try {
      const response = await fetch('/api/admin/content');
      const payload = (await response.json()) as AdminContent | { error: string };
      if (!response.ok || 'error' in payload) {
        throw new Error('error' in payload ? payload.error : 'Could not load admin content.');
      }

      setContent(payload);

      if (payload.blogs.length > 0) {
        setSelectedBlogSlug(payload.blogs[0].slug);
        setBlogDraft(payload.blogs[0]);
      } else {
        setSelectedBlogSlug('');
        setBlogDraft(initialBlog());
      }

      const firstProject = payload.projects[0] ?? payload.classProjects[0];
      if (firstProject) {
        setProjectSection(payload.projects[0] ? 'projects' : 'classProjects');
        setSelectedProjectSlug(firstProject.slug);
        setProjectDraft(firstProject);
      } else {
        setSelectedProjectSlug('');
        setProjectDraft(initialProject());
      }
    } catch (error) {
      setContentError(error instanceof Error ? error.message : 'Could not load content.');
    } finally {
      setIsLoadingContent(false);
    }
  }

  function selectBlog(slug: string) {
    if (!content) {
      return;
    }

    const item = content.blogs.find((blog) => blog.slug === slug);
    if (!item) {
      return;
    }

    setSelectedBlogSlug(slug);
    setBlogDraft(item);
  }

  function selectProject(slug: string) {
    const item = projectsForSection.find((project) => project.slug === slug);
    if (!item) {
      return;
    }

    setSelectedProjectSlug(slug);
    setProjectDraft(item);
  }

  async function saveBlog(event: FormEvent) {
    event.preventDefault();
    setSaveStatus('Saving blog...');

    try {
      const response = await fetch('/api/admin/blogs/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...blogDraft,
          slug: blogDraft.slug.trim().toLowerCase(),
          tags: blogDraft.tags ?? [],
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Could not save blog.');
      }

      await loadAdminContent();
      setSelectedBlogSlug(blogDraft.slug.trim().toLowerCase());
      setSaveStatus('Blog saved and RSS/sitemap synced.');
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Could not save blog.');
    }
  }

  async function removeBlog() {
    if (!selectedBlogSlug) {
      return;
    }

    if (!window.confirm(`Delete blog "${selectedBlogSlug}"?`)) {
      return;
    }

    setSaveStatus('Deleting blog...');

    try {
      const response = await fetch(`/api/admin/blogs/${encodeURIComponent(selectedBlogSlug)}`, {
        method: 'DELETE',
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Could not delete blog.');
      }

      await loadAdminContent();
      setSaveStatus('Blog deleted and RSS/sitemap synced.');
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Could not delete blog.');
    }
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault();
    setSaveStatus('Saving project...');

    try {
      const response = await fetch('/api/admin/projects/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: projectSection,
          project: {
            ...projectDraft,
            slug: projectDraft.slug.trim().toLowerCase(),
            tags: projectDraft.tags,
            links: projectDraft.links.filter((link) => link.label.trim() || link.url.trim()),
          },
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Could not save project.');
      }

      await loadAdminContent();
      setSelectedProjectSlug(projectDraft.slug.trim().toLowerCase());
      setSaveStatus('Project saved and sitemap synced.');
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Could not save project.');
    }
  }

  async function removeProject() {
    if (!selectedProjectSlug) {
      return;
    }

    if (!window.confirm(`Delete project "${selectedProjectSlug}" from ${projectSection}?`)) {
      return;
    }

    setSaveStatus('Deleting project...');

    try {
      const response = await fetch(
        `/api/admin/projects/${projectSection}/${encodeURIComponent(selectedProjectSlug)}`,
        { method: 'DELETE' },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Could not delete project.');
      }

      await loadAdminContent();
      setSaveStatus('Project deleted and sitemap synced.');
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Could not delete project.');
    }
  }

  async function manualSync() {
    setSaveStatus('Running sync...');
    try {
      const response = await fetch('/api/admin/sync', { method: 'POST' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Sync failed.');
      }
      setSaveStatus('RSS and sitemap synced.');
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Sync failed.');
    }
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <PageMeta
        title="Admin | SzaBee13"
        description="Private admin panel to manage blogs and projects."
        path="/admin"
        noIndex
      />
      <Navbar />

      <main className="max-w-7xl px-4 py-10 mx-auto pt-20">
        <section className={`rounded-2xl border p-5 ${panelClasses}`}>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Sign in with SzaBee OAuth. Access is restricted to your UUID/email.
          </p>

          <div className="grid gap-4 mt-6">
            <p className={`rounded-lg border px-3 py-2 text-sm ${cardClasses}`}>
              OAuth client ID source: <strong>.env</strong> via VITE_PUBLIC_SZABEE_OAUTH_CLIENT_ID
            </p>
            {!currentUser ? (
              <button
                type="button"
                onClick={() => {
                  void startOAuthSignIn();
                }}
                className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg h-fit mt-7 hover:bg-blue-500 disabled:opacity-60"
                disabled={isAuthorizing}
              >
                {isAuthorizing ? 'Signing In...' : 'Sign In with SzaBee OAuth'}
              </button>
            ) : (
              <button
                type="button"
                onClick={clearAuth}
                className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg h-fit mt-7 hover:bg-red-500"
              >
                Sign Out
              </button>
            )}
          </div>

          {!!currentUser && (
            <div className={`mt-4 rounded-lg border p-3 ${cardClasses}`}>
              <p>
                Signed in as <strong>{currentUser.display_name}</strong> ({currentUser.email})
              </p>
              <p className="text-sm opacity-80">UUID: {currentUser.uuid}</p>
              {!!refreshToken && <p className="text-sm opacity-80">Refresh token stored.</p>}
            </div>
          )}

          {!!authError && <p className="mt-4 font-semibold text-red-400">{authError}</p>}
        </section>

        {authorized && (
          <section className="grid gap-6 mt-8 lg:grid-cols-2">
            <article className={`rounded-2xl border p-5 ${panelClasses}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">Blogs</h2>
                <button
                  type="button"
                  className="px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
                  onClick={() => {
                    const fresh = initialBlog();
                    setSelectedBlogSlug('');
                    setBlogDraft(fresh);
                  }}
                >
                  New Blog
                </button>
              </div>

              <div className="grid gap-3 mt-4">
                <label className="block">
                  <span className="text-sm font-semibold">Existing Blog</span>
                  <select
                    value={selectedBlogSlug}
                    onChange={(event) => selectBlog(event.target.value)}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 ${cardClasses}`}
                  >
                    <option value="">Select blog...</option>
                    {(content?.blogs ?? []).map((blog) => (
                      <option key={blog.slug} value={blog.slug}>{blog.title} ({blog.slug})</option>
                    ))}
                  </select>
                </label>
              </div>

              <form className="grid gap-3 mt-4" onSubmit={saveBlog}>
                <input
                  value={blogDraft.title}
                  onChange={(event) => setBlogDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Title"
                  className={`rounded-lg border px-3 py-2 ${cardClasses}`}
                  required
                />
                <input
                  value={blogDraft.slug}
                  onChange={(event) => setBlogDraft((prev) => ({ ...prev, slug: event.target.value }))}
                  placeholder="slug-like-this"
                  className={`rounded-lg border px-3 py-2 ${cardClasses}`}
                  required
                />
                <input
                  value={blogDraft.description}
                  onChange={(event) => setBlogDraft((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Description"
                  className={`rounded-lg border px-3 py-2 ${cardClasses}`}
                  required
                />
                <input
                  type="date"
                  value={blogDraft.date}
                  onChange={(event) => setBlogDraft((prev) => ({ ...prev, date: event.target.value }))}
                  className={`rounded-lg border px-3 py-2 ${cardClasses}`}
                  required
                />
                <input
                  value={toTagString(blogDraft.tags)}
                  onChange={(event) => setBlogDraft((prev) => ({ ...prev, tags: parseTags(event.target.value) }))}
                  placeholder="tags, separated, by, commas"
                  className={`rounded-lg border px-3 py-2 ${cardClasses}`}
                />
                <textarea
                  value={blogDraft.content}
                  onChange={(event) => setBlogDraft((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="Markdown content"
                  className={`min-h-64 rounded-lg border px-3 py-2 font-mono text-sm ${cardClasses}`}
                />

                <div className="flex gap-3">
                  <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500" type="submit">
                    Save Blog
                  </button>
                  <button
                    className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50"
                    type="button"
                    onClick={() => {
                      void removeBlog();
                    }}
                    disabled={!selectedBlogSlug}
                  >
                    Delete Blog
                  </button>
                </div>
              </form>
            </article>

            <article className={`rounded-2xl border p-5 ${panelClasses}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">Projects</h2>
                <button
                  type="button"
                  className="px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
                  onClick={() => {
                    setSelectedProjectSlug('');
                    setProjectDraft(initialProject());
                  }}
                >
                  New Project
                </button>
              </div>

              <div className="grid gap-3 mt-4">
                <label className="block">
                  <span className="text-sm font-semibold">Section</span>
                  <select
                    value={projectSection}
                    onChange={(event) => {
                      const next = event.target.value as 'projects' | 'classProjects';
                      setProjectSection(next);
                      const first = next === 'projects' ? content?.projects[0] : content?.classProjects[0];
                      if (first) {
                        setSelectedProjectSlug(first.slug);
                        setProjectDraft(first);
                      } else {
                        setSelectedProjectSlug('');
                        setProjectDraft(initialProject());
                      }
                    }}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 ${cardClasses}`}
                  >
                    <option value="projects">projects</option>
                    <option value="classProjects">classProjects</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">Existing Project</span>
                  <select
                    value={selectedProjectSlug}
                    onChange={(event) => selectProject(event.target.value)}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 ${cardClasses}`}
                  >
                    <option value="">Select project...</option>
                    {projectsForSection.map((project) => (
                      <option key={project.slug} value={project.slug}>{project.title} ({project.slug})</option>
                    ))}
                  </select>
                </label>
              </div>

              <form className="grid gap-3 mt-4" onSubmit={saveProject}>
                <input
                  value={projectDraft.title}
                  onChange={(event) => setProjectDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Project title"
                  className={`rounded-lg border px-3 py-2 ${cardClasses}`}
                  required
                />
                <input
                  value={projectDraft.slug}
                  onChange={(event) => setProjectDraft((prev) => ({ ...prev, slug: event.target.value }))}
                  placeholder="project-slug"
                  className={`rounded-lg border px-3 py-2 ${cardClasses}`}
                  required
                />
                <textarea
                  value={projectDraft.description}
                  onChange={(event) => setProjectDraft((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Project description"
                  className={`min-h-28 rounded-lg border px-3 py-2 ${cardClasses}`}
                  required
                />
                <input
                  value={projectDraft.tags.join(', ')}
                  onChange={(event) => setProjectDraft((prev) => ({ ...prev, tags: parseTags(event.target.value) }))}
                  placeholder="tags, separated, by, commas"
                  className={`rounded-lg border px-3 py-2 ${cardClasses}`}
                />

                <div className="grid gap-2">
                  <p className="text-sm font-semibold">Links</p>
                  {projectDraft.links.map((link, index) => (
                    <div key={`${index}-${link.label}`} className="grid gap-2 md:grid-cols-[1fr,2fr,auto]">
                      <input
                        value={link.label}
                        onChange={(event) => {
                          const next = [...projectDraft.links];
                          next[index] = { ...next[index], label: event.target.value };
                          setProjectDraft((prev) => ({ ...prev, links: next }));
                        }}
                        placeholder="Label"
                        className={`rounded-lg border px-3 py-2 ${cardClasses}`}
                      />
                      <input
                        value={link.url}
                        onChange={(event) => {
                          const next = [...projectDraft.links];
                          next[index] = { ...next[index], url: event.target.value };
                          setProjectDraft((prev) => ({ ...prev, links: next }));
                        }}
                        placeholder="https://..."
                        className={`rounded-lg border px-3 py-2 ${cardClasses}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = projectDraft.links.filter((_, currentIndex) => currentIndex !== index);
                          setProjectDraft((prev) => ({ ...prev, links: next.length > 0 ? next : [{ label: '', url: '' }] }));
                        }}
                        className="px-3 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="px-3 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 w-fit"
                    onClick={() => {
                      setProjectDraft((prev) => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }));
                    }}
                  >
                    Add Link
                  </button>
                </div>

                <div className="flex gap-3">
                  <button className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500" type="submit">
                    Save Project
                  </button>
                  <button
                    className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50"
                    type="button"
                    onClick={() => {
                      void removeProject();
                    }}
                    disabled={!selectedProjectSlug}
                  >
                    Delete Project
                  </button>
                </div>
              </form>
            </article>
          </section>
        )}

        {authorized && (
          <section className={`rounded-2xl border p-5 mt-6 ${panelClasses}`}>
            <h2 className="text-xl font-semibold">Publish Sync</h2>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Saves already trigger sync automatically, but you can run it manually too.
            </p>
            <button
              type="button"
              className="px-4 py-2 mt-4 font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
              onClick={() => {
                void manualSync();
              }}
            >
              Sync RSS + Sitemap
            </button>
          </section>
        )}

        {isLoadingContent && <p className="mt-4">Loading content...</p>}
        {!!contentError && <p className="mt-4 font-semibold text-red-400">{contentError}</p>}
        {!!saveStatus && <p className="mt-4 font-semibold text-emerald-400">{saveStatus}</p>}
      </main>

      <Footer />
    </div>
  );
}
