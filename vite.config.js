import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Enable access from network
    port: 5173,
    strictPort: false, // Try different ports if 5173 is occupied
  },
})
