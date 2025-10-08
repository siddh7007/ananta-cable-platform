import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import path from "path";

export default defineConfig({
  plugins: [svelte({ preprocess: sveltePreprocess() })],
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib')
    }
  },
  server: { host: true, port: 5173 }
});