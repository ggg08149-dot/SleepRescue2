import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: /\.(js|jsx)$/
    })
  ],
  server: {
    port: 5000,
    proxy: {
      '/api': 'http://localhost:7000'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  }
})
