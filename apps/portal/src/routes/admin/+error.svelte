<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Error - Admin - Cable Platform Portal</title>
</svelte:head>

<div class="error-container">
  <div class="error-content">
    {#if $page.status === 403}
      <div class="error-icon">🚫</div>
      <h1>Forbidden</h1>
      <p class="error-message">
        {$page.error?.message || 'You do not have permission to access this section.'}
      </p>
    {:else}
      <div class="error-icon">⚠️</div>
      <h1>Error {$page.status}</h1>
      <p class="error-message">
        {$page.error?.message || 'An unexpected error occurred.'}
      </p>
    {/if}

    <div class="error-actions">
      <a href="/" class="button-primary">Back to Home</a>
      <a href="/settings" class="button-secondary">Settings</a>
    </div>
  </div>
</div>

<style>
  .error-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 2rem 1rem;
  }

  .error-content {
    text-align: center;
    max-width: 500px;
  }

  .error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 2rem;
    margin: 0 0 1rem 0;
    color: #1a202c;
  }

  .error-message {
    color: #4a5568;
    margin: 0 0 2rem 0;
    font-size: 1.125rem;
    line-height: 1.6;
  }

  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .button-primary,
  .button-secondary {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9375rem;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .button-primary {
    background-color: #3498db;
    color: white;
  }

  .button-primary:hover {
    background-color: #2980b9;
  }

  .button-primary:focus-visible {
    outline: 2px solid #3498db;
    outline-offset: 2px;
  }

  .button-secondary {
    background-color: #e2e8f0;
    color: #4a5568;
    border-color: #cbd5e1;
  }

  .button-secondary:hover {
    background-color: #cbd5e1;
    color: #1e293b;
  }

  .button-secondary:focus-visible {
    outline: 2px solid #3498db;
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    .error-icon {
      font-size: 3rem;
    }

    h1 {
      font-size: 1.5rem;
    }

    .error-actions {
      flex-direction: column;
    }

    .button-primary,
    .button-secondary {
      width: 100%;
    }
  }
</style>
