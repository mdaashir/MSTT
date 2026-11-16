import tseslint from 'typescript-eslint';

// Flat config. `recommended` already enables the TypeScript parser and the rules
// that catch real bugs; anything stylistic is left to Prettier so the two tools
// never disagree about formatting.
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'eslint.config.js'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // The repository layer is the only place allowed to talk to SQLite, and the
      // service layer is where errors get shaped. `any` would erase that contract.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
