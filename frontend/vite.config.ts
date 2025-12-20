import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: false,
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['@mui/x-date-pickers', '@mui/x-date-pickers-pro'],
  },
  build: {
    sourcemap: true, // Enable source maps for debugging
    minify: 'terser', // Use terser for minification
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      }
    }
  },
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // API gateway port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Strip /api prefix
      },
    },
  },
});
