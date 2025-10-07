<script lang="ts">
  import { onMount } from 'svelte';
  import { apiStatusStore, startHeartbeat, type ApiStatus } from '../lib/stores/status.js';
  import { userStore, refreshUser, type UserState } from '../lib/stores/user.js';

  let apiStatus: ApiStatus = { loading: false, healthy: false };
  let userState: UserState = { loading: false };
  let heartbeatStop: (() => void) | undefined;

  // Props
  export let mainHeading: HTMLElement;

  // Subscribe to stores
  const unsubscribeStatus = apiStatusStore.subscribe((status) => {
    apiStatus = status;
  });

  const unsubscribeUser = userStore.subscribe((state) => {
    userState = state;
  });

  onMount(async () => {
    // Start heartbeat for API status
    heartbeatStop = startHeartbeat();

    // Refresh user data
    await refreshUser();
  });

  // Cleanup subscriptions and heartbeat on destroy
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    unsubscribeStatus();
    unsubscribeUser();
    heartbeatStop?.();
  });
</script>

<main>
  <h1 bind:this={mainHeading} tabindex="-1">Welcome to Cable Platform Portal</h1>

  <section aria-labelledby="status-heading">
    <h2 id="status-heading">System Status</h2>

    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <span
        style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: {apiStatus.healthy
          ? 'green'
          : 'red'};"
        aria-label={apiStatus.healthy ? 'API is healthy' : 'API is unreachable'}
      ></span>
      <span>
        API: {apiStatus.loading ? 'Checking...' : apiStatus.healthy ? 'Healthy' : 'Unreachable'}
        {#if apiStatus.latencyMs}
          ({apiStatus.latencyMs}ms)
        {/if}
      </span>
    </div>

    {#if userState.loading}
      <p>Loading user information...</p>
    {:else if userState.data}
      <p>Welcome, {userState.data.sub}!</p>
    {:else if userState.error === 'unauthorized'}
      <p>Please log in to access user features.</p>
    {:else if userState.error}
      <p>Unable to load user information.</p>
    {/if}
  </section>
</main>
