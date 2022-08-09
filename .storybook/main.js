module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx|svelte)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions"
  ],
  "framework": "@storybook/svelte",
  "core": {
    "builder": "@storybook/builder-webpack5"
  },
  "svelteOptions": {
    "preprocess": require("svelte-preprocess")()
  }
}