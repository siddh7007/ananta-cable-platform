<script lang="ts">
  import { page } from '$app/stores';

  // You can add real user data here from auth store
  let userName = 'Dev User';
  let notificationCount = 3;

  function handleNotificationClick() {
    console.log('Notifications clicked');
    // TODO: Open notifications panel
  }

  function handleUserMenuClick() {
    console.log('User menu clicked');
    // TODO: Open user menu dropdown
  }
</script>

<header class="top-header" role="banner">
  <div class="header-content">
    <!-- Logo and Brand -->
    <div class="header-brand">
      <a href="/" class="logo-link">
        <span class="logo-icon">🔌</span>
        <span class="logo-text">Cable Platform</span>
      </a>
    </div>

    <!-- Header Actions -->
    <div class="header-actions">
      <!-- Health Status Indicator -->
      <div class="health-indicator" title="System Health">
        <span class="health-dot" aria-hidden="true"></span>
        <span class="sr-only">System operational</span>
      </div>

      <!-- Notifications -->
      <button
        class="header-button"
        on:click={handleNotificationClick}
        aria-label="Notifications"
        title="Notifications"
      >
        <span class="icon">🔔</span>
        {#if notificationCount > 0}
          <span class="badge" aria-label="{notificationCount} new notifications">
            {notificationCount}
          </span>
        {/if}
      </button>

      <!-- User Menu -->
      <button
        class="header-button user-button"
        on:click={handleUserMenuClick}
        aria-label="User menu"
        title="User menu"
      >
        <span class="user-avatar">👤</span>
        <span class="user-name">{userName}</span>
      </button>
    </div>
  </div>
</header>

<style>
  .top-header {
    width: 100%;
    height: 60px;
    position: fixed;
    top: 0;
    left: 0;
    background-color: #34495e;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 200;
  }

  .header-content {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    max-width: none;
  }

  /* Logo and Brand */
  .header-brand {
    display: flex;
    align-items: center;
  }

  .logo-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: white;
    text-decoration: none;
    font-size: 1.25rem;
    font-weight: 600;
    transition: opacity 0.2s;
  }

  .logo-link:hover {
    opacity: 0.9;
  }

  .logo-link:focus-visible {
    outline: 2px solid #3498db;
    outline-offset: 4px;
    border-radius: 4px;
  }

  .logo-icon {
    font-size: 1.75rem;
    line-height: 1;
  }

  .logo-text {
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  /* Header Actions */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* Health Indicator */
  .health-indicator {
    display: flex;
    align-items: center;
    padding: 0.5rem;
  }

  .health-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #2ecc71;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  /* Header Buttons */
  .header-button {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.9);
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-family: inherit;
    font-size: 0.9375rem;
  }

  .header-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .header-button:focus-visible {
    outline: 2px solid #3498db;
    outline-offset: 2px;
  }

  .header-button .icon {
    font-size: 1.25rem;
    line-height: 1;
  }

  /* Notification Badge */
  .badge {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e74c3c;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 9px;
    padding: 0 0.25rem;
    line-height: 1;
  }

  /* User Button */
  .user-button {
    padding-right: 1rem;
  }

  .user-avatar {
    font-size: 1.5rem;
    line-height: 1;
  }

  .user-name {
    font-weight: 500;
  }

  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-content {
      padding: 0 1rem;
    }

    .logo-text {
      display: none;
    }

    .user-name {
      display: none;
    }

    .user-button {
      padding: 0.5rem;
    }
  }
</style>
