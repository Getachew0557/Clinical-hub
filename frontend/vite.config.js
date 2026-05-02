import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Increase chunk size warning limit to suppress false-positive warnings
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        // Manual chunking to split large vendor bundles
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['axios', 'date-fns', 'framer-motion'],
          'vendor-supabase': ['@supabase/supabase-js'],
        }
      }
    }
  },
  // Ensure consistent module resolution
  resolve: {
    dedupe: ['react', 'react-dom']
  }
})
