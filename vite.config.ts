import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-rss',
      apply: 'build',
      async closeBundle() {
        // @ts-ignore - ESM module without types
        const { generateRSSFile } = await import('./scripts/generate-rss.mjs')
        generateRSSFile()
      },
    },
  ],
})
