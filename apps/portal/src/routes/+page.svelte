<script lang="ts">
  import { formatMoney } from '$lib/format';
  import type { DashboardData, HealthStatus } from './+page';

  // Load data from +page.ts
  export let data: DashboardData;

  // Helper to get status badge class
  function getStatusClass(status: HealthStatus): string {
    switch (status) {
      case 'ok':
        return 'status-ok';
      case 'degraded':
        return 'status-degraded';
      case 'fail':
        return 'status-fail';
      default:
        return 'status-fail';
    }
  }

  // Helper to get status text
  function getStatusText(status: HealthStatus): string {
    switch (status) {
      case 'ok':
        return 'Operational';
      case 'degraded':
        return 'Degraded';
      case 'fail':
        return 'Unavailable';
      default:
        return 'Unknown';
    }
  }
</script>

<svelte:head>
  <title>Dashboard - Cable Platform Portal</title>
</svelte:head>

<main class="dashboard-page">
  <div class="page-header">
    <h1>Dashboard</h1>
    <p class="page-subtitle">Overview of your cable platform activity</p>
  </div>

  <div class="dashboard-grid">
    <!-- System Health Tile -->
    <section class="dashboard-tile" aria-labelledby="health-heading">
      <h2 id="health-heading">System Health</h2>
      <div class="tile-content">
        <div class="health-badge {getStatusClass(data.health.status)}">
          {getStatusText(data.health.status)}
        </div>
        {#if data.health.version}
          <p class="health-version">Version: {data.health.version}</p>
        {/if}
        <a href="/ready" class="view-details-link">View details</a>
      </div>
    </section>

    <!-- Recent Projects Tile -->
    <section class="dashboard-tile" aria-labelledby="projects-heading">
      <h2 id="projects-heading">Recent Projects</h2>
      <div class="tile-content">
        {#if data.projects.length === 0}
          <p class="empty-state">No items yet</p>
        {:else}
          <ul>
            {#each data.projects as project}
              <li>
                <a href="/projects/{project.id}">
                  {project.name}
                  {#if project.updatedAt}
                    <span class="timestamp"
                      >Updated: {new Date(project.updatedAt).toLocaleDateString()}</span
                    >
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </section>

    <!-- Latest Quotes Tile -->
    <section class="dashboard-tile" aria-labelledby="quotes-heading">
      <h2 id="quotes-heading">Latest Quotes</h2>
      <div class="tile-content">
        {#if data.quotes.length === 0}
          <p class="empty-state">No items yet</p>
        {:else}
          <ul>
            {#each data.quotes as quote}
              <li>
                <a href="/quotes/{quote.id}">
                  Quote #{quote.id}
                  {#if quote.total != null}
                    <span class="quote-total">{formatMoney(quote.total)}</span>
                  {/if}
                  {#if quote.createdAt}
                    <span class="timestamp">{new Date(quote.createdAt).toLocaleDateString()}</span>
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </section>

    <!-- Recent Orders Tile -->
    <section class="dashboard-tile" aria-labelledby="orders-heading">
      <h2 id="orders-heading">Recent Orders</h2>
      <div class="tile-content">
        {#if data.orders.length === 0}
          <p class="empty-state">No items yet</p>
        {:else}
          <ul>
            {#each data.orders as order}
              <li>
                <a href="/orders/{order.id}">
                  Order #{order.id}
                  {#if order.status}
                    <span class="order-status status-{order.status.toLowerCase()}"
                      >{order.status}</span
                    >
                  {/if}
                  {#if order.createdAt}
                    <span class="timestamp">{new Date(order.createdAt).toLocaleDateString()}</span>
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </section>
  </div>
</main>

<style>
  .dashboard-page {
    max-width: 1400px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    color: #1a202c;
  }

  .page-subtitle {
    color: #718096;
    margin: 0;
    font-size: 0.9375rem;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .dashboard-tile {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .dashboard-tile h2 {
    font-size: 1.25rem;
    margin: 0 0 1rem 0;
    color: #2d3748;
    font-weight: 600;
  }

  .tile-content {
    color: #4a5568;
  }

  /* Health status badges */
  .health-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .status-ok {
    background-color: #c6f6d5;
    color: #22543d;
    border: 1px solid #9ae6b4;
  }

  .status-degraded {
    background-color: #fef3c7;
    color: #78350f;
    border: 1px solid #fcd34d;
  }

  .status-fail {
    background-color: #fed7d7;
    color: #742a2a;
    border: 1px solid #fc8181;
  }

  .health-version {
    font-size: 0.875rem;
    color: #718096;
    margin: 0.5rem 0;
  }

  .view-details-link {
    display: inline-block;
    margin-top: 0.75rem;
    color: #3182ce;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .view-details-link:hover {
    text-decoration: underline;
  }

  .view-details-link:focus-visible {
    outline: 2px solid #3182ce;
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* Lists */
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 0.75rem;
  }

  li:last-child {
    margin-bottom: 0;
  }

  li a {
    display: block;
    color: #2d3748;
    text-decoration: none;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  li a:hover {
    background-color: #f7fafc;
  }

  li a:focus-visible {
    outline: 2px solid #3182ce;
    outline-offset: 2px;
  }

  /* Metadata spans */
  .timestamp,
  .quote-total,
  .order-status {
    display: block;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }

  .timestamp {
    color: #a0aec0;
  }

  .quote-total {
    color: #2d3748;
    font-weight: 600;
  }

  .order-status {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
    background-color: #e2e8f0;
    color: #4a5568;
  }

  /* Empty state */
  .empty-state {
    color: #a0aec0;
    font-style: italic;
    margin: 0;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
