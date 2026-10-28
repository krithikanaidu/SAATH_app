import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// SAATH PWA — Vite + React + Tailwind v4
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Supabase is heavy and changes rarely — split it into its own chunk so
        // it is cached separately and the app shell stays small on first load.
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) return 'supabase'
          if (id.includes('node_modules/react')) return 'react'
        },
      },
    },
    // The supabase + react vendor chunks legitimately exceed 500 kB combined;
    // the app's own code is well under it.
    chunkSizeWarningLimit: 900,
  },
})
