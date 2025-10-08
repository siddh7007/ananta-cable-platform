<script lang="ts">
  import { onMount } from 'svelte';
  import { route } from '../../../lib/router.js';
  import { api } from '../../../lib/api/client.js';
  import type { SynthesisProposal, PartRef } from '../../../lib/types/api.js';

  let mainHeading: HTMLElement;
  let proposal: SynthesisProposal | null = null;
  let loading = true;
  let error: string | null = null;
  let locks: Record<string, string> = {}; // section -> mpn

  // Telemetry store
  let telemetry: string[] = [];

  function emitTelemetry(event: string, data?: any) {
    const entry = `${new Date().toISOString()}: ${event}${data ? ` - ${JSON.stringify(data)}` : ''}`;
    telemetry = [...telemetry, entry];
    console.log('Telemetry:', entry);
  }

  // Get draft_id from URL params
  $: draftId = $route.params.draft_id;

  onMount(async () => {
    if (!draftId) {
      error = 'No draft_id provided in URL parameters';
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
      error = 'Network error occurred while generating proposal';
      console.error('Synthesis propose error:', err);
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
      error = 'Network error occurred during recompute';
      console.error('Synthesis recompute error:', err);
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
        // Navigate to layout step
        window.location.hash = `/assemblies/layout?assembly_id=${response.data.assembly_id}`;
      } else {
        error = response.error || 'Failed to accept synthesis proposal';
      }
    } catch (err) {
      error = 'Network error occurred during acceptance';
      console.error('Synthesis accept error:', err);
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

<main bind:this={mainHeading} tabindex="-1">
  <h1>Synthesis Review</h1>

  {#if loading}
    <div class="loading" role="status" aria-label="Generating synthesis proposal">
      <p>Generating synthesis proposal...</p>
    </div>
  {:else if error}
    <div class="error" role="alert">
      <h2>Error</h2>
      <p>{error}</p>
    </div>
  {:else if proposal}
    <!-- Warnings Banner -->
    {#if proposal.warnings.length > 0}
      <div class="warnings" role="alert" aria-label="Synthesis warnings">
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
      <div class="errors" role="alert" aria-label="Synthesis errors preventing continuation">
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
          <div class="part-selector" role="radiogroup" aria-label="Cable selection">
            {#each getPartOptions('cable', proposal.cable.primary, proposal.cable.alternates) as part, i}
              <label class="part-option">
                <input
                  type="radio"
                  name="cable"
                  value={part.mpn}
                  checked={i === 0}
                  on:change={() => selectAlternate('cable', part.mpn)}
                  aria-describedby="cable-{part.mpn}-description"
                />
                <div class="part-info" id="cable-{part.mpn}-description">
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
            <div class="part-selector" role="radiogroup" aria-label="End A connector selection">
              {#each getPartOptions('endA_connector', proposal.endpoints.endA.connector, []) as part, i}
                <label class="part-option">
                  <input
                    type="radio"
                    name="endA_connector"
                    value={part.mpn}
                    checked={i === 0}
                    on:change={() => selectAlternate('endA_connector', part.mpn)}
                    aria-describedby="endA-connector-{part.mpn}-description"
                  />
                  <div class="part-info" id="endA-connector-{part.mpn}-description">
                    <strong>{part.mpn}</strong>
                    <div class="part-details">{part.family} - {part.series}</div>
                    {#if part.notes}<div class="part-notes">{part.notes}</div>{/if}
                  </div>
                </label>
              {/each}
            </div>

            {#if proposal.endpoints.endA.contacts}
              <h4>Contacts</h4>
              <div class="part-selector" role="radiogroup" aria-label="End A contacts selection">
                {#each getPartOptions('endA_contacts', proposal.endpoints.endA.contacts.primary, proposal.endpoints.endA.contacts.alternates) as part, i}
                  <label class="part-option">
                    <input
                      type="radio"
                      name="endA_contacts"
                      value={part.mpn}
                      checked={i === 0}
                      on:change={() => selectAlternate('endA_contacts', part.mpn)}
                      aria-describedby="endA-contacts-{part.mpn}-description"
                    />
                    <div class="part-info" id="endA-contacts-{part.mpn}-description">
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
            <div class="part-selector" role="radiogroup" aria-label="End B connector selection">
              {#each getPartOptions('endB_connector', proposal.endpoints.endB.connector, []) as part, i}
                <label class="part-option">
                  <input
                    type="radio"
                    name="endB_connector"
                    value={part.mpn}
                    checked={i === 0}
                    on:change={() => selectAlternate('endB_connector', part.mpn)}
                    aria-describedby="endB-connector-{part.mpn}-description"
                  />
                  <div class="part-info" id="endB-connector-{part.mpn}-description">
                    <strong>{part.mpn}</strong>
                    <div class="part-details">{part.family} - {part.series}</div>
                    {#if part.notes}<div class="part-notes">{part.notes}</div>{/if}
                  </div>
                </label>
              {/each}
            </div>

            {#if proposal.endpoints.endB.contacts}
              <h4>Contacts</h4>
              <div class="part-selector" role="radiogroup" aria-label="End B contacts selection">
                {#each getPartOptions('endB_contacts', proposal.endpoints.endB.contacts.primary, proposal.endpoints.endB.contacts.alternates) as part, i}
                  <label class="part-option">
                    <input
                      type="radio"
                      name="endB_contacts"
                      value={part.mpn}
                      checked={i === 0}
                      on:change={() => selectAlternate('endB_contacts', part.mpn)}
                      aria-describedby="endB-contacts-{part.mpn}-description"
                    />
                    <div class="part-info" id="endB-contacts-{part.mpn}-description">
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
          <div class="accessories-list" role="list" aria-label="Selected accessories">
            {#each proposal.endpoints.endA.accessories.concat(proposal.endpoints.endB.accessories) as accessory, i}
              <div class="accessory-item" role="listitem">
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
            <table class="wirelist-table" aria-label="Wire list">
              <thead>
                <tr>
                  <th scope="col">Wire ID</th>
                  <th scope="col">From</th>
                  <th scope="col">To</th>
                  <th scope="col">Color</th>
                  <th scope="col">AWG</th>
                  <th scope="col">Length (m)</th>
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
            <table class="bom-table" aria-label="Bill of materials">
              <thead>
                <tr>
                  <th scope="col">MPN</th>
                  <th scope="col">Description</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Role</th>
                  <th scope="col">Reason</th>
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
          <div class="explain-log" role="log" aria-label="Synthesis explanation rules">
            {#each proposal.explain as rule}
              <div class="explain-entry">{rule}</div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="actions">
      <button
        class="btn btn-secondary"
        on:click={handleRecompute}
        disabled={loading}
        aria-label="Recompute synthesis with current selections"
      >
        {loading ? 'Recomputing...' : 'Recompute'}
      </button>

      <button
        class="btn btn-primary"
        on:click={handleAccept}
        disabled={loading || hasErrors()}
        aria-label={hasErrors() ? 'Cannot continue due to errors' : 'Accept synthesis and continue to layout'}
      >
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
    border: 1px solid #b3d9ff;
  }

  .error {
    background: #ffe6e6;
    border: 1px solid #ffb3b3;
    color: #d63030;
  }

  .warnings {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .warnings h3 {
    color: #856404;
    margin-top: 0;
  }

  .errors {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .errors h3 {
    color: #721c24;
    margin-top: 0;
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
    gap: 1.5rem;
  }

  .explain-column {
    position: sticky;
    top: 2rem;
    height: fit-content;
  }

  .card {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
  }

  .card h4 {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: #555;
    font-size: 1rem;
  }

  .part-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .part-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .part-option:hover {
    border-color: #007bff;
  }

  .part-option input[type="radio"] {
    margin-top: 0.25rem;
    flex-shrink: 0;
  }

  .part-info {
    flex: 1;
  }

  .part-info strong {
    display: block;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .part-details {
    color: #666;
    font-size: 0.9rem;
  }

  .part-notes {
    color: #888;
    font-size: 0.8rem;
    font-style: italic;
    margin-top: 0.25rem;
  }

  .accessories-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .accessory-item {
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .table-container {
    overflow-x: auto;
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
    border-bottom: 1px solid #e1e5e9;
  }

  .wirelist-table th,
  .bom-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #333;
  }

  .explain-log {
    max-height: 600px;
    overflow-y: auto;
    background: #f8f9fa;
    border-radius: 4px;
    padding: 0.5rem;
  }

  .explain-entry {
    padding: 0.25rem 0;
    border-bottom: 1px solid #e1e5e9;
    font-family: monospace;
    font-size: 0.85rem;
    color: #555;
  }

  .explain-entry:last-child {
    border-bottom: none;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid #e1e5e9;
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

  /* Responsive design */
  @media (max-width: 1024px) {
    .synthesis-grid {
      grid-template-columns: 1fr;
    }

    .explain-column {
      position: static;
    }
  }

  @media (max-width: 768px) {
    main {
      padding: 1rem;
    }

    .card {
      padding: 1rem;
    }

    .actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }
</style>