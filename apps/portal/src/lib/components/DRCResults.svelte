<script lang="ts">
  import type { DRCResult } from '../../types/api';

  export let result: DRCResult | null;

  // New props for enhanced states
  export let isLoading: boolean = false;
  export let hadError: boolean = false;
  export let emptyMessage: string = "No findings — your design passed!";

  // Filter state
  type FilterType = 'all' | 'error' | 'warn' | 'info';
  let activeFilter: FilterType = 'all';

  // Props for focus management
  export let resultsHeading: HTMLElement;

  // Derived filtered and sorted findings
  $: filteredFindings = result
    ? result.findings
        .filter((finding: any) => activeFilter === 'all' || finding.severity === activeFilter)
        .sort((a: any, b: any) => {
          // Sort by severity (error > warn > info), then by code
          const severityOrder = { error: 3, warn: 2, info: 1 };
          const severityDiff =
            severityOrder[b.severity as keyof typeof severityOrder] -
            severityOrder[a.severity as keyof typeof severityOrder];
          return severityDiff !== 0 ? severityDiff : a.code.localeCompare(b.code);
        })
    : [];

  // Severity badge styles
  function getSeverityStyle(severity: string): string {
    switch (severity) {
      case 'error':
        return 'background-color: #dc3545; color: white;';
      case 'warn':
        return 'background-color: #ffc107; color: #212529;';
      case 'info':
        return 'background-color: #17a2b8; color: white;';
      default:
        return 'background-color: #6c757d; color: white;';
    }
  }

  // Copy JSON to clipboard
  async function copyJson(): Promise<void> {
    if (!result) return;

    try {
      const jsonString = JSON.stringify(result, null, 2);
      await navigator.clipboard.writeText(jsonString);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  }

  // Download JSON as file
  function downloadJson(): void {
    if (!result) return;

    const jsonString = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `drc-result-${result.design_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

{#if isLoading}
  <section aria-labelledby="loading-heading">
    <div class="loading-state">
      <h2 id="loading-heading">Fetching results...</h2>
      <div class="loader" aria-hidden="true">⟳</div>
    </div>
  </section>
{:else if result === null}
  <!-- Render nothing when no result -->
{:else if result.findings.length === 0}
  <section aria-labelledby="empty-heading">
    <div class="empty-state">
      <h2 id="empty-heading" bind:this={resultsHeading} tabindex="-1">Results for: {result.design_id}</h2>
      <div class="empty-content">
        <span class="empty-icon" aria-hidden="true">✅</span>
        <p>{emptyMessage}</p>
        <button class="run-again-btn" on:click={() => window.location.reload()}>
          Run again
        </button>
      </div>
    </div>
  </section>
{:else}
  <section aria-labelledby="results-heading">
    <header>
      <h2 id="results-heading" bind:this={resultsHeading} tabindex="-1">
        Results for: {result.design_id}
      </h2>

      <div class="summary-pills">
        {#if result.severity_summary.error}
          <span class="pill error">Errors: {result.severity_summary.error}</span>
        {/if}
        {#if result.severity_summary.warn}
          <span class="pill warn">Warnings: {result.severity_summary.warn}</span>
        {/if}
        {#if result.severity_summary.info}
          <span class="pill info">Info: {result.severity_summary.info}</span>
        {/if}
      </div>

      <div class="actions">
        <button on:click={copyJson} class="action-btn">Copy JSON</button>
        <button on:click={downloadJson} class="action-btn">Download JSON</button>
      </div>
    </header>

    <div class="filters">
      <span id="filter-label">Filter by severity:</span>
      <div class="filter-buttons" role="group" aria-labelledby="filter-label">
        <button
          class="filter-btn {activeFilter === 'all' ? 'active' : ''}"
          on:click={() => (activeFilter = 'all')}
          aria-pressed={activeFilter === 'all'}
        >
          All ({result?.findings.length || 0})
        </button>
        <button
          class="filter-btn {activeFilter === 'error' ? 'active' : ''}"
          on:click={() => (activeFilter = 'error')}
          aria-pressed={activeFilter === 'error'}
        >
          Errors ({result?.severity_summary.error || 0})
        </button>
        <button
          class="filter-btn {activeFilter === 'warn' ? 'active' : ''}"
          on:click={() => (activeFilter = 'warn')}
          aria-pressed={activeFilter === 'warn'}
        >
          Warnings ({result?.severity_summary.warn || 0})
        </button>
        <button
          class="filter-btn {activeFilter === 'info' ? 'active' : ''}"
          on:click={() => (activeFilter = 'info')}
          aria-pressed={activeFilter === 'info'}
        >
          Info ({result?.severity_summary.info || 0})
        </button>
      </div>
    </div>

    <table aria-label="DRC Findings" class="findings-table">
      <thead>
        <tr>
          <th scope="col">Severity</th>
          <th scope="col">Code</th>
          <th scope="col">Message</th>
          {#if filteredFindings.some((f) => f.path)}
            <th scope="col">Path</th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#if filteredFindings.length === 0}
          <tr>
            <td colspan={filteredFindings.some((f) => f.path) ? 4 : 3} class="empty-state">
              No findings for current filter.
            </td>
          </tr>
        {:else}
          {#each filteredFindings as finding}
            <tr>
              <td>
                <span class="severity-badge" style={getSeverityStyle(finding.severity)}>
                  {finding.severity.toUpperCase()}
                </span>
              </td>
              <td>{finding.code}</td>
              <td>{finding.message}</td>
              {#if filteredFindings.some((f) => f.path)}
                <td>{finding.path || '-'}</td>
              {/if}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </section>
{/if}

<style>
  section {
    margin-top: 2rem;
  }

  header {
    margin-bottom: 1.5rem;
  }

  .summary-pills {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  }

  .pill {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .pill.error {
    background-color: #f8d7da;
    color: #721c24;
  }
  .pill.warn {
    background-color: #fff3cd;
    color: #856404;
  }
  .pill.info {
    background-color: #d1ecf1;
    color: #0c5460;
  }

  .actions {
    margin-top: 1rem;
  }

  .action-btn {
    padding: 0.5rem 1rem;
    margin-right: 0.5rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .action-btn:hover {
    background-color: #0056b3;
  }

  .filters {
    margin-bottom: 1rem;
  }

  .filter-buttons {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid #dee2e6;
    background-color: white;
    color: #495057;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .filter-btn:hover {
    background-color: #f8f9fa;
  }

  .filter-btn.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;
  }

  .findings-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  .findings-table th,
  .findings-table td {
    border: 1px solid #dee2e6;
    padding: 0.75rem;
    text-align: left;
  }

  .findings-table th {
    background-color: #f8f9fa;
    font-weight: 600;
  }

  .severity-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
  }

  .empty-state {
    text-align: center;
    color: #6c757d;
    font-style: italic;
    padding: 2rem;
  }

  /* Focus styles for accessibility */
  :global(.findings-table:focus-visible) {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }

  .loading-state {
    text-align: center;
    padding: 2rem;
  }

  .loading-state h2 {
    color: #6c757d;
    margin-bottom: 1rem;
  }

  .loader {
    font-size: 2rem;
    animation: spin 1s linear infinite;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
  }

  .empty-content {
    max-width: 400px;
    margin: 0 auto;
  }

  .empty-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }

  .empty-content p {
    font-size: 1.1rem;
    color: #495057;
    margin-bottom: 1.5rem;
  }

  .run-again-btn {
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .run-again-btn:hover {
    background-color: #0056b3;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
