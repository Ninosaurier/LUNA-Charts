import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import json from '@rollup/plugin-json';
import autoPreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

const packageJson = require("./package.json");
const name = packageJson.name;

export default {
  input: "src/index.tsx",
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: false,
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: false,
    },
    {
      file: packageJson.main.replace(".js", ".min.js"),
      format: "iife",
      name,
      plugins: [terser()],
    },
  ],
  plugins: [
    json({ compact: true }),
    svelte({
      preprocess: autoPreprocess(),
    }),
    resolve(),
    peerDepsExternal(),
    nodeResolve(),
    typescript({ sourceMap: true, rootDir: "./src" }),
    postcss({
      extensions: [".css"],
    }),
  ],
};
