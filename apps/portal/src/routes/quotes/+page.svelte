<svelte:head>
  <title>Quotes - Cable Platform Portal</title>
</svelte:head>

<div class="page-container">
  <div class="page-header">
    <h1>Quotes</h1>
    <p class="page-subtitle">View and manage your cable assembly quotes</p>
  </div>

  <div class="empty-state">
    <div class="empty-icon">💰</div>
    <h2>No quotes yet</h2>
    <p>Quotes will appear here once you've validated assemblies and requested pricing.</p>
    <a href="/synthesis" class="button-primary">Start Synthesis</a>
  </div>
</div>

<style>
  .page-container {
    max-width: 1200px;
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

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-state h2 {
    font-size: 1.5rem;
    color: #2d3748;
    margin: 0 0 0.5rem 0;
  }

  .empty-state p {
    color: #718096;
    margin: 0 0 1.5rem 0;
  }

  .button-primary {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #3182ce;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .button-primary:hover {
    background-color: #2c5aa0;
  }
</style>
