// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/www/**",
      "**/node_modules/**",
      "**/.stencil/**",
      "**/loader/**",
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  ...storybook.configs["flat/recommended"],

  {
    files: ["**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^h$",
        },
      ],
    },
  },
];