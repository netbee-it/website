import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'leaflet-vendor': ['leaflet', 'react-leaflet'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'icons-vendor': ['lucide-react'],
        },
      },
    },
  },
});
