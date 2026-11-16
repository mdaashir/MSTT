import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

/**
 * Single source of configuration truth.
 *
 * Everything is parsed once at import time through zod, so a typo in `.env`
 * fails loudly at boot instead of silently producing `undefined` deeper in a
 * request handler. Defaults are declared here and nowhere else: no module
 * should read `process.env` directly.
 */

// Resolve relative paths against the package root, not the CWD, so `npm start`
// from anywhere behaves the same as `npm run dev` inside `backend/`.
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// `.env` is optional; missing values simply fall through to the defaults below.
loadDotenv({ path: path.join(packageRoot, '.env') });

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  // Relative database paths are relative to the backend package root. Tests pass
  // ':memory:' to get an isolated database per suite.
  databasePath: z.string().min(1).default('data/tickets.db'),
  corsOrigin: z.string().min(1).default('http://localhost:5173'),
});

const parsed = configSchema.safeParse({
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  databasePath: process.env.DATABASE_PATH,
  corsOrigin: process.env.CORS_ORIGIN,
});

if (!parsed.success) {
  // Print the offending keys, never the whole environment.
  const issues = parsed.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid configuration:\n${issues.join('\n')}`);
}

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  /** Absolute path to the SQLite file, or ':memory:' for tests. */
  databasePath: string;
  corsOrigin: string;
};

export const config: AppConfig = {
  ...parsed.data,
  databasePath:
    parsed.data.databasePath === ':memory:'
      ? parsed.data.databasePath
      : path.resolve(packageRoot, parsed.data.databasePath),
};

export const packageRootDir = packageRoot;
