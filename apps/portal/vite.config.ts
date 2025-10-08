import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  
  server: { 
    host: true, 
    port: 5173 
  },
  
  // Optimize workspace dependencies
  optimizeDeps: {
    include: [
      '@cable-platform/client-sdk',
      '@cable-platform/contracts',
      '@cable-platform/validation'
    ]
  }
});