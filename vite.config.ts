import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/etl-admin': {
        target: 'http://139.9.200.56:8090',
        changeOrigin: true,
      },
    },
  },
})
