import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
