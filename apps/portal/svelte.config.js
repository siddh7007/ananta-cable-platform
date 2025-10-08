import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Preprocess with vite (handles TypeScript, PostCSS, etc.)
  preprocess: vitePreprocess(),
  
  kit: {
    // Node.js adapter for SSR
    adapter: adapter({
      out: 'build',
      precompress: false,
      envPrefix: ''
    }),
    
    // Path aliases (matching current setup)
    alias: {
      '$lib': './src/lib',
      '$lib/*': './src/lib/*'
    },
    
    // Environment variables configuration
    env: {
      publicPrefix: 'PUBLIC_'
    }
  }
};

export default config;
