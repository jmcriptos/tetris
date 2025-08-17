import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ Cambia esto al nombre EXACTO de tu repo en GitHub Pages, p.ej. "/tetris-modern/"
const repoBase = "/tetris/";

export default defineConfig({
  plugins: [react()],
  base: repoBase,
})
