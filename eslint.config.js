import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['**/dist/**', '**/www/**', '**/node_modules/**', '**/.stencil/**'],
  },
];