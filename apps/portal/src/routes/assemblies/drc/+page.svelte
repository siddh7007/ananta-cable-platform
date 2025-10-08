<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { api } from '$lib/api/client';
  import type { DrcReport, DrcFinding, DrcFix, DrcDomain } from '$lib/types/api';
  import { telemetry } from '$lib/stores/telemetry';

  // Props for accessibility
  export let mainHeading: HTMLElement | undefined = undefined;

  // Query parameter
  $: assemblyId = $page.url.searchParams.get('assembly_id');

  // State
  let loading = true;
  let report: DrcReport | null = null;
  let error: string | null = null;
  let selectedFixIds = new Set<string>();
  let applyingFixes = false;

  // Group findings by domain
  $: groupedFindings = report ? groupFindingsByDomain(report.findings) : {};

  // Check if can continue (passed = true and errors = 0)
  $: canContinue = report?.passed === true && report?.errors === 0;

  // Available fixes
  $: availableFixes = report?.fixes ?? [];

  function groupFindingsByDomain(findings: DrcFinding[]): Record<DrcDomain, DrcFinding[]> {
    const groups: Record<DrcDomain, DrcFinding[]> = {
      mechanical: [],
      electrical: [],
      standards: [],
      labeling: [],
      consistency: []
    };

    for (const finding of findings) {
      groups[finding.domain].push(finding);
    }

    return groups;
  }

  function getDomainLabel(domain: DrcDomain): string {
    const labels: Record<DrcDomain, string> = {
      mechanical: 'Mechanical',
      electrical: 'Electrical',
      standards: 'Standards & Compliance',
      labeling: 'Labeling & Marking',
      consistency: 'Design Consistency'
    };
    return labels[domain];
  }

  async function loadDrcReport() {
    if (!assemblyId) {
      error = 'No assembly_id provided in URL. Please navigate to this page with a valid assembly_id parameter (e.g., /assemblies/drc?assembly_id=your-assembly-id)';
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
      if (report.passed) {
        telemetry.track('drc.pass', { 
          assembly_id: assemblyId,
          errors: report.errors,
          warnings: report.warnings
        });
      } else {
        telemetry.track('drc.fail', {
          assembly_id: assemblyId,
          errors: report.errors,
          warnings: report.warnings,
          findings_count: report.findings.length
        });
      }

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load DRC report';
      telemetry.track('drc.error', { assembly_id: assemblyId, error: error });
    } finally {
      loading = false;
    }
  }

  async function applySelectedFixes() {
    if (!assemblyId || selectedFixIds.size === 0) return;

    try {
      applyingFixes = true;
      const fixIds = Array.from(selectedFixIds);

      telemetry.track('drc.applyFixes', { 
        assembly_id: assemblyId,
        fix_count: fixIds.length,
        fix_ids: fixIds
      });

      const response = await api.applyDrcFixes(assemblyId, fixIds);

      if (!response.ok) {
        throw new Error(response.error);
      }

      // Update report with new results
      report = response.data;
      selectedFixIds.clear();
      selectedFixIds = selectedFixIds; // Trigger reactivity

      telemetry.track('drc.fixesApplied', { 
        assembly_id: assemblyId,
        fix_count: fixIds.length,
        new_errors: report.errors,
        new_warnings: report.warnings
      });

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to apply fixes';
      telemetry.track('drc.applyFixesError', { assembly_id: assemblyId, error: error });
    } finally {
      applyingFixes = false;
    }
  }

  function toggleFix(fixId: string) {
    if (selectedFixIds.has(fixId)) {
      selectedFixIds.delete(fixId);
    } else {
      selectedFixIds.add(fixId);
    }
    selectedFixIds = selectedFixIds; // Trigger reactivity
  }

  function toggleAllFixes() {
    if (selectedFixIds.size === availableFixes.length) {
      selectedFixIds.clear();
    } else {
      selectedFixIds = new Set(availableFixes.map((f: DrcFix) => f.id));
    }
    selectedFixIds = selectedFixIds; // Trigger reactivity
  }

  function continueToLayout() {
    if (canContinue && assemblyId) {
      telemetry.track('drc.continue', { assembly_id: assemblyId });
      goto(`/assemblies/layout?assembly_id=${assemblyId}`);
    }
  }

  function handleFixCheckboxKeydown(event: KeyboardEvent, fixId: string) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggleFix(fixId);
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
      <h1 bind:this={mainHeading} tabindex="-1">DRC Review</h1>
      {#if report}
        <div class="status-section">
          <span 
            class="status-tag" 
            class:passed={report.passed} 
            class:failed={!report.passed && report.errors > 0}
            class:warning={!report.passed && report.errors === 0 && report.warnings > 0}
          >
            {report.passed ? 'PASSED' : report.errors > 0 ? 'FAILED' : 'WARNING'}
          </span>
          <div class="counts">
            <span class="count-badge error-badge">{report.errors} Errors</span>
            <span class="count-badge warning-badge">{report.warnings} Warnings</span>
          </div>
        </div>
      {/if}
    </div>
  </header>

  <!-- Loading State -->
  {#if loading}
    <div class="loading" role="status" aria-live="polite">
      <div class="spinner"></div>
      <p>Loading DRC report...</p>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="error-banner" role="alert">
      <h2>Error Loading DRC Report</h2>
      <p>{error}</p>
      <button type="button" on:click={loadDrcReport}>Retry</button>
      <a href="#/" class="back-link">← Return to Home</a>
    </div>
  {/if}

  <!-- Report Content -->
  {#if report && !loading}
    <div class="report-content">
      <!-- Summary Section -->
      <section class="summary-section" aria-labelledby="summary-heading">
        <h2 id="summary-heading">Summary</h2>
        <div class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Assembly ID:</span>
            <code class="summary-value">{report.assembly_id}</code>
          </div>
          <div class="summary-item">
            <span class="summary-label">Ruleset:</span>
            <code class="summary-value">{report.ruleset_id}</code>
          </div>
          <div class="summary-item">
            <span class="summary-label">Version:</span>
            <code class="summary-value">{report.version}</code>
          </div>
          <div class="summary-item">
            <span class="summary-label">Generated:</span>
            <span class="summary-value">{new Date(report.generated_at).toLocaleString()}</span>
          </div>
        </div>
      </section>

      <!-- Findings by Domain -->
      <section class="findings-section" aria-labelledby="findings-heading">
        <h2 id="findings-heading">Design Rule Findings</h2>

        {#if report.findings.length === 0}
          <div class="no-findings">
            <p>✓ All design rules passed! No issues found.</p>
          </div>
        {:else}
          {#each Object.entries(groupedFindings) as [domain, findings]}
            {#if findings.length > 0}
              <div class="domain-panel" role="region" aria-labelledby="domain-{domain}">
                <h3 id="domain-{domain}" class="domain-heading">{getDomainLabel(domain)}</h3>
                <ul class="findings-list" role="list">
                  {#each findings as finding}
                    <li class="finding-item" role="listitem">
                      <div class="finding-header">
                        <span 
                          class="severity-chip" 
                          class:severity-error={finding.severity === 'error'} 
                          class:severity-warning={finding.severity === 'warning'} 
                          class:severity-info={finding.severity === 'info'}
                          role="status"
                          aria-label="{finding.severity} severity"
                        >
                          {finding.severity.toUpperCase()}
                        </span>
                        <code class="finding-code">{finding.code}</code>
                      </div>
                      <p class="finding-message">{finding.message}</p>
                      {#if finding.where}
                        <div class="finding-details">
                          <span class="detail-label">Location:</span>
                          <code class="detail-value">{finding.where}</code>
                        </div>
                      {/if}
                      {#if finding.refs && finding.refs.length > 0}
                        <div class="finding-details">
                          <span class="detail-label">References:</span>
                          <span class="detail-value">{finding.refs.join(', ')}</span>
                        </div>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          {/each}
        {/if}
      </section>

      <!-- Suggested Fixes Section -->
      {#if availableFixes.length > 0}
        <section class="fixes-section" aria-labelledby="fixes-heading">
          <h2 id="fixes-heading">Suggested Fixes</h2>
          <p class="fixes-intro">Select fixes to apply automatically. Some fixes may require re-synthesis.</p>

          <div class="fixes-controls">
            <button 
              type="button" 
              class="toggle-all-btn"
              on:click={toggleAllFixes}
              aria-label={selectedFixIds.size === availableFixes.length ? 'Deselect all fixes' : 'Select all fixes'}
            >
              {selectedFixIds.size === availableFixes.length ? 'Deselect All' : 'Select All'}
            </button>
            <span class="selected-count" aria-live="polite">
              {selectedFixIds.size} of {availableFixes.length} selected
            </span>
          </div>

          <ul class="fixes-list" role="list">
            {#each availableFixes as fix}
              <li class="fix-item">
                <label class="fix-label">
                  <input
                    type="checkbox"
                    class="fix-checkbox"
                    checked={selectedFixIds.has(fix.id)}
                    on:change={() => toggleFix(fix.id)}
                    on:keydown={(e) => handleFixCheckboxKeydown(e, fix.id)}
                    aria-describedby="fix-desc-{fix.id}"
                  />
                  <div class="fix-content">
                    <div class="fix-header">
                      <span class="fix-title">{fix.label}</span>
                      <span class="fix-effect" class:effect-caution={fix.effect !== 'non_destructive'}>
                        {fix.effect.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p id="fix-desc-{fix.id}" class="fix-description">{fix.description}</p>
                    <p class="fix-applies">Applies to: {fix.applies_to.length} finding(s)</p>
                  </div>
                </label>
              </li>
            {/each}
          </ul>

          <div class="fixes-actions">
            <button
              type="button"
              class="apply-fixes-btn"
              disabled={selectedFixIds.size === 0 || applyingFixes}
              on:click={applySelectedFixes}
            >
              {applyingFixes ? 'Applying Fixes...' : `Apply Selected Fixes (${selectedFixIds.size})`}
            </button>
          </div>
        </section>
      {/if}

      <!-- Continue Button -->
      <div class="continue-section">
        <button
          type="button"
          class="continue-btn"
          disabled={!canContinue}
          on:click={continueToLayout}
          aria-label={canContinue ? 'Continue to layout editor' : 'Fix all errors before continuing'}
        >
          Continue to Layout
        </button>
        {#if !canContinue}
          <p class="continue-note">
            {#if report.errors > 0}
              Fix all {report.errors} error(s) before continuing to layout.
            {:else if report.warnings > 0}
              {report.warnings} warning(s) present. You may continue or fix them first.
            {:else}
              All checks passed! Click Continue to proceed to layout.
            {/if}
          </p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .drc-review {
    min-height: 100vh;
    background: linear-gradient(to bottom, #f8fafc, #ffffff);
  }

  .sticky-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: white;
    border-bottom: 2px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }

  .status-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .status-tag {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-tag.passed {
    background: #d1fae5;
    color: #065f46;
  }

  .status-tag.failed {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-tag.warning {
    background: #fef3c7;
    color: #92400e;
  }

  .counts {
    display: flex;
    gap: 0.5rem;
  }

  .count-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .error-badge {
    background: #fee2e2;
    color: #991b1b;
  }

  .warning-badge {
    background: #fef3c7;
    color: #92400e;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #64748b;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-banner {
    max-width: 800px;
    margin: 4rem auto;
    padding: 2rem;
    background: #fee2e2;
    border: 2px solid #fca5a5;
    border-radius: 0.75rem;
    text-align: center;
  }

  .error-banner h2 {
    color: #991b1b;
    margin: 0 0 1rem 0;
  }

  .error-banner p {
    color: #7f1d1d;
    margin: 0 0 1.5rem 0;
  }

  .error-banner button {
    padding: 0.75rem 1.5rem;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    margin-right: 1rem;
  }

  .error-banner button:hover {
    background: #b91c1c;
  }

  .back-link {
    color: #dc2626;
    text-decoration: none;
    font-weight: 500;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .report-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  section {
    margin-bottom: 3rem;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1.5rem 0;
  }

  .summary-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .summary-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
  }

  .summary-value {
    font-size: 1rem;
    color: #1e293b;
  }

  code {
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.875rem;
  }

  .no-findings {
    background: #d1fae5;
    border: 2px solid #a7f3d0;
    border-radius: 0.75rem;
    padding: 2rem;
    text-align: center;
  }

  .no-findings p {
    color: #065f46;
    font-size: 1.125rem;
    font-weight: 500;
    margin: 0;
  }

  .domain-panel {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .domain-heading {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e2e8f0;
  }

  .findings-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .finding-item {
    padding: 1rem;
    border-left: 4px solid #e2e8f0;
    margin-bottom: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
  }

  .finding-item:last-child {
    margin-bottom: 0;
  }

  .finding-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .severity-chip {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .severity-error {
    background: #fee2e2;
    color: #991b1b;
    border-left-color: #ef4444;
  }

  .severity-warning {
    background: #fef3c7;
    color: #92400e;
    border-left-color: #f59e0b;
  }

  .severity-info {
    background: #dbeafe;
    color: #1e40af;
    border-left-color: #3b82f6;
  }

  .finding-code {
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.875rem;
    color: #64748b;
  }

  .finding-message {
    color: #334155;
    line-height: 1.6;
    margin: 0 0 0.5rem 0;
  }

  .finding-details {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }

  .detail-label {
    color: #64748b;
    font-weight: 500;
  }

  .detail-value {
    color: #475569;
  }

  /* Fixes Section */
  .fixes-section {
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 0.75rem;
    padding: 2rem;
  }

  .fixes-intro {
    color: #64748b;
    margin: 0 0 1.5rem 0;
  }

  .fixes-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 0.5rem;
  }

  .toggle-all-btn {
    padding: 0.5rem 1rem;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 0.375rem;
    color: #475569;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-all-btn:hover {
    background: #e2e8f0;
    border-color: #94a3b8;
  }

  .selected-count {
    color: #64748b;
    font-weight: 500;
  }

  .fixes-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem 0;
  }

  .fix-item {
    margin-bottom: 1rem;
  }

  .fix-label {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .fix-label:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .fix-checkbox {
    width: 20px;
    height: 20px;
    margin-top: 0.25rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .fix-content {
    flex: 1;
  }

  .fix-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .fix-title {
    font-weight: 600;
    color: #1e293b;
  }

  .fix-effect {
    padding: 0.25rem 0.5rem;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .fix-effect.effect-caution {
    background: #fef3c7;
    color: #92400e;
  }

  .fix-description {
    color: #475569;
    line-height: 1.6;
    margin: 0 0 0.5rem 0;
  }

  .fix-applies {
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }

  .fixes-actions {
    display: flex;
    justify-content: center;
  }

  .apply-fixes-btn {
    padding: 0.875rem 2rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .apply-fixes-btn:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .apply-fixes-btn:disabled {
    background: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
  }

  /* Continue Section */
  .continue-section {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
  }

  .continue-btn {
    padding: 1rem 3rem;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .continue-btn:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .continue-btn:disabled {
    background: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
  }

  .continue-note {
    margin-top: 1rem;
    color: #64748b;
    font-size: 0.875rem;
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .summary-card {
      grid-template-columns: 1fr;
    }

    .fixes-controls {
      flex-direction: column;
      gap: 0.75rem;
    }
  }
</style>
