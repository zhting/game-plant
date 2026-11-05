import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: `npm run studio:dev` serves the UI on :5173 and proxies the backend (npm start on :3000).
const backend = process.env.STUDIO_BACKEND || 'http://localhost:3000';
export default defineConfig({
  base: '/studio/',
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(['/api', '/play', '/games', '/assets', '/backend-config.js'].map(p => [p, { target: backend, ws: p === '/games' }])),
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
