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

<a href="#main" class="skip-link">Skip to content</a>

<div class="app-container">
  <Nav />

  <main id="main" class="main-content">
    <slot />
  </main>
</div>

<style>
  /* Skip to content link - visually hidden until focused */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--color-background);
    color: var(--color-text-primary);
    padding: var(--spacing-sm) var(--spacing-md);
    text-decoration: none;
    border: 2px solid var(--color-primary);
    border-radius: var(--radius-sm);
    z-index: var(--z-tooltip);
    font-weight: var(--font-weight-semibold);
  }

  .skip-link:focus {
    top: var(--spacing-sm);
    left: var(--spacing-sm);
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
