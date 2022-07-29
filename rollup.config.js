import svelte from "rollup-plugin-svelte";
import resolve from "rollup-plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import json from "@rollup/plugin-json";
import autoPreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';

const pkg = require("./package.json");

export default {
  input: "src/index.tsx",
  output: [
    {
      file: pkg.main,
      format: "cjs",
      sourcemap: false,
    },
    {
      file: pkg.module,
      format: "esm",
      sourcemap: false,
    },
  ],
  plugins: [
    json({ compact: true }),
    svelte({
      preprocess: autoPreprocess(),
    }),
    resolve(),
    typescript({ sourceMap: true }),
    peerDepsExternal(),
    postcss({
      extensions: [".css"],
    }),
  ],
};
