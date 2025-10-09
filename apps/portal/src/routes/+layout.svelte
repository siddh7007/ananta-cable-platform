<script lang="ts">
  import Nav from '$lib/components/Nav.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { telemetry } from '$lib/stores/telemetry';

  // Track page views with telemetry
  $: if ($page.url.pathname) {
    telemetry.track('page.view', {
      path: $page.url.pathname,
      params: Object.fromEntries($page.url.searchParams),
    });
  }

  onMount(() => {
    console.log('Portal initialized with SvelteKit');
  });
</script>

<div class="app-container">
  <Nav />

  <main class="main-content">
    <slot />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
  }

  :global(h1, h2, h3, h4, h5, h6) {
    margin-top: 0;
    font-weight: 600;
  }

  :global(a) {
    color: #007bff;
    text-decoration: none;
  }

  :global(a:hover) {
    text-decoration: underline;
  }

  /* Focus styles for accessibility */
  :global(:focus-visible) {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
  }
</style>
