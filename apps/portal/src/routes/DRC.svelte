<script lang="ts">
  import { api } from '../lib/api/client.js';
  import type { CableDesign, DRCResult } from '../lib/types/api.js';

  let formData: CableDesign = {
    id: '',
    name: '',
    cores: 1
  };

  let isSubmitting = false;
  let result: DRCResult | null = null;
  let error: string | null = null;

  // Props
  export let mainHeading: HTMLElement;

  // Form validation
  $: isValid = formData.id.trim() !== '' && formData.cores >= 1;
  $: idError = formData.id.trim() === '' ? 'ID is required' : null;
  $: coresError = formData.cores < 1 ? 'Cores must be at least 1' : null;

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!isValid || isSubmitting) return;

    isSubmitting = true;
    error = null;
    result = null;

    try {
      const response = await api.runDRC(formData);

      if (response.ok) {
        result = response.data;
      } else {
        error = response.error || 'Failed to run DRC';
      }
    } catch (err) {
      error = 'Network error occurred';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<main>
  <h1 bind:this={mainHeading} tabindex="-1">Design Rule Check (DRC)</h1>

  <form on:submit={handleSubmit} style="max-width: 400px;">
    <div style="margin-bottom: 1rem;">
      <label for="design-id" style="display: block; margin-bottom: 0.5rem;">Design ID *</label>
      <input
        id="design-id"
        type="text"
        bind:value={formData.id}
        required
        style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; {idError ? 'border-color: red;' : ''}"
        aria-describedby={idError ? 'id-error' : undefined}
      />
      {#if idError}
        <span id="id-error" style="color: red; font-size: 0.875rem;">{idError}</span>
      {/if}
    </div>

    <div style="margin-bottom: 1rem;">
      <label for="design-name" style="display: block; margin-bottom: 0.5rem;">Design Name</label>
      <input
        id="design-name"
        type="text"
        bind:value={formData.name}
        style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
      />
    </div>

    <div style="margin-bottom: 1rem;">
      <label for="cores" style="display: block; margin-bottom: 0.5rem;">Cores *</label>
      <input
        id="cores"
        type="number"
        bind:value={formData.cores}
        min="1"
        required
        style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; {coresError ? 'border-color: red;' : ''}"
        aria-describedby={coresError ? 'cores-error' : undefined}
      />
      {#if coresError}
        <span id="cores-error" style="color: red; font-size: 0.875rem;">{coresError}</span>
      {/if}
    </div>

    <button
      type="submit"
      disabled={!isValid || isSubmitting}
      style="padding: 0.75rem 1.5rem; background-color: {isValid && !isSubmitting ? '#007bff' : '#ccc'}; color: white; border: none; border-radius: 4px; cursor: {isValid && !isSubmitting ? 'pointer' : 'not-allowed'};"
    >
      {isSubmitting ? 'Running DRC...' : 'Run DRC'}
    </button>
  </form>

  {#if error}
    <section aria-labelledby="error-heading" style="margin-top: 2rem; padding: 1rem; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
      <h2 id="error-heading" style="color: #721c24; margin-top: 0;">Error</h2>
      <p style="color: #721c24; margin: 0;">{error}</p>
    </section>
  {/if}

  {#if result}
    <section aria-labelledby="results-heading" style="margin-top: 2rem;">
      <h2 id="results-heading">DRC Results for {result.design_id}</h2>

      {#if result.findings && result.findings.length > 0}
        <table style="border-collapse: collapse; width: 100%; margin-top: 1rem;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: left;">Code</th>
              <th style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: left;">Severity</th>
              <th style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: left;">Message</th>
            </tr>
          </thead>
          <tbody>
            {#each result.findings as finding}
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 0.75rem;">{finding.code}</td>
                <td style="border: 1px solid #dee2e6; padding: 0.75rem;">{finding.severity}</td>
                <td style="border: 1px solid #dee2e6; padding: 0.75rem;">{finding.message}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p style="margin-top: 1rem; padding: 1rem; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">
          ✅ No design rule violations found.
        </p>
      {/if}
    </section>
  {/if}
</main>