import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/etl-admin': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8090/etl-admin',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
    fs: {
      strict: false,
    },
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8090/etl-admin'),
  },
})
