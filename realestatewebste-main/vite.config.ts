import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  build: {
    // Increase chunk size warning limit (large images are expected)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor code into a separate chunk for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          icons:  ['lucide-react'],
        },
        // Consistent asset naming
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Enable source maps for production debugging
    sourcemap: false,
    // Minify with esbuild (faster than terser, default)
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2020',
    // CSS code splitting
    cssCodeSplit: true,
  },

  server: {
    port: 5173,
    open: true,
  },

  preview: {
    port: 4173,
  },
});
