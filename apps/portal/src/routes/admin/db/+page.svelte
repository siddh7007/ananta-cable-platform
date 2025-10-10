<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import type { AdminDbData } from '$lib/types/admin';

  export let data: AdminDbData;

  let isRefetching = false;

  async function handleRefetch() {
    isRefetching = true;
    try {
      await invalidateAll();
    } finally {
      isRefetching = false;
    }
  }

  function getStatusClass(status: 'ok' | 'fail' | 'unknown'): string {
    switch (status) {
      case 'ok':
        return 'pill ok';
      case 'fail':
        return 'pill fail';
      default:
        return 'pill unknown';
    }
  }

  function getStatusLabel(status: 'ok' | 'fail' | 'unknown'): string {
    switch (status) {
      case 'ok':
        return 'Healthy';
      case 'fail':
        return 'Failed';
      default:
        return 'Unknown';
    }
  }
</script>

<svelte:head>
  <title>Database - Admin - Cable Platform Portal</title>
</svelte:head>

<h1>Database</h1>

{#if data.error}
  <div class="error-banner" role="alert">
    <strong>Error:</strong>
    {data.error}
  </div>
{/if}

<div class="db-dashboard">
  <section class="connections-section">
    <h2>Connections</h2>
    <div class="connections-grid">
      <!-- Supabase -->
      <div class="connection-card">
        <div class="connection-header">
          <h3>Supabase</h3>
          {#if data.stats?.supabase}
            <span
              class={getStatusClass(data.stats.supabase.status)}
              aria-label="status: {data.stats.supabase.status}"
            >
              {getStatusLabel(data.stats.supabase.status)}
            </span>
          {:else}
            <span class="pill unknown" aria-label="status: unknown">Unknown</span>
          {/if}
        </div>
        {#if data.stats?.supabase?.latencyMs !== undefined}
          <p class="latency">{data.stats.supabase.latencyMs}ms</p>
        {/if}
        {#if data.stats?.supabase?.note}
          <p class="note">{data.stats.supabase.note}</p>
        {/if}
      </div>

      <!-- PG Extra -->
      <div class="connection-card">
        <div class="connection-header">
          <h3>PG Extra</h3>
          {#if data.stats?.pgExtra}
            <span
              class={getStatusClass(data.stats.pgExtra.status)}
              aria-label="status: {data.stats.pgExtra.status}"
            >
              {getStatusLabel(data.stats.pgExtra.status)}
            </span>
          {:else}
            <span class="pill unknown" aria-label="status: unknown">Not configured</span>
          {/if}
        </div>
        {#if data.stats?.pgExtra?.latencyMs !== undefined}
          <p class="latency">{data.stats.pgExtra.latencyMs}ms</p>
        {/if}
        {#if data.stats?.pgExtra?.note}
          <p class="note">{data.stats.pgExtra.note}</p>
        {/if}
      </div>

      <!-- Oracle -->
      <div class="connection-card">
        <div class="connection-header">
          <h3>Oracle</h3>
          {#if data.stats?.oracle}
            <span
              class={getStatusClass(data.stats.oracle.status)}
              aria-label="status: {data.stats.oracle.status}"
            >
              {getStatusLabel(data.stats.oracle.status)}
            </span>
          {:else}
            <span class="pill unknown" aria-label="status: unknown">Not configured</span>
          {/if}
        </div>
        {#if data.stats?.oracle?.latencyMs !== undefined}
          <p class="latency">{data.stats.oracle.latencyMs}ms</p>
        {/if}
        {#if data.stats?.oracle?.note}
          <p class="note">{data.stats.oracle.note}</p>
        {/if}
      </div>
    </div>
  </section>

  <section class="counts-section">
    <h2>Entity Counts</h2>
    <div class="counts-grid">
      <div class="count-card">
        <div class="count-value">{data.stats?.counts?.workspaces ?? '—'}</div>
        <div class="count-label">Workspaces</div>
      </div>
      <div class="count-card">
        <div class="count-value">{data.stats?.counts?.projects ?? '—'}</div>
        <div class="count-label">Projects</div>
      </div>
      <div class="count-card">
        <div class="count-value">{data.stats?.counts?.boms ?? '—'}</div>
        <div class="count-label">BOMs</div>
      </div>
      <div class="count-card">
        <div class="count-value">{data.stats?.counts?.orders ?? '—'}</div>
        <div class="count-label">Orders</div>
      </div>
      <div class="count-card">
        <div class="count-value">{data.stats?.counts?.users ?? '—'}</div>
        <div class="count-label">Users</div>
      </div>
    </div>
  </section>

  <div class="actions">
    <button
      on:click={handleRefetch}
      disabled={isRefetching}
      aria-busy={isRefetching}
      class="refetch-button"
    >
      {isRefetching ? 'Refetching...' : 'Refetch'}
    </button>
  </div>
</div>

<style>
  h1 {
    margin: 0 0 1.5rem 0;
    font-size: 2rem;
    color: #1a202c;
  }

  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: #2d3748;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
  }

  .error-banner {
    padding: 1rem;
    margin-bottom: 1.5rem;
    background-color: #fff5f5;
    border: 1px solid #fc8181;
    border-radius: 4px;
    color: #c53030;
  }

  .db-dashboard {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .connections-section,
  .counts-section {
    padding: 1.5rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .connections-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .connection-card {
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #f7fafc;
  }

  .connection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .pill {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .pill.ok {
    background-color: #c6f6d5;
    color: #22543d;
  }

  .pill.fail {
    background-color: #fed7d7;
    color: #742a2a;
  }

  .pill.unknown {
    background-color: #e2e8f0;
    color: #4a5568;
  }

  .latency {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    color: #4a5568;
  }

  .note {
    margin: 0.5rem 0 0 0;
    font-size: 0.75rem;
    color: #718096;
    font-style: italic;
  }

  .counts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }

  .count-card {
    padding: 1.5rem 1rem;
    text-align: center;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #f7fafc;
  }

  .count-value {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .count-label {
    font-size: 0.875rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  .refetch-button {
    padding: 0.75rem 1.5rem;
    background-color: #4299e1;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .refetch-button:hover:not(:disabled) {
    background-color: #3182ce;
  }

  .refetch-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .refetch-button:focus-visible {
    outline: 2px solid #4299e1;
    outline-offset: 2px;
  }
</style>
