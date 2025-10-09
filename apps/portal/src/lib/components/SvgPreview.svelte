<script lang="ts">
  import { onMount } from 'svelte';

  export let svgContent: string;
  export let assemblyId: string;
  export let onClose: () => void;
  export let onDownload: () => void;

  let containerRef: HTMLDivElement;
  let svgRef: HTMLElement;
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.2;

  function zoomIn() {
    scale = Math.min(scale + ZOOM_STEP, MAX_SCALE);
  }

  function zoomOut() {
    scale = Math.max(scale - ZOOM_STEP, MIN_SCALE);
  }

  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
  }

  function fitToScreen() {
    if (!containerRef || !svgRef) return;

    const containerRect = containerRef.getBoundingClientRect();
    const svgRect = svgRef.getBoundingClientRect();

    const scaleX = containerRect.width / svgRect.width;
    const scaleY = containerRect.height / svgRect.height;

    scale = Math.min(scaleX, scaleY, 1) * 0.9; // 90% of available space
    translateX = 0;
    translateY = 0;
  }

  function handleMouseDown(event: MouseEvent) {
    if (event.button !== 0) return; // Only left click
    isDragging = true;
    dragStartX = event.clientX - translateX;
    dragStartY = event.clientY - translateY;
    event.preventDefault();
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;
    translateX = event.clientX - dragStartX;
    translateY = event.clientY - dragStartY;
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === '+' || event.key === '=') {
      zoomIn();
    } else if (event.key === '-') {
      zoomOut();
    } else if (event.key === '0') {
      resetZoom();
    }
  }

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="preview-overlay" role="dialog" aria-label="Drawing preview" aria-modal="true">
  <div class="preview-header">
    <h2 class="preview-title">Drawing Preview - Assembly {assemblyId}</h2>
    <div class="preview-controls">
      <button
        type="button"
        class="control-btn"
        on:click={zoomOut}
        aria-label="Zoom out"
        title="Zoom out (-)"
      >
        <span aria-hidden="true">−</span>
      </button>
      <span class="zoom-level" role="status" aria-live="polite">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        class="control-btn"
        on:click={zoomIn}
        aria-label="Zoom in"
        title="Zoom in (+)"
      >
        <span aria-hidden="true">+</span>
      </button>
      <button
        type="button"
        class="control-btn"
        on:click={resetZoom}
        aria-label="Reset zoom"
        title="Reset zoom (0)"
      >
        <span aria-hidden="true">↺</span>
      </button>
      <button
        type="button"
        class="control-btn"
        on:click={fitToScreen}
        aria-label="Fit to screen"
        title="Fit to screen"
      >
        <span aria-hidden="true">⛶</span>
      </button>
      <button
        type="button"
        class="control-btn download-btn"
        on:click={onDownload}
        aria-label="Download drawing"
      >
        ↓ Download
      </button>
      <button
        type="button"
        class="control-btn close-btn"
        on:click={onClose}
        aria-label="Close preview"
      >
        ×
      </button>
    </div>
  </div>

  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="preview-container"
    bind:this={containerRef}
    on:mousedown={handleMouseDown}
    on:wheel={handleWheel}
    role="img"
    aria-label="Cable assembly drawing"
    style:cursor={isDragging ? 'grabbing' : 'grab'}
  >
    <div
      class="svg-wrapper"
      bind:this={svgRef}
      style:transform="translate({translateX}px, {translateY}px) scale({scale})"
    >
      {@html svgContent}
    </div>
  </div>

  <div class="preview-footer">
    <p class="hint-text">
      <kbd>Mouse wheel</kbd> to zoom • <kbd>Click & drag</kbd> to pan •
      <kbd>+/-</kbd> to zoom • <kbd>0</kbd> to reset • <kbd>Esc</kbd> to close
    </p>
  </div>
</div>

<style>
  .preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #1a202c;
    z-index: 2000;
    display: flex;
    flex-direction: column;
  }

  .preview-header {
    background: #2d3748;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #4a5568;
  }

  .preview-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: white;
  }

  .preview-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .control-btn {
    background: #4a5568;
    border: 1px solid #718096;
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .control-btn:hover {
    background: #718096;
  }

  .control-btn:focus-visible {
    outline: 2px solid #3182ce;
    outline-offset: 2px;
  }

  .control-btn:active {
    transform: scale(0.95);
  }

  .download-btn {
    background: #3182ce;
    border-color: #2c5aa0;
    padding: 0.5rem 1rem;
    width: auto;
  }

  .download-btn:hover {
    background: #2c5aa0;
  }

  .close-btn {
    background: #e53e3e;
    border-color: #c53030;
    font-size: 1.5rem;
  }

  .close-btn:hover {
    background: #c53030;
  }

  .zoom-level {
    color: #cbd5e0;
    font-weight: 500;
    font-size: 0.875rem;
    min-width: 4rem;
    text-align: center;
    user-select: none;
  }

  .preview-container {
    flex: 1;
    overflow: hidden;
    background:
      linear-gradient(45deg, #2d3748 25%, transparent 25%),
      linear-gradient(-45deg, #2d3748 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #2d3748 75%),
      linear-gradient(-45deg, transparent 75%, #2d3748 75%);
    background-size: 20px 20px;
    background-position:
      0 0,
      0 10px,
      10px -10px,
      -10px 0px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .svg-wrapper {
    transform-origin: center center;
    transition: transform 0.1s ease-out;
    user-select: none;
  }

  .svg-wrapper :global(svg) {
    display: block;
    background: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .preview-footer {
    background: #2d3748;
    padding: 0.75rem 1.5rem;
    border-top: 1px solid #4a5568;
  }

  .hint-text {
    margin: 0;
    font-size: 0.875rem;
    color: #cbd5e0;
    text-align: center;
  }

  kbd {
    background: #4a5568;
    border: 1px solid #718096;
    border-radius: 3px;
    padding: 0.125rem 0.375rem;
    font-family: monospace;
    font-size: 0.8em;
    color: white;
  }
</style>
