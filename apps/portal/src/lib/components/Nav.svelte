<script lang="ts">
  import { route } from '../router.js';
  import { navigate } from '../router.js';

  let currentPath = '/';

  // Subscribe to route changes
  const unsubscribe = route.subscribe((r) => {
    currentPath = r.path;
  });

  // Cleanup subscription on destroy
  import { onDestroy } from 'svelte';
  onDestroy(unsubscribe);
</script>

<nav aria-label="Main navigation">
  <ul style="display: flex; gap: 1rem; list-style: none; margin: 0; padding: 1rem;">
    <li>
      <a
        href="#/"
        aria-current={currentPath === '/' ? 'page' : undefined}
        on:click|preventDefault={() => navigate('/')}
        style="text-decoration: none; padding: 0.5rem 1rem; border: 1px solid #ccc; border-radius: 4px; {currentPath === '/' ? 'background-color: #e0e0e0;' : ''}"
      >
        Home
      </a>
    </li>
    <li>
      <a
        href="#/drc"
        aria-current={currentPath === '/drc' ? 'page' : undefined}
        on:click|preventDefault={() => navigate('/drc')}
        style="text-decoration: none; padding: 0.5rem 1rem; border: 1px solid #ccc; border-radius: 4px; {currentPath === '/drc' ? 'background-color: #e0e0e0;' : ''}"
      >
        DRC
      </a>
    </li>
  </ul>
</nav>