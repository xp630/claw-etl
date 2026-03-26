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
    },
    fs: {
      strict: false,
    },
  },
  optimizeDeps: {
    include: ['react-grid-layout', 'antd'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
