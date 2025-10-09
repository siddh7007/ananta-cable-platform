<script lang="ts">
  import { onDestroy } from 'svelte';
  import { toasts, removeToast, type Toast } from '$lib/stores/toasts';

  let toastList: Toast[] = [];

  const unsubscribe = toasts.subscribe(value => {
    toastList = value;
  });

  onDestroy(() => {
    unsubscribe();
  });

  function handleDismiss(toast: Toast) {
    removeToast(toast.id);
  }

  function copyRequestId(requestId: string | undefined) {
    if (!requestId) return;

    navigator.clipboard.writeText(requestId).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = requestId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }
</script>

<div class="toast-container">
  {#each toastList as toast (toast.id)}
    <div
      class="toast toast-{toast.type}"
      class:toast-with-request-id={toast.requestId}
      role="alert"
      aria-live="assertive"
    >
      <div class="toast-content">
        <div class="toast-header">
          <h4 class="toast-title">{toast.title}</h4>
          <button
            class="toast-close"
            on:click={() => handleDismiss(toast)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>

        <div class="toast-message">
          {toast.message}
        </div>

        {#if toast.requestId}
          <div class="toast-request-id">
            <span class="request-id-label">Request ID:</span>
            <code class="request-id-value">{toast.requestId}</code>
            <button
              class="copy-button"
              on:click={() => copyRequestId(toast.requestId)}
              title="Copy request ID"
              aria-label="Copy request ID to clipboard"
            >
              📋
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 400px;
    pointer-events: none;
  }

  .toast {
    margin-bottom: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    border-left: 4px solid;
  }

  .toast-error {
    background: #fee;
    border-left-color: #e74c3c;
    color: #c0392b;
  }

  .toast-warning {
    background: #fff8e1;
    border-left-color: #f39c12;
    color: #e67e22;
  }

  .toast-info {
    background: #e8f4fd;
    border-left-color: #3498db;
    color: #2980b9;
  }

  .toast-success {
    background: #e8f8e8;
    border-left-color: #27ae60;
    color: #229954;
  }

  .toast-content {
    padding: 16px;
  }

  .toast-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .toast-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .toast-close {
    background: none;
    border: none;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    margin: 0;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .toast-close:hover {
    opacity: 1;
  }

  .toast-message {
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .toast-request-id {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  .request-id-label {
    font-weight: 500;
    opacity: 0.8;
  }

  .request-id-value {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .copy-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    font-size: 12px;
    transition: background-color 0.2s;
  }

  .copy-button:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .toast-with-request-id {
    max-width: 450px;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .toast-container {
      left: 10px;
      right: 10px;
      max-width: none;
    }

    .toast-with-request-id {
      max-width: none;
    }
  }
</style>