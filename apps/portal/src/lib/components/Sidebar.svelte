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

  // Navigation items
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/drc', label: 'DRC', icon: '🔍' },
    { path: '/synthesis', label: 'Synthesis', icon: '⚡' },
    { path: '/projects', label: 'Projects', icon: '📁' },
    { path: '/quotes', label: 'Quotes', icon: '💰' },
    { path: '/orders', label: 'Orders', icon: '📦' },
    { path: '/assemblies', label: 'Assemblies', icon: '🔧' },
    { path: '/admin', label: 'Admin', icon: '🔑' },
  ];
</script>

<aside class="sidebar" aria-label="Main navigation">
  <nav class="sidebar-nav">
    <ul class="nav-list">
      {#each navItems as item}
        <li class:active={isActive(item.path)}>
          <a
            href={item.path}
            aria-current={isActive(item.path) ? 'page' : undefined}
            title={item.label}
          >
            <span class="nav-icon" aria-hidden="true">{item.icon}</span>
            <span class="nav-label">{item.label}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="sidebar-footer">
    <a href="/settings" class="settings-link" title="Settings">
      <span class="nav-icon">⚙️</span>
      <span class="nav-label">Settings</span>
    </a>
  </div>
</aside>

<style>
  .sidebar {
    width: 240px;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 60px; /* Below header */
    background-color: #2c3e50;
    color: white;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
    z-index: 100;
    overflow-y: auto;
  }

  .sidebar-nav {
    flex: 1;
    padding: 1rem 0;
  }

  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-list li {
    margin: 0;
  }

  .nav-list li a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.5rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
  }

  .nav-list li a:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .nav-list li.active a {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
    border-left-color: #3498db;
    font-weight: 600;
  }

  .nav-list li a:focus-visible {
    outline: 2px solid #3498db;
    outline-offset: -2px;
  }

  .nav-icon {
    font-size: 1.25rem;
    line-height: 1;
    min-width: 1.5rem;
    text-align: center;
  }

  .nav-label {
    font-size: 0.9375rem;
  }

  .sidebar-footer {
    padding: 1rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .settings-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.5rem;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .settings-link:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .settings-link:focus-visible {
    outline: 2px solid #3498db;
    outline-offset: -2px;
  }

  /* Responsive: collapse to icons only on smaller screens */
  @media (max-width: 768px) {
    .sidebar {
      width: 64px;
    }

    .nav-label {
      display: none;
    }

    .nav-list li a,
    .settings-link {
      justify-content: center;
      padding: 1rem;
    }

    .nav-icon {
      font-size: 1.5rem;
    }
  }

  /* Scrollbar styling */
  .sidebar::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }

  .sidebar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .sidebar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
