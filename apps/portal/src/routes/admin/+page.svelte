<svelte:head>
  <title>Admin - Cable Platform Portal</title>
</svelte:head>

<div class="admin-landing">
  <p class="description">Manage platform configuration, users, and system settings.</p>

  <div class="cards-grid">
    <a href="/admin/users" class="admin-card">
      <div class="card-icon">👥</div>
      <h2>Users</h2>
      <p>Manage user accounts, roles, and permissions</p>
    </a>

    <a href="/admin/db" class="admin-card">
      <div class="card-icon">🗄️</div>
      <h2>Database</h2>
      <p>View connection status, run migrations, and monitor health</p>
    </a>

    <a href="/admin/licenses" class="admin-card">
      <div class="card-icon">📄</div>
      <h2>Licenses</h2>
      <p>Manage software licenses and compliance</p>
    </a>

    <a href="/admin/flags" class="admin-card">
      <div class="card-icon">🚩</div>
      <h2>Feature Flags</h2>
      <p>Toggle features and manage rollout strategies</p>
    </a>
  </div>
</div>

<style>
  .admin-landing {
    max-width: 100%;
  }

  .description {
    color: #718096;
    margin: 0 0 2rem 0;
    font-size: 1rem;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .admin-card {
    display: block;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    transition: all 0.2s ease;
    border: 1px solid #e2e8f0;
  }

  .admin-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }

  .admin-card:focus-visible {
    outline: 2px solid #3498db;
    outline-offset: 2px;
  }

  .card-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .admin-card h2 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    color: #2d3748;
  }

  .admin-card p {
    color: #718096;
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
