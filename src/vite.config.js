// vite.config.ts or vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/movieme/', // <-- Your repo name here (must match GitHub!)
  plugins: [react()],
})
