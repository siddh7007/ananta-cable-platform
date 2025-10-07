<script lang="ts">
  import { api } from '../lib/api/client.js';
  import type { DRCResult } from '../lib/types/api.js';

  // Form data type
  type FormData = {
    id: string;
    name: string;
    cores: number;
  };

  // Simple validation function (inline for now)
  function validateCableDesign(input: unknown): { ok: true; data: FormData } | { ok: false; errors: Array<{ path: string; message: string }> } {
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
  let result: DRCResult | null = null;
  let submitError: string | null = null;

  // Props
  export let mainHeading: HTMLElement;
  export let firstErrorField: HTMLElement;

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

  // Validate on input/blur
  function validateField(field: keyof FormData) {
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
      const response = await api.runDRC(form as CableDesign);

      if (response.ok) {
        result = response.data;
        // Focus result heading for accessibility
        const resultHeading = document.getElementById('result-heading');
        if (resultHeading) {
          resultHeading.focus();
        }
      } else {
        submitError = response.error || 'Failed to run DRC';
      }
    } catch (err) {
      submitError = 'Network error occurred';
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

  <form on:submit={handleSubmit}>
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
          on:input={() => validateField('id')}
          on:blur={() => validateField('id')}
          style="width: 100%; padding: 0.5rem; border: 1px solid {errors.id
            ? '#dc3545'
            : '#ccc'}; border-radius: 4px;"
        />
        {#if errors.id}
          <span
            id="id-error"
            bind:this={firstErrorField}
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
          on:input={() => validateField('name')}
          on:blur={() => validateField('name')}
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
          on:input={() => validateField('cores')}
          on:blur={() => validateField('cores')}
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
          Running DRC...
        {:else}
          Run DRC
        {/if}
      </button>
    </div>
  </form>

  {#if submitError}
    <section
      aria-labelledby="error-heading"
      style="margin-top: 2rem; padding: 1rem; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;"
    >
      <h2 id="error-heading" style="color: #721c24; margin-top: 0;">Error</h2>
      <p style="color: #721c24; margin: 0;">{submitError}</p>
    </section>
  {/if}

  {#if result}
    <section aria-labelledby="result-heading" style="margin-top: 2rem;">
      <h2 id="result-heading" tabindex="-1" style="margin-top: 0;">
        DRC Results for {result.design_id}
      </h2>

      {#if result.findings && result.findings.length > 0}
        <table style="border-collapse: collapse; width: 100%; margin-top: 1rem;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: left;">Code</th>
              <th style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: left;"
                >Severity</th
              >
              <th style="border: 1px solid #dee2e6; padding: 0.75rem; text-align: left;">Message</th
              >
            </tr>
          </thead>
          <tbody>
            {#each result.findings as finding}
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 0.75rem;">{finding.code}</td>
                <td style="border: 1px solid #dee2e6; padding: 0.75rem;">
                  <span
                    style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; color: white; background-color: {finding.severity ===
                    'error'
                      ? '#dc3545'
                      : finding.severity === 'warn'
                        ? '#ffc107'
                        : '#17a2b8'};"
                  >
                    {finding.severity.toUpperCase()}
                  </span>
                </td>
                <td style="border: 1px solid #dee2e6; padding: 0.75rem;">{finding.message}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p
          style="margin-top: 1rem; padding: 1rem; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;"
        >
          ✅ No design rule violations found.
        </p>
      {/if}
    </section>
  {/if}
</main>
