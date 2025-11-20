import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// لو كنت مركّب vite-plugin-mkcert علّقها مؤقتاً
// import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [react() /*, mkcert() */],
  server: {
    https: false,         // إجبار HTTP
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // خادم الـ API
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
