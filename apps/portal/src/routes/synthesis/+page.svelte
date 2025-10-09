<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api/client.js';
  import type { SynthesisProposal, PartRef } from '$lib/types/api.js';

  let mainHeading: HTMLElement;
  let proposal: SynthesisProposal | null = null;
  let loading = true;
  let error: string | null = null;
  let locks: Record<string, string> = {}; // section -> mpn

  // Telemetry store (simplified)
  let telemetry: string[] = [];

  function emitTelemetry(event: string, data?: any) {
    const entry = `${new Date().toISOString()}: ${event}${data ? ` - ${JSON.stringify(data)}` : ''}`;
    telemetry = [...telemetry, entry];
    console.log('Telemetry:', entry);
  }

  // Get draft_id from URL params
  let draftId: string | null = null;

  onMount(async () => {
    // Get draft_id from URL query params
    const params = new URLSearchParams(window.location.search);
    draftId = params.get('draft_id');

    if (!draftId) {
      error = 'No draft_id provided in URL (expected ?draft_id=...)';
      loading = false;
      return;
    }

    try {
      emitTelemetry('synthesis.propose', { draftId });
      const response = await api.proposeSynthesis(draftId);

      if (response.ok && response.data) {
        proposal = response.data;
      } else {
        error = response.error || 'Failed to generate synthesis proposal';
      }
    } catch (err) {
      error = 'Network error occurred';
      console.error(err);
    } finally {
      loading = false;
    }
  });

  async function handleRecompute() {
    if (!draftId || !proposal) return;

    loading = true;
    error = null;

    try {
      emitTelemetry('synthesis.recompute', { locks });
      const response = await api.recomputeSynthesis(draftId, locks);

      if (response.ok && response.data) {
        proposal = response.data;
      } else {
        error = response.error || 'Failed to recompute synthesis';
      }
    } catch (err) {
      error = 'Network error occurred';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function handleAccept() {
    if (!proposal) return;

    loading = true;
    error = null;

    try {
      emitTelemetry('synthesis.accept', { proposalId: proposal.proposal_id, locks });
      const response = await api.acceptSynthesis(proposal.proposal_id, locks);

      if (response.ok && response.data) {
        // Navigate to next step
        await goto(`/assemblies/layout?assembly_id=${response.data.assembly_id}`);
      } else {
        error = response.error || 'Failed to accept synthesis';
      }
    } catch (err) {
      error = 'Network error occurred';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function selectAlternate(section: string, mpn: string) {
    emitTelemetry('synthesis.override', { section, mpn });
    locks = { ...locks, [section]: mpn };
  }

  function hasErrors(): boolean {
    return proposal ? proposal.errors.length > 0 : false;
  }

  function getPartOptions(section: string, primary: PartRef, alternates: PartRef[]): PartRef[] {
    const selectedMpn = locks[section];
    const options = [primary, ...alternates];

    // If user selected an alternate, move it to front
    if (selectedMpn && selectedMpn !== primary.mpn) {
      const selectedIndex = options.findIndex((p) => p.mpn === selectedMpn);
      if (selectedIndex > 0) {
        const selected = options.splice(selectedIndex, 1)[0];
        options.unshift(selected);
      }
    }

    return options;
  }
</script>

<svelte:head>
  <title>Synthesis - Ananta Cable Platform</title>
</svelte:head>

<main bind:this={mainHeading} tabindex="-1">
  <h1>Synthesis Review</h1>

  {#if loading}
    <div class="loading">Generating synthesis proposal...</div>
  {:else if error}
    <div class="error">
      <h2>Error</h2>
      <p>{error}</p>
    </div>
  {:else if proposal}
    <!-- Warnings Banner -->
    {#if proposal.warnings.length > 0}
      <div class="warnings">
        <h3>⚠️ Warnings</h3>
        <ul>
          {#each proposal.warnings as warning}
            <li>{warning}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Errors Banner -->
    {#if hasErrors()}
      <div class="errors">
        <h3>❌ Errors - Cannot Continue</h3>
        <ul>
          {#each proposal.errors as error}
            <li>{error}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="synthesis-grid">
      <!-- Left Column: Cards -->
      <div class="cards-column">
        <!-- Cable Card -->
        <div class="card">
          <h3>Cable</h3>
          <div class="part-selector">
            {#each getPartOptions('cable', proposal.cable.primary, proposal.cable.alternates) as part, i}
              <label class="part-option">
                <input
                  type="radio"
                  name="cable"
                  value={part.mpn}
                  checked={i === 0}
                  on:change={() => selectAlternate('cable', part.mpn)}
                />
                <div class="part-info">
                  <strong>{part.mpn}</strong>
                  <div class="part-details">{part.family} - {part.series}</div>
                  {#if part.notes}<div class="part-notes">{part.notes}</div>{/if}
                </div>
              </label>
            {/each}
          </div>
        </div>

        <!-- End A Card -->
        <div class="card">
          <h3>End A</h3>
          <div class="endpoint-section">
            <h4>Connector</h4>
            <div class="part-selector">
              {#each getPartOptions('endA_connector', proposal.endpoints.endA.connector, []) as part, i}
                <label class="part-option">
                  <input
                    type="radio"
                    name="endA_connector"
                    value={part.mpn}
                    checked={i === 0}
                    on:change={() => selectAlternate('endA_connector', part.mpn)}
                  />
                  <div class="part-info">
                    <strong>{part.mpn}</strong>
                    <div class="part-details">{part.family} - {part.series}</div>
                    {#if part.notes}<div class="part-notes">{part.notes}</div>{/if}
                  </div>
                </label>
              {/each}
            </div>

            {#if proposal.endpoints.endA.contacts}
              <h4>Contacts</h4>
              <div class="part-selector">
                {#each getPartOptions('endA_contacts', proposal.endpoints.endA.contacts.primary, proposal.endpoints.endA.contacts.alternates) as part, i}
                  <label class="part-option">
                    <input
                      type="radio"
                      name="endA_contacts"
                      value={part.mpn}
                      checked={i === 0}
                      on:change={() => selectAlternate('endA_contacts', part.mpn)}
                    />
                    <div class="part-info">
                      <strong>{part.mpn}</strong>
                      <div class="part-details">{part.family} - {part.series}</div>
                      {#if part.notes}<div class="part-notes">{part.notes}</div>{/if}
                    </div>
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- End B Card -->
        <div class="card">
          <h3>End B</h3>
          <div class="endpoint-section">
            <h4>Connector</h4>
            <div class="part-selector">
              {#each getPartOptions('endB_connector', proposal.endpoints.endB.connector, []) as part, i}
                <label class="part-option">
                  <input
                    type="radio"
                    name="endB_connector"
                    value={part.mpn}
                    checked={i === 0}
                    on:change={() => selectAlternate('endB_connector', part.mpn)}
                  />
                  <div class="part-info">
                    <strong>{part.mpn}</strong>
                    <div class="part-details">{part.family} - {part.series}</div>
                    {#if part.notes}<div class="part-notes">{part.notes}</div>{/if}
                  </div>
                </label>
              {/each}
            </div>

            {#if proposal.endpoints.endB.contacts}
              <h4>Contacts</h4>
              <div class="part-selector">
                {#each getPartOptions('endB_contacts', proposal.endpoints.endB.contacts.primary, proposal.endpoints.endB.contacts.alternates) as part, i}
                  <label class="part-option">
                    <input
                      type="radio"
                      name="endB_contacts"
                      value={part.mpn}
                      checked={i === 0}
                      on:change={() => selectAlternate('endB_contacts', part.mpn)}
                    />
                    <div class="part-info">
                      <strong>{part.mpn}</strong>
                      <div class="part-details">{part.family} - {part.series}</div>
                      {#if part.notes}<div class="part-notes">{part.notes}</div>{/if}
                    </div>
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- Accessories Card -->
        <div class="card">
          <h3>Accessories</h3>
          <div class="accessories-list">
            {#each proposal.endpoints.endA.accessories.concat(proposal.endpoints.endB.accessories) as accessory, i}
              <div class="accessory-item">
                <strong>{accessory.mpn}</strong>
                <div class="part-details">{accessory.family} - {accessory.series}</div>
                {#if accessory.notes}<div class="part-notes">{accessory.notes}</div>{/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- Wirelist Card -->
        <div class="card">
          <h3>Wirelist</h3>
          <div class="table-container">
            <table class="wirelist-table">
              <thead>
                <tr>
                  <th>Wire ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Color</th>
                  <th>AWG</th>
                  <th>Length (m)</th>
                </tr>
              </thead>
              <tbody>
                {#each proposal.wirelist as wire}
                  <tr>
                    <td>{wire.wire_id}</td>
                    <td>{wire.from}</td>
                    <td>{wire.to}</td>
                    <td>{wire.color || '-'}</td>
                    <td>{wire.awg || '-'}</td>
                    <td>{wire.length_m?.toFixed(2) || '-'}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- BOM Card -->
        <div class="card">
          <h3>Bill of Materials</h3>
          <div class="table-container">
            <table class="bom-table">
              <thead>
                <tr>
                  <th>MPN</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Role</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {#each proposal.bom as item}
                  <tr>
                    <td>{item.part_ref.mpn}</td>
                    <td>{item.part_ref.family} - {item.part_ref.series}</td>
                    <td>{item.qty}</td>
                    <td>{item.role}</td>
                    <td>{item.reason}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Column: Explain Log -->
      <div class="explain-column">
        <div class="card">
          <h3>Explain</h3>
          <div class="explain-log">
            {#each proposal.explain as rule}
              <div class="explain-entry">{rule}</div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="actions">
      <button class="btn btn-secondary" on:click={handleRecompute} disabled={loading}>
        {loading ? 'Recomputing...' : 'Recompute'}
      </button>

      <button class="btn btn-primary" on:click={handleAccept} disabled={loading || hasErrors()}>
        {loading ? 'Accepting...' : 'Continue'}
      </button>
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    color: #333;
    margin-bottom: 2rem;
  }

  .loading,
  .error {
    text-align: center;
    padding: 2rem;
    border-radius: 8px;
  }

  .loading {
    background: #f0f8ff;
    color: #0066cc;
  }

  .error {
    background: #ffebee;
    color: #c62828;
  }

  .warnings {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .errors {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .warnings h3,
  .errors h3 {
    margin-top: 0;
    color: #856404;
  }

  .errors h3 {
    color: #721c24;
  }

  .synthesis-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .cards-column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .card h3 {
    margin-top: 0;
    color: #333;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 0.5rem;
  }

  .card h4 {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: #666;
    font-size: 1rem;
  }

  .part-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .part-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .part-option:hover {
    background: #f8f9fa;
    border-color: #007bff;
  }

  .part-option input[type='radio'] {
    margin-top: 0.25rem;
    flex-shrink: 0;
  }

  .part-info {
    flex: 1;
  }

  .part-info strong {
    display: block;
    color: #333;
    font-size: 1.1rem;
  }

  .part-details {
    color: #666;
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }

  .part-notes {
    color: #888;
    font-size: 0.8rem;
    font-style: italic;
  }

  .endpoint-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .accessories-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .accessory-item {
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .table-container {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
  }

  .wirelist-table,
  .bom-table {
    width: 100%;
    border-collapse: collapse;
  }

  .wirelist-table th,
  .wirelist-table td,
  .bom-table th,
  .bom-table td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  .wirelist-table th,
  .bom-table th {
    background: #f8f9fa;
    font-weight: 600;
    position: sticky;
    top: 0;
  }

  .explain-column .card {
    height: fit-content;
    max-height: 80vh;
    overflow: hidden;
  }

  .explain-log {
    max-height: 70vh;
    overflow-y: auto;
    font-family: monospace;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .explain-entry {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
    color: #555;
  }

  .explain-entry:last-child {
    border-bottom: none;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    padding: 2rem 0;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #545b62;
  }

  @media (max-width: 1024px) {
    .synthesis-grid {
      grid-template-columns: 1fr;
    }

    .explain-column {
      order: -1;
    }
  }
</style>
