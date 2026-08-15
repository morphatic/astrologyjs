import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

// Uses ESLint core's `defineConfig` rather than `tseslint.config()`, which
// typescript-eslint deprecated in favour of it.
export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', 'docs/**', 'coverage/**', '.features-gen/**']),
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // eslint.config.js is not in tsconfig's `include` (it is not library
          // source), but the type-aware rules still need a program for it.
          allowDefaultProject: ['eslint.config.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'warn',
      // Standards: named exports only (plinth/coding-standards-typescript.md).
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Named exports only — see plinth/coding-standards-typescript.md.',
        },
      ],
    },
  },
  {
    // Config files legitimately default-export; that is the contract their
    // tooling expects.
    files: ['*.config.ts', '*.config.js', 'eslint.config.js'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  eslintConfigPrettier,
]);
