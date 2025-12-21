import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite pour le frontend DGI-NetWatch
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
