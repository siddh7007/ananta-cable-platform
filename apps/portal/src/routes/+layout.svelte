<script lang="ts">
  import '$lib/styles/base.css';
  import Header from '$lib/components/Header.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Toaster from '$lib/components/Toaster.svelte';
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
  <Header />
  <Sidebar />

  <main id="main" class="main-content">
    <slot />
  </main>

  <Toaster />
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
    margin-left: 240px; /* Width of sidebar */
    margin-top: 60px; /* Height of header */
    padding: 2rem;
    background-color: #f5f7fa;
    min-height: calc(100vh - 60px);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .main-content {
      margin-left: 64px; /* Collapsed sidebar width */
      padding: 1rem;
    }
  }
</style>
