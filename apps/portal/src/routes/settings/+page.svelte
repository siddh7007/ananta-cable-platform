<svelte:head>
  <title>Settings - Cable Platform Portal</title>
</svelte:head>

<div class="page-container">
  <div class="page-header">
    <h1>Settings</h1>
    <p class="page-subtitle">Configure your portal preferences</p>
  </div>

  <div class="settings-grid">
    <section class="settings-section">
      <h2>Profile</h2>
      <p>Manage your user profile and preferences</p>
      <button class="button-secondary" disabled>Coming soon</button>
    </section>

    <section class="settings-section">
      <h2>Notifications</h2>
      <p>Configure notification preferences</p>
      <button class="button-secondary" disabled>Coming soon</button>
    </section>

    <section class="settings-section">
      <h2>API Keys</h2>
      <p>Manage API keys for external integrations</p>
      <button class="button-secondary" disabled>Coming soon</button>
    </section>

    <section class="settings-section">
      <h2>Team</h2>
      <p>Invite and manage team members</p>
      <button class="button-secondary" disabled>Coming soon</button>
    </section>
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

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .settings-section {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .settings-section h2 {
    font-size: 1.25rem;
    margin: 0 0 0.5rem 0;
    color: #2d3748;
  }

  .settings-section p {
    color: #718096;
    margin: 0 0 1rem 0;
    font-size: 0.9375rem;
  }

  .button-secondary {
    padding: 0.5rem 1rem;
    background-color: #e2e8f0;
    color: #4a5568;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: not-allowed;
    font-family: inherit;
    font-size: 0.875rem;
  }

  .button-secondary:disabled {
    opacity: 0.6;
  }
</style>
