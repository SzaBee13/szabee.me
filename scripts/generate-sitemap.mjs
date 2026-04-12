import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://szabee.me';
const OUTPUT_DIR = path.join(__dirname, '../public');
const BLOGS_JSON_PATH = path.join(__dirname, '../src/assets/blogs/Blogs.json');
const PROJECTS_JSON_PATH = path.join(__dirname, '../src/assets/projects.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'\"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function toLastMod(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function buildUrl(loc, lastmod, changefreq, priority) {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

export function generateSitemapFile() {
  try {
    const now = new Date().toISOString().slice(0, 10);
    const blogs = readJson(BLOGS_JSON_PATH);
    const projectsData = readJson(PROJECTS_JSON_PATH);

    const projectSlugs = [
      ...(projectsData.projects ?? []).map((project) => project.slug),
      ...(projectsData.classProjects ?? []).map((project) => project.slug),
    ];

    const urls = [
      buildUrl(`${SITE_URL}/`, now, 'weekly', '1.0'),
      buildUrl(`${SITE_URL}/projects`, now, 'weekly', '0.9'),
      buildUrl(`${SITE_URL}/projects/class`, now, 'monthly', '0.8'),
      buildUrl(`${SITE_URL}/blogs`, now, 'weekly', '0.9'),
    ];

    for (const blog of blogs) {
      urls.push(buildUrl(`${SITE_URL}/blogs/${blog.slug}`, toLastMod(blog.date), 'monthly', '0.7'));
    }

    for (const slug of projectSlugs) {
      urls.push(buildUrl(`${SITE_URL}/projects/${slug}`, now, 'monthly', '0.7'));
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const outputPath = path.join(OUTPUT_DIR, 'sitemap.xml');
    fs.writeFileSync(outputPath, sitemap, 'utf-8');
    console.log(`✅ Sitemap generated: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSitemapFile();
}
