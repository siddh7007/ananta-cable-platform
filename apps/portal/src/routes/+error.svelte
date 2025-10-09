<script lang="ts">
  import { page } from '$app/stores';

  $: status = $page.status;
  $: message = $page.error?.message || 'An error occurred';
</script>

<svelte:head>
  <title>Error {status} - Cable Platform Portal</title>
</svelte:head>

<main class="error-page">
  <div class="error-container">
    <h1>{status}</h1>
    <h2>{message}</h2>

    {#if status === 404}
      <p>The page you're looking for doesn't exist.</p>
    {:else if status === 400}
      <p>Bad request. Please check your input and try again.</p>
    {:else if status >= 500}
      <p>Something went wrong on our end. Please try again later.</p>
    {/if}

    <a href="/" class="btn-home">Go back to Home</a>
  </div>
</main>

<style>
  .error-page {
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .error-container {
    text-align: center;
    max-width: 600px;
  }

  h1 {
    font-size: 6rem;
    margin: 0;
    color: #e74c3c;
  }

  h2 {
    font-size: 1.5rem;
    margin: 1rem 0;
    color: #2c3e50;
  }

  p {
    color: #666;
    margin: 1rem 0 2rem;
    font-size: 1.1rem;
  }

  .btn-home {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #007bff;
    color: white;
    border-radius: 4px;
    transition: background-color 0.2s;
    text-decoration: none;
  }

  .btn-home:hover {
    background-color: #0056b3;
    text-decoration: none;
  }
</style>
