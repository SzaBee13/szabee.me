import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateRSSFile } from './generate-rss.mjs';
import { generateSitemapFile } from './generate-sitemap.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BLOGS_DIR = path.join(ROOT_DIR, 'src/assets/blogs');
const BLOGS_JSON_PATH = path.join(BLOGS_DIR, 'Blogs.json');
const PROJECTS_JSON_PATH = path.join(ROOT_DIR, 'src/assets/projects.json');

function ensureSlug(slug) {
  if (typeof slug !== 'string') {
    throw new Error('Slug must be a string.');
  }

  const normalized = slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new Error('Slug must be lowercase words separated by dashes.');
  }

  return normalized;
}

function ensureString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
  return value.trim();
}

function ensureDateString(value) {
  const normalized = ensureString(value, 'Date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error('Date must use YYYY-MM-DD format.');
  }
  return normalized;
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function blogMarkdownPath(slug) {
  return path.join(BLOGS_DIR, `${slug}.md`);
}

export function listAdminContent() {
  const blogsMeta = readJson(BLOGS_JSON_PATH);
  const blogs = blogsMeta.map((entry) => {
    const markdownPath = blogMarkdownPath(entry.slug);
    const content = fs.existsSync(markdownPath) ? fs.readFileSync(markdownPath, 'utf-8') : '';

    return {
      ...entry,
      content,
    };
  });

  const projectsData = readJson(PROJECTS_JSON_PATH);

  return {
    blogs,
    projects: projectsData.projects ?? [],
    classProjects: projectsData.classProjects ?? [],
  };
}

export function upsertBlog(payload) {
  const slug = ensureSlug(payload.slug);
  const title = ensureString(payload.title, 'Title');
  const description = ensureString(payload.description, 'Description');
  const date = ensureDateString(payload.date);
  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((tag) => ensureString(String(tag), 'Tag'))
    : [];
  const content = typeof payload.content === 'string' ? payload.content : '';

  const blogs = readJson(BLOGS_JSON_PATH);
  const blogMeta = { slug, title, description, date, tags };

  const existingIndex = blogs.findIndex((item) => item.slug === slug);
  if (existingIndex >= 0) {
    blogs[existingIndex] = blogMeta;
  } else {
    blogs.push(blogMeta);
  }

  blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  writeJson(BLOGS_JSON_PATH, blogs);

  fs.writeFileSync(blogMarkdownPath(slug), content, 'utf-8');

  return { ok: true, blog: blogMeta };
}

export function deleteBlog(slugInput) {
  const slug = ensureSlug(slugInput);
  const blogs = readJson(BLOGS_JSON_PATH);
  const nextBlogs = blogs.filter((item) => item.slug !== slug);
  if (nextBlogs.length === blogs.length) {
    throw new Error('Blog not found.');
  }

  writeJson(BLOGS_JSON_PATH, nextBlogs);

  const markdownPath = blogMarkdownPath(slug);
  if (fs.existsSync(markdownPath)) {
    fs.unlinkSync(markdownPath);
  }

  return { ok: true };
}

function normalizeProject(project) {
  const title = ensureString(project.title, 'Project title');
  const slug = ensureSlug(project.slug);
  const description = ensureString(project.description, 'Project description');

  const tags = Array.isArray(project.tags)
    ? project.tags.map((tag) => ensureString(String(tag), 'Project tag'))
    : [];

  const links = Array.isArray(project.links)
    ? project.links
        .map((link) => ({
          label: ensureString(link.label, 'Project link label'),
          url: ensureString(link.url, 'Project link url'),
        }))
        .filter((link) => link.label && link.url)
    : [];

  return {
    title,
    slug,
    description,
    tags,
    links,
  };
}

export function upsertProject(section, payload) {
  if (section !== 'projects' && section !== 'classProjects') {
    throw new Error('Section must be either projects or classProjects.');
  }

  const normalized = normalizeProject(payload);
  const projectsData = readJson(PROJECTS_JSON_PATH);
  const list = Array.isArray(projectsData[section]) ? projectsData[section] : [];

  const existingIndex = list.findIndex((item) => item.slug === normalized.slug);
  if (existingIndex >= 0) {
    list[existingIndex] = normalized;
  } else {
    list.push(normalized);
  }

  projectsData[section] = list;
  writeJson(PROJECTS_JSON_PATH, projectsData);

  return { ok: true, project: normalized };
}

export function deleteProject(section, slugInput) {
  if (section !== 'projects' && section !== 'classProjects') {
    throw new Error('Section must be either projects or classProjects.');
  }

  const slug = ensureSlug(slugInput);
  const projectsData = readJson(PROJECTS_JSON_PATH);
  const list = Array.isArray(projectsData[section]) ? projectsData[section] : [];
  const nextList = list.filter((item) => item.slug !== slug);

  if (nextList.length === list.length) {
    throw new Error('Project not found.');
  }

  projectsData[section] = nextList;
  writeJson(PROJECTS_JSON_PATH, projectsData);

  return { ok: true };
}

export function syncContent() {
  generateRSSFile();
  generateSitemapFile();
  return { ok: true };
}
