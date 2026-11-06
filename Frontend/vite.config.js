import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'API_')
  const target = process.env.API_PROXY_TARGET || env.API_PROXY_TARGET || 'http://localhost:3000'
  const proxy = { '/api': { target } }
  return {
    plugins: [react()],
    cacheDir: process.env.FRONTEND_CACHE_DIR || 'node_modules/.vite',
    // Sender API-kall videre til Payload-backenden, så vi slipper CORS
    server: {
      proxy,
    },
    preview: { proxy },
  }
})
