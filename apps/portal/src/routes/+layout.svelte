<script lang="ts">
  import '$lib/styles/base.css';
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
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
  }
</style>
