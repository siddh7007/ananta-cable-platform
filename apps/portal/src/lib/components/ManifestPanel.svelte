<script lang="ts">
  import type { RenderManifest } from '$lib/types/api';

  export let manifest: RenderManifest;
  export let cached: boolean = false;

  let expanded = false;

  function toggleExpanded() {
    expanded = !expanded;
  }

  function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }
</script>

<section class="manifest-panel" aria-labelledby="manifest-heading">
  <button
    type="button"
    class="manifest-header"
    on:click={toggleExpanded}
    aria-expanded={expanded}
    aria-controls="manifest-details"
  >
    <h3 id="manifest-heading" class="manifest-title">
      Render Details
      {#if cached}
        <span class="cached-badge" aria-label="From cache">Cached</span>
      {/if}
    </h3>
    <span class="expand-icon" aria-hidden="true">
      {expanded ? '−' : '+'}
    </span>
  </button>

  {#if expanded}
    <div id="manifest-details" class="manifest-content">
      <dl class="manifest-list">
        <div class="manifest-item">
          <dt class="manifest-label">Assembly ID</dt>
          <dd class="manifest-value">
            <code>{manifest.assembly_id}</code>
          </dd>
        </div>

        <div class="manifest-item">
          <dt class="manifest-label">Revision</dt>
          <dd class="manifest-value">
            <code>{manifest.revision}</code>
          </dd>
        </div>

        <div class="manifest-item">
          <dt class="manifest-label">Template Pack</dt>
          <dd class="manifest-value">
            <code>{manifest.template_pack_id}@{manifest.template_pack_version}</code>
          </dd>
        </div>

        <div class="manifest-item">
          <dt class="manifest-label">Renderer Version</dt>
          <dd class="manifest-value">
            <code>{manifest.renderer_version}</code>
          </dd>
        </div>

        <div class="manifest-item">
          <dt class="manifest-label">Schema Hash</dt>
          <dd class="manifest-value">
            <code class="hash-value">{manifest.schema_hash}</code>
          </dd>
        </div>

        <div class="manifest-item">
          <dt class="manifest-label">Format</dt>
          <dd class="manifest-value">
            <span class="format-badge">{manifest.format.toUpperCase()}</span>
          </dd>
        </div>

        <div class="manifest-item">
          <dt class="manifest-label">Generated At</dt>
          <dd class="manifest-value">
            {formatTimestamp(manifest.timestamp)}
          </dd>
        </div>
      </dl>
    </div>
  {/if}
</section>

<style>
  .manifest-panel {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background: white;
    margin: 1rem 0;
  }

  .manifest-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: #f7fafc;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .manifest-header:hover {
    background: #edf2f7;
  }

  .manifest-header:focus-visible {
    outline: 2px solid #3182ce;
    outline-offset: -2px;
  }

  .manifest-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cached-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    background: #bee3f8;
    color: #2c5aa0;
    border-radius: 4px;
  }

  .expand-icon {
    font-size: 1.5rem;
    color: #718096;
    line-height: 1;
  }

  .manifest-content {
    padding: 1.25rem;
    border-top: 1px solid #e2e8f0;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .manifest-list {
    margin: 0;
    display: grid;
    gap: 1rem;
  }

  .manifest-item {
    display: flex;
    gap: 1rem;
  }

  .manifest-label {
    font-weight: 500;
    color: #4a5568;
    min-width: 150px;
    margin: 0;
  }

  .manifest-value {
    color: #2d3748;
    margin: 0;
    word-break: break-word;
  }

  .manifest-value code {
    background: #f7fafc;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
    font-size: 0.875em;
  }

  .hash-value {
    font-size: 0.75em;
    word-break: break-all;
  }

  .format-badge {
    display: inline-block;
    font-weight: 600;
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    background: #c6f6d5;
    color: #22543d;
    border-radius: 4px;
  }
</style>
