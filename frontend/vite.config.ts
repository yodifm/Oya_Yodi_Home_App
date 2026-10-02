import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    strictPort: true,
    // Forward API calls to the Laravel dev server (php artisan serve).
    // API_PROXY_TARGET lets a second stack (e.g. for testing) point elsewhere.
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:8010',
    },
  },
})
