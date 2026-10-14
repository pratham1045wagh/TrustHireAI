import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function servePublicVadPlugin() {
  return {
    name: 'serve-public-vad',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const clean = (req.url || '').split('?')[0];
        if (clean.startsWith('/vad/') && clean.endsWith('.mjs')) {
          const filePath = path.join(__dirname, 'public', clean);
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/javascript');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
            return fs.createReadStream(filePath).pipe(res);
          }
        }
        next();
      });
    },
    configurePreviewServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const clean = (req.url || '').split('?')[0];
        if (clean.startsWith('/vad/') && clean.endsWith('.mjs')) {
          const distPath = path.join(__dirname, 'dist', clean);
          const publicPath = path.join(__dirname, 'public', clean);
          const filePath = fs.existsSync(distPath) ? distPath : publicPath;
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/javascript');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
            return fs.createReadStream(filePath).pipe(res);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), servePublicVadPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
});
