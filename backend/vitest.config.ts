import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The API tests build an app against an in-memory SQLite database, so they
    // need the Node environment and must not share state between files.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    isolate: true,
  },
});
