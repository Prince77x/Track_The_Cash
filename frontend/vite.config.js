import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/predict': 'http://localhost:8000',
      '/heatmap': 'http://localhost:8000',
      '/alerts': 'http://localhost:8000',
      '/analytics': 'http://localhost:8000',
      '/reports': 'http://localhost:8000',
      '/simulation': 'http://localhost:8000',
      '/complaints': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      '/citizen': 'http://localhost:8000',
      '/health': 'http://localhost:8000'
    }
  }
})
