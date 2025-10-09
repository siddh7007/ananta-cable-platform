<script lang="ts">
  export let title: string = 'Something went wrong';
  export let message: string;
  export let suggestions: string[] = [];
  export let showBackButton: boolean = true;
  export let backUrl: string = '/';
  export let actionButton: { label: string; url: string } | null = null;
</script>

<div class="error-card">
  <div class="error-icon">⚠️</div>
  <h2>{title}</h2>
  <p class="error-message">{message}</p>

  {#if suggestions.length > 0}
    <div class="suggestions">
      <h3>Suggestions:</h3>
      <ul>
        {#each suggestions as suggestion}
          <li>{suggestion}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="actions">
    {#if showBackButton}
      <a href={backUrl} class="btn btn-secondary">← Back</a>
    {/if}
    {#if actionButton}
      <a href={actionButton.url} class="btn btn-primary">{actionButton.label}</a>
    {/if}
  </div>
</div>

<style>
  .error-card {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    background: white;
    border: 1px solid #f5c6cb;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(220, 53, 69, 0.1);
    text-align: center;
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  h2 {
    color: #dc3545;
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
  }

  .error-message {
    color: #666;
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .suggestions {
    text-align: left;
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .suggestions h3 {
    margin: 0 0 1rem 0;
    color: #495057;
    font-size: 1.1rem;
  }

  .suggestions ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #666;
  }

  .suggestions li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }

  .suggestions li:last-child {
    margin-bottom: 0;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    display: inline-block;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #545b62;
  }

  @media (max-width: 768px) {
    .error-card {
      margin: 1rem;
      padding: 1.5rem;
    }

    .error-icon {
      font-size: 2.5rem;
    }

    h2 {
      font-size: 1.3rem;
    }

    .error-message {
      font-size: 1rem;
    }

    .actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }
</style>
