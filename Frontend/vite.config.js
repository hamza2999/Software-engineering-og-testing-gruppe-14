import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Sender API-kall videre til Payload-backenden, så vi slipper CORS
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
