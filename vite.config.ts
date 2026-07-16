import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { normalizePresencePayload } from './src/lib/presence'
import tailwindcss from '@tailwindcss/vite'

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

type OAuthUser = {
  uuid: string
  email: string
}

const OAUTH_BASE = 'https://oauth.szabee.me'
const OWNER_UUID = '1d71a065-cb52-4f87-9d00-4e5240d8d017'
const OWNER_EMAIL = 'miabajodlol@gmail.com'

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

function extractBearer(req: IncomingMessage): string | null {
  const header = req.headers.authorization
  if (!header) {
    return null
  }

  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

async function validateOwner(token: string) {
  const response = await fetch(`${OAUTH_BASE}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Access token is invalid or expired.')
  }

  const user = (await response.json()) as OAuthUser
  const isOwner =
    user.uuid.toLowerCase() === OWNER_UUID.toLowerCase()
    || user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()

  if (!isOwner) {
    throw new Error('Authenticated account is not allowed to publish presence.')
  }
}

function createPresenceApiHandler() {
  let latestPresence: unknown = null

  return async (req: IncomingMessage, res: ServerResponse) => {
    const requestUrl = req.url ? new URL(req.url, 'http://localhost') : null
    const pathname = requestUrl?.pathname ?? ''
    if (pathname !== '/api/presence') {
      return false
    }

    if (req.method === 'GET') {
      sendJson(res, 200, normalizePresencePayload(latestPresence))
      return true
    }

    if (req.method !== 'POST') {
      res.setHeader('allow', 'GET, POST')
      sendJson(res, 405, { error: 'Method not allowed.' })
      return true
    }

    const token = extractBearer(req)
    if (!token) {
      sendJson(res, 401, { error: 'Missing bearer token.' })
      return true
    }

    try {
      await validateOwner(token)
      const body = await parseBody(req)
      latestPresence = {
        ...(typeof body === 'object' && body !== null ? body : {}),
        updatedAt: new Date().toISOString(),
      }
      sendJson(res, 200, { ok: true, presence: normalizePresencePayload(latestPresence) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update presence.'
      const status = message.includes('not allowed') ? 403 : message.includes('token') ? 401 : 400
      sendJson(res, status, { error: message })
    }

    return true
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), tailwindcss(),
    {
      name: 'admin-api',
      enforce: 'pre',
      apply: 'serve',
      configureServer(server) {
        const handler = createAdminApiHandler(() => {
          server.ws.send({ type: 'full-reload' })
        })
        const presenceHandler = createPresenceApiHandler()

        server.middlewares.use((req, res, next) => {
          void presenceHandler(req, res).then((handled) => {
            if (handled) {
              return
            }

            return handler(req, res)
          }).then((handled) => {
            if (!handled) {
              next()
            }
          })
        })
      },
      configurePreviewServer(server) {
        const handler = createAdminApiHandler()
        const presenceHandler = createPresenceApiHandler()
        server.middlewares.use((req, res, next) => {
          void presenceHandler(req, res).then((handled) => {
            if (handled) {
              return
            }

            return handler(req, res)
          }).then((handled) => {
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
