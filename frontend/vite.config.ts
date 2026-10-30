import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const api = 'http://localhost:3000'
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/city': api, '/state': api, '/time': api, '/health': api } },
})
