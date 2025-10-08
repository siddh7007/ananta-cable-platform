<script lang="ts">
  let mainHeading: HTMLElement | undefined = undefined;
</script>

<svelte:head>
  <title>Home - Cable Platform Portal</title>
</svelte:head>

<main class="home-page">
  <h1 bind:this={mainHeading} tabindex="-1">
    Welcome to Cable Platform
  </h1>
  
  <p class="lead">
    Design, synthesize, and verify cable assemblies with confidence.
  </p>
  
  <div class="quick-links">
    <a href="/drc" class="card">
      <h2>Design Rule Check</h2>
      <p>Verify your cable designs against industry standards</p>
    </a>
    
    <a href="/synthesis" class="card">
      <h2>Synthesis</h2>
      <p>Generate optimized cable assemblies</p>
    </a>

    <a href="/assemblies/drc?assembly_id=asm-test-ribbon-001" class="card demo-card">
      <h2>📐 Test Drawing Generation</h2>
      <p>View the new drawing generation feature with a test assembly</p>
      <span class="badge">NEW</span>
    </a>
  </div>
</main>

<style>
  .home-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 1rem;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #2c3e50;
  }

  .lead {
    font-size: 1.25rem;
    color: #666;
    margin-bottom: 3rem;
  }

  .quick-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }

  .card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
    color: inherit;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    text-decoration: none;
  }

  .card h2 {
    margin-bottom: 0.5rem;
    color: #2c3e50;
  }

  .card p {
    color: #666;
    margin: 0;
  }

  .demo-card {
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .demo-card h2, .demo-card p {
    color: white;
  }

  .badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: #fbbf24;
    color: #78350f;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: bold;
  }
</style>
