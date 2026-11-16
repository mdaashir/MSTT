import tseslint from 'typescript-eslint';

// Same shape as the backend config. React-specific lint plugins are not worth the
// dependency weight here: the UI is small, and the type checker already catches the
// mistakes that matter for these components.
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'eslint.config.js'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
