<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { api } from '$lib/api/client';
  import { telemetry } from '$lib/stores/telemetry';
  import type { TemplatePack, RenderFormat } from '$lib/types/api';

  export let assemblyId: string;
  export let open = false;

  const dispatch = createEventDispatcher<{
    close: void;
    submit: { templatePackId: string; format: RenderFormat; inline: boolean };
  }>();

  let templatePacks: TemplatePack[] = [];
  let selectedTemplateId = '';
  let format: RenderFormat = 'svg';
  let inline = true;
  let loading = false;
  let loadError = '';

  // Load template packs on mount
  onMount(async () => {
    await loadTemplatePacks();
  });

  async function loadTemplatePacks() {
    loading = true;
    loadError = '';
    try {
      const response = await api.listTemplatePacks();
      if (!response.ok) {
        throw new Error(response.error);
      }
      templatePacks = response.data;
      // Select first pack by default
      if (templatePacks.length > 0) {
        selectedTemplateId = `${templatePacks[0].id}@${templatePacks[0].version}`;
      }
    } catch (err) {
      loadError = err instanceof Error ? err.message : 'Failed to load template packs';
      telemetry.track('render.loadTemplatesError', {
        assembly_id: assemblyId,
        error: loadError,
      });
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    open = false;
    dispatch('close');
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (!selectedTemplateId) return;

    telemetry.track('render.submit', {
      assembly_id: assemblyId,
      template_pack_id: selectedTemplateId,
      format,
      inline,
    });

    dispatch('submit', {
      templatePackId: selectedTemplateId,
      format,
      inline,
    });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  // Disable inline preview when PDF is selected
  $: if (format === 'pdf') {
    inline = false;
  }
</script>

{#if open}
  <div
    class="dialog-overlay"
    on:click={handleClose}
    on:keydown={handleKeydown}
    role="presentation"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="dialog"
      on:click|stopPropagation
      on:keydown={(e) => e.key === 'Escape' && handleClose()}
      role="dialog"
      aria-labelledby="dialog-title"
      aria-modal="true"
    >
      <header class="dialog-header">
        <h2 id="dialog-title">Generate Drawing</h2>
        <button type="button" class="close-btn" on:click={handleClose} aria-label="Close dialog">
          ×
        </button>
      </header>

      <form class="dialog-body" on:submit={handleSubmit}>
        {#if loading}
          <div class="loading-state" role="status" aria-live="polite">
            <div class="spinner"></div>
            <p>Loading template packs...</p>
          </div>
        {:else if loadError}
          <div class="error-state" role="alert">
            <p class="error-message">{loadError}</p>
            <button type="button" on:click={loadTemplatePacks}>Retry</button>
          </div>
        {:else}
          <div class="form-group">
            <label for="template-pack" class="form-label">
              Template Pack
              <span class="required-indicator" aria-label="required">*</span>
            </label>
            <select
              id="template-pack"
              class="form-select"
              bind:value={selectedTemplateId}
              required
              aria-required="true"
            >
              <option value="" disabled>Select a template pack...</option>
              {#each templatePacks as pack}
                <option value="{pack.id}@{pack.version}">
                  {pack.name || pack.id} v{pack.version} ({pack.paper})
                </option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <fieldset class="format-fieldset">
              <legend class="form-label">
                Format
                <span class="required-indicator" aria-label="required">*</span>
              </legend>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" name="format" value="svg" bind:group={format} required />
                  <span>SVG (Scalable Vector Graphics)</span>
                </label>
                <label class="radio-label">
                  <input type="radio" name="format" value="pdf" bind:group={format} required />
                  <span>PDF (Portable Document Format)</span>
                </label>
              </div>
            </fieldset>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={inline}
                disabled={format === 'pdf'}
                aria-describedby="inline-help"
              />
              <span>Preview inline</span>
            </label>
            <p id="inline-help" class="help-text">
              {#if format === 'pdf'}
                Inline preview is only available for SVG format
              {:else}
                Display the drawing directly in the browser with zoom and pan controls
              {/if}
            </p>
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn btn-secondary" on:click={handleClose}> Cancel </button>
            <button type="submit" class="btn btn-primary" disabled={!selectedTemplateId}>
              Generate Drawing
            </button>
          </div>
        {/if}
      </form>
    </div>
  </div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dialog {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow: auto;
    animation: slideUp 0.2s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .dialog-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a202c;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: #718096;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #f7fafc;
    color: #2d3748;
  }

  .close-btn:focus-visible {
    outline: 2px solid #3182ce;
    outline-offset: 2px;
  }

  .dialog-body {
    padding: 1.5rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 1rem;
  }

  .spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid #e2e8f0;
    border-top-color: #3182ce;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-state {
    text-align: center;
    padding: 2rem;
  }

  .error-message {
    color: #e53e3e;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #2d3748;
  }

  .required-indicator {
    color: #e53e3e;
    margin-left: 0.25rem;
  }

  .form-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #cbd5e0;
    border-radius: 4px;
    font-size: 1rem;
    line-height: 1.5;
    transition: border-color 0.2s;
  }

  .form-select:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }

  .format-fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .radio-label:hover {
    background: #f7fafc;
  }

  .radio-label input[type='radio'] {
    cursor: pointer;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .checkbox-label input[type='checkbox']:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .help-text {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #718096;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }

  .btn:focus-visible {
    outline: 2px solid #3182ce;
    outline-offset: 2px;
  }

  .btn-secondary {
    background: white;
    border-color: #cbd5e0;
    color: #2d3748;
  }

  .btn-secondary:hover {
    background: #f7fafc;
    border-color: #a0aec0;
  }

  .btn-primary {
    background: #3182ce;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2c5aa0;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
