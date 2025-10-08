<script lang="ts">
  import { onMount } from 'svelte';
  import { route } from './lib/router.js';
  import Nav from './lib/components/Nav.svelte';
  import Home from './routes/Home.svelte';
  import DRC from './routes/DRC.svelte';
  import Synthesis from './routes/Synthesis.svelte';
  import SynthesisReview from './routes/assemblies/synthesis/+page.svelte';

  let currentRoute = { path: '/', params: {} };
  let mainHeading: HTMLElement;

  // Subscribe to route changes
  const unsubscribe = route.subscribe((r) => {
    currentRoute = r;
    // Focus main heading for accessibility on route change
    if (mainHeading) {
      mainHeading.focus();
    }
  });

  onMount(() => {
    // Set initial page title
    updateTitle(currentRoute.path);
  });

  // Update page title based on route
  function updateTitle(path: string) {
    const titles = {
      '/': 'Home - Cable Platform Portal',
      '/drc': 'DRC - Cable Platform Portal',
      '/synthesis': 'Synthesis Review - Cable Platform Portal',
      '/assemblies/synthesis': 'Synthesis Review - Cable Platform Portal',
    };
    document.title = titles[path as keyof typeof titles] || 'Cable Platform Portal';
  }

  // Update title when route changes
  $: updateTitle(currentRoute.path);

  // Cleanup subscription on destroy
  import { onDestroy } from 'svelte';
  onDestroy(unsubscribe);
</script>

<div>
  <Nav />

  {#if currentRoute.path === '/'}
    <Home bind:mainHeading />
  {:else if currentRoute.path === '/drc'}
    <DRC bind:mainHeading />
  {:else if currentRoute.path === '/synthesis'}
    <Synthesis bind:mainHeading />
  {:else if currentRoute.path === '/assemblies/synthesis'}
    <SynthesisReview bind:mainHeading />
  {:else}
    <main>
      <h1 bind:this={mainHeading} tabindex="-1">Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <p><a href="#/">Go back to Home</a></p>
    </main>
  {/if}
</div>

<style>
  /* Minimal global styles */
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
  }

  :global(h1, h2) {
    margin-top: 0;
  }

  /* Focus styles for accessibility */
  :global(:focus-visible) {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }
</style>
