<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { api } from '$lib/api/client';
  import type { DRCReport, DRCFinding } from '$lib/types/api';
  import { telemetry } from '$lib/stores/telemetry';

  // Query parameter
  $: assemblyId = $page.url.searchParams.get('assembly_id');

  // State
  let loading = true;
  let report: DRCReport | null = null;
  let error: string | null = null;

  // Group findings by domain
    $: groupedFindings = report ? groupFindingsByDomain(report.findings) : {};

  // Check if can continue (status is 'pass')
  $: canContinue = report?.status === 'pass';

  function groupFindingsByDomain(findings: DRCFinding[]) {
    const groups: Record<string, DRCFinding[]> = {
      mechanical: [],
      electrical: [],
      standards: [],
      labeling: [],
      consistency: []
    };

    for (const finding of findings) {
      // Determine domain based on finding type
      let domain = 'consistency'; // default

      const typeStr = finding.type.toLowerCase();
      if (typeStr.includes('bend') || typeStr.includes('radius') || finding.location.includes('od_mm')) {
        domain = 'mechanical';
      } else if (typeStr.includes('ampacity') || typeStr.includes('current') || typeStr.includes('voltage') || typeStr.includes('awg')) {
        domain = 'electrical';
      } else if (typeStr.includes('color') || typeStr.includes('locale')) {
        domain = 'standards';
      } else if (typeStr.includes('label') || finding.location.includes('label')) {
        domain = 'labeling';
      }

      groups[domain].push(finding);
    }

    return groups;
  }

  async function loadDrcReport() {
    if (!assemblyId) {
      error = 'No assembly_id provided';
      loading = false;
      return;
    }

    try {
      loading = true;
      error = null;

      // Try to get existing report first
      let response = await api.getDrcReport(assemblyId);

      if (!response.ok) {
        // If no report exists, run DRC
        telemetry.track('drc.run', { assembly_id: assemblyId });
        response = await api.runDrc(assemblyId);

        if (!response.ok) {
          throw new Error(response.error);
        }
      }

      report = response.data;

      // Track result
      if (report.status === 'pass') {
        telemetry.track('drc.pass', { assembly_id: assemblyId });
      } else {
        telemetry.track('drc.fail', {
          assembly_id: assemblyId,
          status: report.status,
          issue_count: report.issues.length
        });
      }

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load DRC report';
      telemetry.track('drc.error', { assembly_id: assemblyId, error: error });
    } finally {
      loading = false;
    }
  }

  function continueToLayout() {
    if (canContinue && assemblyId) {
      goto(`/assemblies/layout?assembly_id=${assemblyId}`);
    }
  }

  onMount(() => {
    loadDrcReport();
  });
</script>

<svelte:head>
  <title>DRC Review - Cable Platform</title>
</svelte:head>

<div class="drc-review">
  <!-- Sticky Header -->
  <header class="sticky-header">
    <div class="header-content">
      <h1>DRC Review</h1>
      {#if report}
        <div class="status-section">
          <span class="status-tag" class:passed={report.status === 'pass'} class:failed={report.status === 'error'} class:warning={report.status === 'warning'}>
            {report.status.toUpperCase()}
          </span>
          <div class="summary">
            <p>{report.summary}</p>
          </div>
        </div>
      {/if}
    </div>
  </header>

  <!-- Loading State -->
  {#if loading}
    <div class="loading">
      <p>Loading DRC report...</p>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="error-banner" role="alert">
      <p>{error}</p>
      <button type="button" on:click={loadDrcReport}>Retry</button>
    </div>
  {/if}

  <!-- Report Content -->
  {#if report}
    <div class="report-content">
      <!-- Issues by Domain -->
      <div class="issues-section">
        <h2>Design Rule Findings</h2>

        {#each Object.entries(groupedFindings) as [domain, findings]}
          {#if findings.length > 0}
            <div class="domain-panel" role="region" aria-labelledby="domain-{domain}">
              <h3 id="domain-{domain}">{domain.charAt(0).toUpperCase() + domain.slice(1)} Issues</h3>
              <ul class="issues-list" role="list">
                {#each findings as finding}
                  <li class="finding-item" role="listitem">
                    <div class="finding-header">
                      <span class="severity-chip" class:severity-critical={finding.severity === 'critical'} class:severity-warning={finding.severity === 'warning'} class:severity-info={finding.severity === 'info'}>
                        {finding.severity.toUpperCase()}
                      </span>
                      {#if finding.type}
                        <code class="finding-code">{finding.type}</code>
                      {/if}
                    </div>
                    <p class="finding-message">{finding.description}</p>
                    <div class="finding-details">
                      {#if finding.location}
                        <span class="finding-location">Location: {finding.location}</span>
                      {/if}
                      {#if finding.suggestion}
                        <span class="finding-suggestion">Suggestion: {finding.suggestion}</span>
                      {/if}
                    </div>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        {/each}
      </div>

      <!-- Continue Button -->
      <div class="continue-section">
        <button
          type="button"
          class="continue-btn"
          disabled={!canContinue}
          on:click={continueToLayout}
        >
          Continue to Layout
        </button>
        {#if !canContinue}
          <p class="continue-note">Fix all errors before continuing to layout.</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .drc-review {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .sticky-header {
    position: sticky;
    top: 0;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 1rem 0;
    z-index: 10;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .status-tag {
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .status-tag.passed {
    background: #dcfce7;
    color: #166534;
  }

  .status-tag.failed {
    background: #fef2f2;
    color: #dc2626;
  }

  .status-tag.warning {
    background: #fffbeb;
    color: #d97706;
  }

  .summary {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .loading, .error-banner {
    text-align: center;
    padding: 2rem;
  }

  .error-banner {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.375rem;
    color: #dc2626;
  }

  .issues-section {
    margin-bottom: 2rem;
  }

  .domain-panel {
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
  }

  .domain-panel h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #374151;
  }

  .issues-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .finding-item {
    border: 1px solid #f3f4f6;
    border-radius: 0.25rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    background: #f9fafb;
  }

  .finding-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .severity-chip {
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .severity-critical {
    background: #fef2f2;
    color: #dc2626;
  }

  .severity-warning {
    background: #fffbeb;
    color: #d97706;
  }

  .severity-info {
    background: #f3f4f6;
    color: #6b7280;
  }

  .finding-code {
    background: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 0.125rem;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .finding-message {
    margin: 0.5rem 0;
    font-weight: 500;
  }

  .finding-details {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .finding-suggestion {
    font-style: italic;
    color: #059669;
    margin: 0.5rem 0 0 0;
  }

  .continue-section {
    text-align: center;
    padding: 2rem 0;
  }

  .continue-btn {
    background: #059669;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 0.375rem;
    font-weight: 600;
    font-size: 1.125rem;
    cursor: pointer;
  }

  .continue-btn:hover:not(:disabled) {
    background: #047857;
  }

  .continue-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .continue-note {
    margin-top: 1rem;
    color: #6b7280;
    font-style: italic;
  }
</style>