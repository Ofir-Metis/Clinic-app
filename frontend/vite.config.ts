import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

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
    sourcemap: false, // Disable source maps in production
    minify: 'terser', // Use terser for minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
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
    https: (() => {
      const sslKeyPath = path.resolve(__dirname, 'ssl/key.pem');
      const sslCertPath = path.resolve(__dirname, 'ssl/cert.pem');
      return fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)
        ? { key: fs.readFileSync(sslKeyPath), cert: fs.readFileSync(sslCertPath) }
        : undefined;
    })(),
  },
});
