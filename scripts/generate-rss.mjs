import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://szabee.me';
const BLOGS_DIR = path.join(__dirname, '../src/assets/blogs');
const OUTPUT_DIR = path.join(__dirname, '../public');

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
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

function stripMarkdown(markdown) {
  return (
    markdown
      // Remove headings
      .replace(/^#{1,6}\s+(.+?)$/gm, '$1')
      // Remove bold and italic
      .replace(/[*_]{1,2}(.+?)[*_]{1,2}/g, '$1')
      // Remove links but keep text
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`(.+?)`/g, '$1')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function generateRSSFeed(blogs) {
  const lastBuildDate = new Date().toUTCString();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SzaBee13 Blog</title>
    <link>${SITE_URL}</link>
    <description>Personal blog by Szabolcs Győrffy (SzaBee13). Posts about development, coding, and technology.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${lastBuildDate}</pubDate>
`;

  blogs.forEach((blog) => {
    const pubDate = new Date(blog.date).toUTCString();
    const link = `${SITE_URL}/blog/${blog.slug}`;
    const guid = `${SITE_URL}/blog/${blog.slug}`;

    let contentHtml = escapeXml(stripMarkdown(blog.description));
    if (blog.tags && blog.tags.length > 0) {
      contentHtml += `\n\nTags: ${blog.tags.join(', ')}`;
    }

    rss += `
    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${contentHtml}</description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>`;

    if (blog.tags && blog.tags.length > 0) {
      blog.tags.forEach((tag) => {
        rss += `\n      <category>${escapeXml(tag)}</category>`;
      });
    }

    rss += `\n    </item>`;
  });

  rss += `
  </channel>
</rss>`;

  return rss;
}

export function generateRSSFile() {
  try {
    // Read the blogs metadata
    const blogsJsonPath = path.join(BLOGS_DIR, 'Blogs.json');
    const blogsJson = fs.readFileSync(blogsJsonPath, 'utf-8');
    const blogs = JSON.parse(blogsJson);

    // Sort by date descending
    blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generate RSS
    const rssFeed = generateRSSFeed(blogs);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write RSS feed
    const outputPath = path.join(OUTPUT_DIR, 'rss.xml');
    fs.writeFileSync(outputPath, rssFeed, 'utf-8');

    console.log(`✅ RSS feed generated: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating RSS feed:', error.message);
    process.exit(1);
  }
}

generateRSSFile();
