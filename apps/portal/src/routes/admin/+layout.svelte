<script lang="ts">
  import { configStore } from '$lib/stores/config';
  import { get } from 'svelte/store';

  export let data: { adminDevBypass: boolean; user: { sub: string; roles?: string[] } };

  let devBypassEnabled = data.adminDevBypass;

  function toggleDevBypass() {
    devBypassEnabled = !devBypassEnabled;
    // Update local storage to persist the setting
    const config = get(configStore);
    if (config.data) {
      const updatedConfig = {
        ...config.data,
        auth: {
          ...config.data.auth,
          devBypass: devBypassEnabled,
        },
      };
      localStorage.setItem('cable-platform-config', JSON.stringify(updatedConfig));
      // Reload the page to apply the new setting
      window.location.reload();
    }
  }
</script>

<div class="admin-container">
  <header class="admin-header">
    <h1>Admin</h1>
    {#if data.adminDevBypass}
      <span class="dev-badge">ADMIN (DEV)</span>
      <div class="dev-bypass-toggle">
        <label class="toggle-label">
          <input
            type="checkbox"
            bind:checked={devBypassEnabled}
            on:change={toggleDevBypass}
            class="toggle-input"
          />
          <span class="toggle-slider"></span>
          <span class="toggle-text">Dev Bypass</span>
        </label>
      </div>
    {/if}
  </header>

  <nav class="admin-nav">
    <a href="/admin" class="nav-link">Overview</a>
    <a href="/admin/users" class="nav-link">Users</a>
    <a href="/admin/db" class="nav-link">Database</a>
    <a href="/admin/licenses" class="nav-link">Licenses</a>
    <a href="/admin/flags" class="nav-link">Feature Flags</a>
  </nav>

  <div class="admin-content">
    <slot />
  </div>
</div>

<style>
  .admin-container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .admin-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  h1 {
    font-size: 2rem;
    margin: 0;
    color: #1a202c;
  }

  .dev-bypass-toggle {
    margin-left: auto;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
  }

  .toggle-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: relative;
    width: 2.5rem;
    height: 1.25rem;
    background-color: #cbd5e1;
    border-radius: 1.25rem;
    transition: background-color 0.2s ease;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    height: 1rem;
    width: 1rem;
    left: 0.125rem;
    bottom: 0.125rem;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .toggle-input:checked + .toggle-slider {
    background-color: #10b981;
  }

  .toggle-input:checked + .toggle-slider::before {
    transform: translateX(1.25rem);
  }

  .toggle-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .admin-nav {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    padding: 0.5rem;
    background-color: #f8fafc;
    border-radius: 8px;
    flex-wrap: wrap;
  }

  .nav-link {
    padding: 0.5rem 1rem;
    background-color: white;
    color: #475569;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.9375rem;
    border: 1px solid #e2e8f0;
    transition: all 0.15s ease;
  }

  .nav-link:hover {
    background-color: #f1f5f9;
    color: #1e293b;
    border-color: #cbd5e1;
  }

  .nav-link:focus-visible {
    outline: 2px solid #3498db;
    outline-offset: 2px;
  }

  .admin-content {
    min-height: 400px;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.5rem;
    }

    .admin-nav {
      flex-direction: column;
    }

    .nav-link {
      text-align: center;
    }
  }
</style>
