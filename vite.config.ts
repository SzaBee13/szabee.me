import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

type AdminContentResponse = {
  blogs: Array<{
    slug: string
    title: string
    description: string
    date: string
    tags?: string[]
    content: string
  }>
  projects: Array<{
    title: string
    slug: string
    description: string
    tags: string[]
    links: Array<{ label: string; url: string }>
  }>
  classProjects: Array<{
    title: string
    slug: string
    description: string
    tags: string[]
    links: Array<{ label: string; url: string }>
  }>
}

type ProjectSection = 'projects' | 'classProjects'

type UpsertBlogPayload = {
  slug: string
  title: string
  description: string
  date: string
  tags?: string[]
  content?: string
}

type UpsertProjectPayload = {
  section: ProjectSection
  project: {
    title: string
    slug: string
    description: string
    tags?: string[]
    links?: Array<{ label: string; url: string }>
  }
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''

    req.on('data', (chunk) => {
      raw += String(chunk)
    })

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('Invalid JSON body.'))
      }
    })

    req.on('error', reject)
  })
}

function createAdminApiHandler(onMutate?: () => void) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const requestUrl = req.url ? new URL(req.url, 'http://localhost') : null
    const pathname = requestUrl?.pathname ?? ''
    if (!pathname.startsWith('/api/admin/')) {
      return false
    }

    try {
      // @ts-expect-error - ESM modules without type declarations
      const admin = await import('./scripts/content-admin.mjs')

      if (req.method === 'GET' && pathname === '/api/admin/content') {
        const content = admin.listAdminContent() as AdminContentResponse
        sendJson(res, 200, content)
        return true
      }

      if (req.method === 'POST' && pathname === '/api/admin/blogs/upsert') {
        const payload = (await parseBody(req)) as UpsertBlogPayload
        const result = admin.upsertBlog(payload)
        admin.syncContent()
        onMutate?.()
        sendJson(res, 200, result)
        return true
      }

      if (req.method === 'DELETE' && pathname.startsWith('/api/admin/blogs/')) {
        const slug = decodeURIComponent(pathname.replace('/api/admin/blogs/', ''))
        const result = admin.deleteBlog(slug)
        admin.syncContent()
        onMutate?.()
        sendJson(res, 200, result)
        return true
      }

      if (req.method === 'POST' && pathname === '/api/admin/projects/upsert') {
        const payload = (await parseBody(req)) as UpsertProjectPayload
        const result = admin.upsertProject(payload.section, payload.project)
        admin.syncContent()
        onMutate?.()
        sendJson(res, 200, result)
        return true
      }

      if (req.method === 'DELETE' && pathname.startsWith('/api/admin/projects/')) {
        const parts = pathname.split('/')
        const section = parts[4]
        const slug = parts[5]

        if ((section !== 'projects' && section !== 'classProjects') || !slug) {
          sendJson(res, 400, { error: 'Invalid section or slug.' })
          return true
        }

        const result = admin.deleteProject(section, decodeURIComponent(slug))
        admin.syncContent()
        onMutate?.()
        sendJson(res, 200, result)
        return true
      }

      if (req.method === 'POST' && pathname === '/api/admin/sync') {
        const result = admin.syncContent()
        onMutate?.()
        sendJson(res, 200, result)
        return true
      }

      sendJson(res, 404, { error: 'Admin endpoint not found.' })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.'
      sendJson(res, 500, { error: message })
      return true
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-api',
      apply: 'serve',
      configureServer(server) {
        const handler = createAdminApiHandler(() => {
          server.ws.send({ type: 'full-reload' })
        })

        server.middlewares.use((req, res, next) => {
          void handler(req, res).then((handled) => {
            if (!handled) {
              next()
            }
          })
        })
      },
      configurePreviewServer(server) {
        const handler = createAdminApiHandler()
        server.middlewares.use((req, res, next) => {
          void handler(req, res).then((handled) => {
            if (!handled) {
              next()
            }
          })
        })
      },
    },
    {
      name: 'generate-seo-files',
      apply: 'build',
      async closeBundle() {
        // @ts-expect-error - ESM module without types
        const { generateRSSFile } = await import('./scripts/generate-rss.mjs')
        // @ts-expect-error - ESM module without types
        const { generateSitemapFile } = await import('./scripts/generate-sitemap.mjs')
        generateRSSFile()
        generateSitemapFile()
      },
    },
  ],
})
