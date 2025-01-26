import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    plugins: {
      prettier: prettier,
      import: importPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      'prefer-arrow-callback': 'error',
      'func-style': ['error', 'expression'],
      'no-inferrable-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
        },
      ],
      // Enforce named exports except for specific patterns
      'import/prefer-default-export': 'off',
      'import/no-default-export': [
        'error',
        {
          exceptions: [
            '**/*.config.ts',
            '**/*.config.js',
            '**/*.config.mjs',
          ],
        },
      ],
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      'dist',
      'eslint.config.js',
      'esbuild.config.js',
    ],
  },
);
