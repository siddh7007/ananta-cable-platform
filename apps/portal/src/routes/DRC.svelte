<script lang="ts">
  import { api } from '../lib/api/client.js';
  import type { DRCResult } from '../lib/types/api.js';
  import DRCResults from '../lib/components/DRCResults.svelte';

  // Form data type
  type FormData = {
    id: string;
    name: string;
    cores: number;
  };

  // Simple validation function (inline for now)
  function validateCableDesign(
    input: unknown,
  ):
    | { ok: true; data: FormData }
    | { ok: false; errors: Array<{ path: string; message: string }> } {
    const data = input as FormData;

    const errors: Array<{ path: string; message: string }> = [];

    if (!data.id || typeof data.id !== 'string' || data.id.trim() === '') {
      errors.push({ path: 'id', message: 'must be a non-empty string' });
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push({ path: 'name', message: 'must be a non-empty string' });
    }

    if (typeof data.cores !== 'number' || data.cores < 1 || !Number.isInteger(data.cores)) {
      errors.push({ path: 'cores', message: 'must be an integer >= 1' });
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    return { ok: true, data };
  }

  let form: FormData = { id: '', name: '', cores: 1 };
  let errors: Record<string, string> = {};
  let submitting = false;
  let validateBusy = false;
  let result: DRCResult | null = null;
  let submitError: string | null = null;

  // Props
  export let mainHeading: HTMLElement;
  export let firstErrorField: HTMLElement;

  // For focus management in results
  let resultsHeading: HTMLElement;
  let errorBanner: HTMLElement;

  // Validation function
  function validateForm(): boolean {
    const validation = validateCableDesign(form);
    if (validation.ok) {
      errors = {};
      return true;
    } else {
      // Convert validation errors to field errors
      errors = {};
      for (const err of validation.errors) {
        // Extract field name from path (remove leading slash)
        const field = err.path.replace(/^\//, '');
        if (field && !errors[field]) {
          errors[field] = err.message;
        }
      }
      return false;
    }
  }

  // Error message mapping
  function mapErrorToMessage(error: string, status?: number, details?: any): string {
    switch (error) {
      case 'bad_request':
        return 'Form has issues; please fix highlighted fields.';
      case 'upstream_unavailable':
        return 'DRC service is unavailable. Try again shortly.';
      case 'upstream_invalid_payload':
        return 'Unexpected response from DRC. We\'ve logged this.';
      default:
        return error || 'An unexpected error occurred.';
    }
  }

  // Clear submit error when user starts editing
  function clearSubmitError() {
    if (submitError) {
      submitError = null;
    }
  }

  // Validate on input/blur with busy state
  async function validateField(field: keyof FormData) {
    validateBusy = true;
    try {
      // Simulate async validation (could be AJV schema validation)
      await new Promise(resolve => setTimeout(resolve, 100));

      const validation = validateCableDesign(form);
      if (!validation.ok) {
        // Clear previous errors for this field
        delete errors[field];

        // Find errors for this specific field
        for (const err of validation.errors) {
          const errField = err.path.replace(/^\//, '');
          if (errField === field) {
            errors[field] = err.message;
            break;
          }
        }
      } else {
        delete errors[field];
      }
      errors = { ...errors }; // Trigger reactivity
    } finally {
      validateBusy = false;
    }
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!validateForm() || submitting) {
      // Focus first error field
      if (firstErrorField) {
        firstErrorField.focus();
      }
      return;
    }

    submitting = true;
    result = null;
    submitError = null;

    try {
      const response = await api.runDRC(form as any);

      if (response.ok) {
        result = response.data;
        // Focus result heading for accessibility
        if (resultsHeading) {
          resultsHeading.focus();
        }
      } else {
        submitError = mapErrorToMessage(response.error || 'unknown_error', response.status, response.details);
        // Focus error banner
        if (errorBanner) {
          errorBanner.focus();
        }
      }
    } catch (err) {
      submitError = 'Network error occurred';
      // Focus error banner
      if (errorBanner) {
        errorBanner.focus();
      }
    } finally {
      submitting = false;
    }
  }

  // Check if form has validation errors
  $: hasErrors = Object.keys(errors).length > 0;
  $: isDisabled = submitting || hasErrors;
</script>

<main>
  <h1 bind:this={mainHeading} tabindex="-1">Design Rule Check (DRC)</h1>

  {#if validateBusy}
    <div class="validation-status" aria-live="polite">
      <span class="loader" aria-hidden="true">⟳</span>
      Validating...
    </div>
  {/if}

  <form on:submit={handleSubmit} aria-busy={submitting}>
    <div style="max-width: 400px;">
      <div style="margin-bottom: 1rem;">
        <label for="design-id" style="display: block; margin-bottom: 0.5rem;">Design ID *</label>
        <input
          id="design-id"
          type="text"
          bind:value={form.id}
          required
          aria-invalid={errors.id ? 'true' : 'false'}
          aria-describedby={errors.id ? 'id-error' : undefined}
          on:input={() => { validateField('id'); clearSubmitError(); }}
          on:blur={() => validateField('id')}
          disabled={submitting}
          bind:this={firstErrorField}
          style="width: 100%; padding: 0.5rem; border: 1px solid {errors.id
            ? '#dc3545'
            : '#ccc'}; border-radius: 4px;"
        />
        {#if errors.id}
          <span
            id="id-error"
            style="color: #dc3545; font-size: 0.875rem;">{errors.id}</span
          >
        {/if}
      </div>

      <div style="margin-bottom: 1rem;">
        <label for="design-name" style="display: block; margin-bottom: 0.5rem;">Design Name *</label
        >
        <input
          id="design-name"
          type="text"
          bind:value={form.name}
          required
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
          on:input={() => { validateField('name'); clearSubmitError(); }}
          on:blur={() => validateField('name')}
          disabled={submitting}
          style="width: 100%; padding: 0.5rem; border: 1px solid {errors.name
            ? '#dc3545'
            : '#ccc'}; border-radius: 4px;"
        />
        {#if errors.name}
          <span id="name-error" style="color: #dc3545; font-size: 0.875rem;">{errors.name}</span>
        {/if}
      </div>

      <div style="margin-bottom: 1rem;">
        <label for="cores" style="display: block; margin-bottom: 0.5rem;">Cores *</label>
        <input
          id="cores"
          type="number"
          bind:value={form.cores}
          min="1"
          required
          aria-invalid={errors.cores ? 'true' : 'false'}
          aria-describedby={errors.cores ? 'cores-error' : undefined}
          on:input={() => { validateField('cores'); clearSubmitError(); }}
          on:blur={() => validateField('cores')}
          disabled={submitting}
          style="width: 100%; padding: 0.5rem; border: 1px solid {errors.cores
            ? '#dc3545'
            : '#ccc'}; border-radius: 4px;"
        />
        {#if errors.cores}
          <span id="cores-error" style="color: #dc3545; font-size: 0.875rem;">{errors.cores}</span>
        {/if}
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        style="padding: 0.75rem 1.5rem; background-color: {isDisabled
          ? '#6c757d'
          : '#007bff'}; color: white; border: none; border-radius: 4px; cursor: {isDisabled
          ? 'not-allowed'
          : 'pointer'};"
      >
        {#if submitting}
          <span class="loader" aria-hidden="true">⟳</span>
          Running checks...
        {:else}
          Run DRC
        {/if}
      </button>
    </div>
  </form>

  {#if submitError}
    <div
      class="banner error"
      role="alert"
      aria-live="assertive"
      bind:this={errorBanner}
      tabindex="-1"
    >
      <h3>Error</h3>
      <p>{submitError}</p>
      {#if submitError.includes('logged this') || submitError.includes('details')}
        <details>
          <summary>Details</summary>
          <pre>{JSON.stringify({ error: submitError, timestamp: new Date().toISOString() }, null, 2)}</pre>
        </details>
      {/if}
    </div>
  {/if}

  {#if result}
    <DRCResults
      {result}
      bind:resultsHeading
      isLoading={false}
      emptyMessage={result.findings.length === 0 ? "No findings — your design passed!" : ""}
    />
  {/if}
</main>

<style>
  .validation-status {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 1000;
  }

  .loader {
    display: inline-block;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .banner {
    margin-top: 2rem;
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid;
  }

  .banner.error {
    background-color: #f8d7da;
    border-color: #f5c6cb;
    color: #721c24;
  }

  .banner.error h3 {
    margin-top: 0;
    color: #721c24;
  }

  .banner.error details {
    margin-top: 1rem;
  }

  .banner.error pre {
    background: #f1f1f1;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    overflow-x: auto;
  }
</style>
