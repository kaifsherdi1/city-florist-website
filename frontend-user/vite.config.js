import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the PHP backend runs on :8000 (php -S 127.0.0.1:8000 backend/dev-router.php).
const backend = 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/uploads': backend,
      '/admin': backend,
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber'],
          motion: ['gsap', '@gsap/react', 'lenis'],
        },
      },
    },
  },
});
