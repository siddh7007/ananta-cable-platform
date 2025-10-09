<script lang="ts">
  import { page } from '$app/stores';

  // Reactive current path
  $: currentPath = $page.url.pathname;

  // Helper to check if current route matches
  function isActive(path: string): boolean {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  }
</script>

<nav class="main-nav" aria-label="Main navigation">
  <div class="nav-container">
    <div class="nav-brand">
      <a href="/">Cable Platform</a>
    </div>

    <ul class="nav-links">
      <li class:active={isActive('/')}>
        <a href="/" aria-current={isActive('/') ? 'page' : undefined}> Home </a>
      </li>
      <li class:active={isActive('/drc')}>
        <a href="/drc" aria-current={isActive('/drc') ? 'page' : undefined}> DRC </a>
      </li>
      <li class:active={isActive('/synthesis')}>
        <a href="/synthesis" aria-current={isActive('/synthesis') ? 'page' : undefined}>
          Synthesis
        </a>
      </li>
    </ul>
  </div>
</nav>

<style>
  .main-nav {
    background-color: #2c3e50;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 60px;
  }

  .nav-brand a {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    text-decoration: none;
  }

  .nav-brand a:hover {
    text-decoration: none;
    opacity: 0.9;
  }

  .nav-links {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 2rem;
  }

  .nav-links li a {
    color: rgba(255, 255, 255, 0.8);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: all 0.2s;
    text-decoration: none;
  }

  .nav-links li a:hover,
  .nav-links li.active a {
    color: white;
    background-color: rgba(255, 255, 255, 0.1);
    text-decoration: none;
  }

  .nav-links li.active a {
    font-weight: 600;
  }
</style>
