import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration.
 *
 * The API lives on another origin in development. Proxying `/api` here means the
 * client can use one relative base URL everywhere: no host names in the source,
 * and the production build works unchanged behind any reverse proxy.
 *
 * `API_PROXY_TARGET` may come from the shell or from an `.env` file; reading it
 * through `loadEnv` keeps this config free of Node globals.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'API_PROXY_TARGET');
  const proxyTarget = env.API_PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
