import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The API lives on another origin in development. Proxying `/api` here means the
// client can use one relative base URL everywhere: no host names in the source,
// and the production build works unchanged behind any reverse proxy.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
