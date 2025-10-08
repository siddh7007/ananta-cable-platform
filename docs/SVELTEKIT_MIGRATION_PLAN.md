# SvelteKit Migration Plan for Cable Platform Portal

**Document Version:** 1.0  
**Created:** October 8, 2025  
**Status:** Planning Phase  
**Estimated Timeline:** 3-4 weeks for full migration

---

## 📊 Current State Analysis

### Current Setup
- ✅ Plain Svelte 4 + Vite
- ✅ Custom hash-based router (`lib/router.ts`)
- ✅ Manual route handling in `App.svelte`
- ✅ 8 Svelte components (4 routes, 4 shared components)
- ✅ TypeScript with path aliases (`$lib`)
- ✅ Docker containerized
- ❌ No SSR/SSG capabilities
- ❌ No built-in routing
- ❌ No built-in API routes
- ❌ No built-in data loading

### Current File Structure
```
apps/portal/
├── src/
│   ├── App.svelte                  # Main app with custom router
│   ├── main.ts                     # Vite entry point
│   ├── lib/
│   │   ├── router.ts               # Custom hash-based router
│   │   ├── api/
│   │   │   └── client.ts           # API client
│   │   ├── components/
│   │   │   ├── Nav.svelte          # Navigation bar
│   │   │   └── DRCResults.svelte   # DRC results component
│   │   ├── stores/
│   │   │   └── telemetry.ts        # Telemetry store
│   │   └── types/
│   │       └── api.ts              # TypeScript types
│   └── routes/
│       ├── Home.svelte             # Home page
│       ├── DRC.svelte              # Legacy DRC form
│       ├── Synthesis.svelte        # Legacy synthesis
│       └── assemblies/
│           ├── drc/
│           │   └── +page.svelte    # Step 3 DRC review
│           └── synthesis/
│               └── +page.svelte    # Step 2 synthesis review
├── index.html                      # Vite HTML template
├── package.json
├── vite.config.ts                  # Vite configuration
└── tsconfig.json                   # TypeScript config
```

---

## 🎯 Migration Strategy: Incremental Hybrid Approach

We recommend a **phased migration** rather than a big-bang rewrite to minimize risk and maintain functionality throughout the process.

---

## Phase 1: Parallel SvelteKit Setup (Week 1)

### Goals
- Set up SvelteKit alongside existing Vite app
- Zero disruption to current functionality
- Test SvelteKit configuration

### 1.1 Install SvelteKit Dependencies

```bash
cd apps/portal
pnpm add -D @sveltejs/kit @sveltejs/adapter-node
pnpm add -D @sveltejs/adapter-static  # Optional: for static export
```

**Dependencies to add:**
- `@sveltejs/kit`: Core SvelteKit framework
- `@sveltejs/adapter-node`: Node.js adapter for SSR
- `@sveltejs/adapter-static`: Static site adapter (optional)

### 1.2 Create SvelteKit Configuration

**File: `apps/portal/svelte.config.js`**

```javascript
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  
  kit: {
    adapter: adapter({
      out: 'build',
      precompress: false,
      envPrefix: ''
    }),
    
    // Path aliases (matching current setup)
    alias: {
      '$lib': './src/lib',
      '$lib/*': './src/lib/*'
    },
    
    // Match your current routing structure
    files: {
      routes: 'src/routes',
      lib: 'src/lib'
    },
    
    // Environment variables
    env: {
      publicPrefix: 'PUBLIC_'
    }
  }
};

export default config;
```

### 1.3 Update Vite Config for SvelteKit

**File: `apps/portal/vite.config.ts`**

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  
  server: { 
    host: true, 
    port: 5173 
  },
  
  // Keep your workspace dependencies optimized
  optimizeDeps: {
    include: [
      '@cable-platform/client-sdk',
      '@cable-platform/contracts',
      '@cable-platform/validation'
    ]
  }
});
```

### 1.4 Create SvelteKit App Structure

**New directory structure:**

```
apps/portal/src/
├── app.html                       # NEW: SvelteKit app template
├── routes/
│   ├── +layout.svelte            # NEW: Root layout with Nav
│   ├── +page.svelte              # NEW: Home page (/)
│   ├── drc/
│   │   └── +page.svelte          # Legacy DRC form
│   ├── synthesis/
│   │   └── +page.svelte          # Legacy synthesis
│   └── assemblies/
│       ├── drc/
│       │   ├── +page.svelte      # Step 3 DRC review
│       │   └── +page.ts          # NEW: Data loading (optional)
│       └── synthesis/
│           ├── +page.svelte      # Step 2 synthesis
│           └── +page.ts          # NEW: Data loading (optional)
└── lib/
    ├── components/               # Unchanged
    ├── api/                      # Unchanged
    ├── stores/                   # Unchanged
    └── types/                    # Unchanged
```

### 1.5 Create `app.html`

**File: `apps/portal/src/app.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Cable Platform Portal - Design, Synthesis, and DRC" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

**Notes:**
- `%sveltekit.head%`: Replaced with page-specific head content
- `%sveltekit.body%`: Replaced with page content
- `data-sveltekit-preload-data="hover"`: Enables link preloading on hover

### 1.6 Update `.gitignore`

```gitignore
# SvelteKit
.svelte-kit/
build/
```

---

## Phase 2: Migrate Router & Layout (Week 1-2)

### Goals
- Replace custom router with SvelteKit routing
- Create root layout with Nav component
- Remove dependency on `lib/router.ts`

### 2.1 Create Root Layout

**File: `apps/portal/src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import Nav from '$lib/components/Nav.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { telemetry } from '$lib/stores/telemetry';
  
  // Track page views with telemetry
  $: if ($page.url.pathname) {
    telemetry.track('page.view', {
      path: $page.url.pathname,
      params: Object.fromEntries($page.url.searchParams)
    });
  }
  
  onMount(() => {
    console.log('Portal initialized');
  });
</script>

<div class="app-container">
  <Nav />
  
  <main class="main-content">
    <slot />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
  }

  :global(h1, h2, h3, h4, h5, h6) {
    margin-top: 0;
    font-weight: 600;
  }

  :global(a) {
    color: #007bff;
    text-decoration: none;
  }

  :global(a:hover) {
    text-decoration: underline;
  }

  /* Focus styles for accessibility */
  :global(:focus-visible) {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
    padding: 0;
  }
</style>
```

### 2.2 Update Nav Component for SvelteKit

**File: `apps/portal/src/lib/components/Nav.svelte`**

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  
  // Reactive current path
  $: currentPath = $page.url.pathname;
  
  // Helper to check if current route matches
  function isActive(path: string): boolean {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  }
</script>

<nav class="main-nav">
  <div class="nav-container">
    <div class="nav-brand">
      <a href="/">Cable Platform</a>
    </div>
    
    <ul class="nav-links">
      <li class:active={isActive('/')}>
        <a href="/">Home</a>
      </li>
      <li class:active={isActive('/drc')}>
        <a href="/drc">DRC</a>
      </li>
      <li class:active={isActive('/synthesis')}>
        <a href="/synthesis">Synthesis</a>
      </li>
    </ul>
  </div>
</nav>

<style>
  .main-nav {
    background-color: #2c3e50;
    color: white;
    padding: 1rem 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-brand a {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
  }

  .nav-links {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 2rem;
  }

  .nav-links li a {
    color: rgba(255, 255, 255, 0.8);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .nav-links li a:hover,
  .nav-links li.active a {
    color: white;
    background-color: rgba(255, 255, 255, 0.1);
    text-decoration: none;
  }
</style>
```

### 2.3 Files to Remove (After Migration Complete)

```bash
# Remove custom router (Phase 7)
apps/portal/src/lib/router.ts

# Remove old entry point
apps/portal/src/main.ts

# Remove old root component (replaced by layout)
apps/portal/src/App.svelte

# Remove Vite HTML template (replaced by app.html)
apps/portal/index.html
```

---

## Phase 3: Migrate Routes (Week 2)

### Goals
- Convert all routes to SvelteKit format
- Implement data loading where beneficial
- Maintain existing functionality

### 3.1 Convert Home Page

**File: `apps/portal/src/routes/+page.svelte`**

```svelte
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
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }

  .card h2 {
    margin-bottom: 0.5rem;
    color: #2c3e50;
  }

  .card p {
    color: #666;
    margin: 0;
  }
</style>
```

### 3.2 Migrate DRC Review Page

**File: `apps/portal/src/routes/assemblies/drc/+page.svelte`**

**Current issues to fix:**
- Currently uses custom `route` store → Change to `$page` from `$app/stores`
- Currently uses custom `navigate()` → Change to `goto()` from `$app/navigation`

**Required changes:**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';  // ✅ SvelteKit navigation
  import { page } from '$app/stores';       // ✅ SvelteKit page store
  import { api } from '$lib/api/client';
  import type { DrcReport, DrcFinding, DrcFix, DrcDomain } from '$lib/types/api';
  import { telemetry } from '$lib/stores/telemetry';

  // Props for accessibility
  export let mainHeading: HTMLElement | undefined = undefined;

  // Query parameter (SvelteKit way)
  $: assemblyId = $page.url.searchParams.get('assembly_id');

  // State
  let loading = true;
  let report: DrcReport | null = null;
  let error: string | null = null;
  let selectedFixIds = new Set<string>();
  let applyingFixes = false;

  // ... rest of component logic ...

  function continueToLayout() {
    if (canContinue && assemblyId) {
      telemetry.track('drc.continue', { assembly_id: assemblyId });
      goto(`/assemblies/layout?assembly_id=${assemblyId}`); // ✅ No # needed!
    }
  }

  onMount(() => {
    loadDrcReport();
  });
</script>

<!-- Rest of component remains the same -->
```

### 3.3 Add Server-Side Data Loading (Optional but Recommended)

**File: `apps/portal/src/routes/assemblies/drc/+page.ts`**

```typescript
import type { PageLoad } from './$types';
import { api } from '$lib/api/client';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ url, fetch }) => {
  const assemblyId = url.searchParams.get('assembly_id');
  
  if (!assemblyId) {
    throw error(400, {
      message: 'Assembly ID is required',
      details: 'Please provide an assembly_id query parameter'
    });
  }
  
  try {
    // Load DRC report
    const report = await api.getDrcReport(assemblyId);
    
    return { 
      report, 
      assemblyId,
      error: null
    };
  } catch (err) {
    console.error('Failed to load DRC report:', err);
    
    // Return error state instead of throwing
    // This allows the page to handle the error gracefully
    return { 
      report: null, 
      assemblyId,
      error: err instanceof Error ? err.message : 'Failed to load DRC report'
    };
  }
};

// Enable prerendering for this page (optional)
export const prerender = false;

// Enable SSR (server-side rendering)
export const ssr = true;
```

**Update `+page.svelte` to use loaded data:**

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  // Data is already loaded from +page.ts!
  $: report = data.report;
  $: assemblyId = data.assemblyId;
  $: initialError = data.error;
  
  // State for runtime errors
  let error: string | null = initialError;
  let loading = false; // Already loaded on mount
  
  // ... rest of component ...
</script>
```

### 3.4 Create Error Page

**File: `apps/portal/src/routes/+error.svelte`**

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  
  $: status = $page.status;
  $: message = $page.error?.message || 'An error occurred';
</script>

<svelte:head>
  <title>Error {status} - Cable Platform Portal</title>
</svelte:head>

<main class="error-page">
  <div class="error-container">
    <h1>{status}</h1>
    <h2>{message}</h2>
    
    {#if status === 404}
      <p>The page you're looking for doesn't exist.</p>
    {:else if status === 400}
      <p>Bad request. Please check your input and try again.</p>
    {:else if status >= 500}
      <p>Something went wrong on our end. Please try again later.</p>
    {/if}
    
    <a href="/" class="btn-home">Go back to Home</a>
  </div>
</main>

<style>
  .error-page {
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .error-container {
    text-align: center;
    max-width: 600px;
  }

  h1 {
    font-size: 6rem;
    margin: 0;
    color: #e74c3c;
  }

  h2 {
    font-size: 1.5rem;
    margin: 1rem 0;
    color: #2c3e50;
  }

  p {
    color: #666;
    margin: 1rem 0 2rem;
  }

  .btn-home {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #007bff;
    color: white;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .btn-home:hover {
    background-color: #0056b3;
    text-decoration: none;
  }
</style>
```

### 3.5 Migration Summary for Routes

| Current Route | Status | Action Required |
|---------------|--------|-----------------|
| `/` (Home) | ❌ Not migrated | Move `routes/Home.svelte` → `routes/+page.svelte` |
| `/drc` (Legacy DRC) | ❌ Not migrated | Move `routes/DRC.svelte` → `routes/drc/+page.svelte` |
| `/synthesis` | ❌ Not migrated | Move `routes/Synthesis.svelte` → `routes/synthesis/+page.svelte` |
| `/assemblies/drc` | ⚠️ Partially ready | Update imports to use `$app/stores` and `$app/navigation` |
| `/assemblies/synthesis` | ⚠️ Partially ready | Update imports to use `$app/stores` and `$app/navigation` |

---

## Phase 4: Update Dockerfile (Week 2)

### Goals
- Build SvelteKit app instead of Vite static site
- Create production-ready Node.js image
- Optimize for size and performance

### 4.1 Update Build Process

**File: `Dockerfile.portal`**

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/portal ./apps/portal
COPY packages ./packages
COPY shared ./shared

# Install dependencies and build
RUN corepack enable && \
    pnpm i --filter portal... && \
    pnpm --filter portal build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy built app and package files
COPY --from=builder /app/apps/portal/build ./build
COPY --from=builder /app/apps/portal/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV PORT=5173

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run SvelteKit Node server
CMD ["node", "build"]
```

### 4.2 Update docker-compose.yml

**File: `docker-compose.yml`**

```yaml
services:
  portal:
    build:
      context: .
      dockerfile: Dockerfile.portal
    ports:
      - "5173:5173"
    environment:
      - NODE_ENV=production
      - PUBLIC_BFF_URL=http://localhost:3000
      - BFF_INTERNAL_URL=http://bff-portal:3000
    depends_on:
      - bff-portal
    restart: unless-stopped
```

### 4.3 Add Health Check Endpoint

**File: `apps/portal/src/routes/health/+server.ts`**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'portal'
  });
};
```

---

## Phase 5: API Integration Enhancement (Week 3)

### Goals
- Create server-side API routes (optional)
- Improve security by hiding backend URLs
- Enable SSR for better performance

### 5.1 Create Server-Side API Routes

**File: `apps/portal/src/routes/api/drc/[assembly_id]/+server.ts`**

```typescript
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

// Use internal BFF URL (not exposed to client)
const BFF_URL = process.env.BFF_INTERNAL_URL || 'http://bff-portal:3000';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const { assembly_id } = params;
  
  try {
    const response = await fetch(`${BFF_URL}/api/drc/${assembly_id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw error(response.status, {
        message: errorData.message || 'Failed to fetch DRC report',
        details: errorData
      });
    }
    
    const data = await response.json();
    return json(data);
  } catch (err) {
    console.error('DRC API error:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    
    throw error(500, {
      message: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};
```

**File: `apps/portal/src/routes/api/drc/[assembly_id]/apply-fixes/+server.ts`**

```typescript
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

const BFF_URL = process.env.BFF_INTERNAL_URL || 'http://bff-portal:3000';

export const POST: RequestHandler = async ({ params, request, fetch }) => {
  const { assembly_id } = params;
  
  try {
    const body = await request.json();
    
    const response = await fetch(
      `${BFF_URL}/api/drc/${assembly_id}/apply-fixes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw error(response.status, {
        message: errorData.message || 'Failed to apply DRC fixes',
        details: errorData
      });
    }
    
    const data = await response.json();
    return json(data);
  } catch (err) {
    console.error('Apply fixes API error:', err);
    
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    
    throw error(500, {
      message: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};
```

### 5.2 Update API Client to Use Server Routes

**File: `apps/portal/src/lib/api/client.ts`**

```typescript
import { browser } from '$app/environment';

const API_BASE_URL = browser 
  ? '/api'  // Use server-side API routes in browser
  : process.env.BFF_INTERNAL_URL || 'http://bff-portal:3000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getDrcReport(assemblyId: string): Promise<DrcReport> {
    const response = await fetch(`${this.baseUrl}/drc/${assemblyId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get DRC report: ${response.statusText}`);
    }
    
    return response.json();
  }

  async applyDrcFixes(assemblyId: string, fixIds: string[]): Promise<DrcReport> {
    const response = await fetch(
      `${this.baseUrl}/drc/${assemblyId}/apply-fixes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fix_ids: fixIds })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to apply DRC fixes: ${response.statusText}`);
    }
    
    return response.json();
  }

  // ... other methods ...
}

export const api = new ApiClient(API_BASE_URL);
```

### 5.3 Benefits of Server-Side API Routes

| Benefit | Description |
|---------|-------------|
| 🔒 **Security** | Hide internal service URLs from client |
| 🚀 **Performance** | Server-side fetching is faster (no CORS) |
| 🔐 **Authentication** | Add auth middleware in one place |
| 📊 **Analytics** | Track API usage server-side |
| 🛡️ **Rate Limiting** | Implement rate limits per user |
| 🔄 **Request Transform** | Modify requests/responses as needed |

---

## Phase 6: Testing & Validation (Week 3-4)

### Goals
- Ensure all functionality works in SvelteKit
- Test build and deployment process
- Validate performance improvements

### 6.1 Update Package Scripts

**File: `apps/portal/package.json`**

```json
{
  "name": "portal",
  "type": "module",
  "private": true,
  "version": "0.2.0",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "lint": "eslint . --ext .ts,.js,.svelte",
    "format": "prettier --write .",
    "test": "vitest"
  },
  "dependencies": {
    "@cable-platform/client-sdk": "workspace:*",
    "@cable-platform/contracts": "workspace:*",
    "@cable-platform/validation": "workspace:*",
    "svelte": "^4.2.19"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "^5.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^3.1.2",
    "svelte-check": "^3.6.0",
    "typescript": "^5",
    "vite": "^5",
    "vitest": "^1.0.0"
  }
}
```

### 6.2 Test Checklist

#### Functional Testing

- [ ] **Home Page**
  - [ ] Loads without errors
  - [ ] Navigation links work
  - [ ] Telemetry fires on page view

- [ ] **DRC Legacy Page** (`/drc`)
  - [ ] Form submission works
  - [ ] Results display correctly
  - [ ] Error handling works

- [ ] **DRC Review Page** (`/assemblies/drc?assembly_id=X`)
  - [ ] Loads with valid assembly_id
  - [ ] Shows error for missing/invalid assembly_id
  - [ ] Findings grouped by domain
  - [ ] Checkbox selection works
  - [ ] "Select All" / "Deselect All" works
  - [ ] "Apply Selected Fixes" works
  - [ ] Report refreshes after applying fixes
  - [ ] Keyboard navigation works (spacebar/enter)
  - [ ] Telemetry events fire

- [ ] **Synthesis Page** (`/assemblies/synthesis?draft_id=X`)
  - [ ] Similar checks as DRC review

- [ ] **Navigation**
  - [ ] URLs don't have `#` hash
  - [ ] Back/forward buttons work
  - [ ] Direct URL access works
  - [ ] Query parameters preserved

#### Build & Deployment Testing

- [ ] **Development**
  ```bash
  pnpm --filter portal dev
  # Check: http://localhost:5173 loads
  ```

- [ ] **Production Build**
  ```bash
  pnpm --filter portal build
  # Check: No TypeScript errors
  # Check: Build completes successfully
  ```

- [ ] **Production Preview**
  ```bash
  pnpm --filter portal preview
  # Check: Built app runs correctly
  ```

- [ ] **Docker Build**
  ```bash
  docker-compose build portal
  # Check: Build completes successfully
  # Check: Image size reasonable
  ```

- [ ] **Docker Run**
  ```bash
  docker-compose up -d portal
  # Check: Container starts
  # Check: Health check passes
  # Check: App accessible
  ```

#### Performance Testing

- [ ] **Page Load Times**
  - [ ] Initial load < 3s
  - [ ] Navigation < 500ms
  - [ ] Data fetching < 2s

- [ ] **Bundle Size**
  - [ ] Check bundle analyzer output
  - [ ] Ensure no duplicate dependencies
  - [ ] Verify code splitting works

#### Accessibility Testing

- [ ] **Keyboard Navigation**
  - [ ] Tab order is logical
  - [ ] All interactive elements reachable
  - [ ] Focus indicators visible

- [ ] **Screen Reader**
  - [ ] Page titles announce correctly
  - [ ] ARIA labels present
  - [ ] Error messages announced

### 6.3 Test Commands

```bash
# Type checking
pnpm --filter portal check

# Linting
pnpm --filter portal lint

# Run tests (if configured)
pnpm --filter portal test

# Build and preview
pnpm --filter portal build
pnpm --filter portal preview
```

---

## Phase 7: Cleanup (Week 4)

### Goals
- Remove legacy code
- Clean up old configurations
- Update documentation

### 7.1 Files to Remove

```bash
# Remove custom router
rm apps/portal/src/lib/router.ts

# Remove old entry point
rm apps/portal/src/main.ts

# Remove old root component
rm apps/portal/src/App.svelte

# Remove Vite HTML template
rm apps/portal/index.html

# Remove old route files (after migration)
rm apps/portal/src/routes/Home.svelte
rm apps/portal/src/routes/DRC.svelte
rm apps/portal/src/routes/Synthesis.svelte
```

### 7.2 Update Documentation

**Files to update:**
- [ ] `README.md` - Update setup instructions
- [ ] `docs/PORTAL_SETUP.md` - Document SvelteKit architecture
- [ ] `docs/DEPLOYMENT.md` - Update deployment process
- [ ] `VERIFICATION.md` - Update verification steps

### 7.3 Git Cleanup

```bash
# Remove tracked files
git rm apps/portal/src/lib/router.ts
git rm apps/portal/src/main.ts
git rm apps/portal/src/App.svelte
git rm apps/portal/index.html

# Commit cleanup
git add -A
git commit -m "chore(portal): Complete SvelteKit migration and remove legacy code"
```

---

## Phase 8: Update Documentation (Week 4)

### Goals
- Document new architecture
- Update setup guides
- Create migration notes for future reference

### 8.1 Create Portal Architecture Document

**File: `docs/PORTAL_ARCHITECTURE.md`**

```markdown
# Portal Architecture

## Tech Stack
- **Framework**: SvelteKit 2.0
- **UI Library**: Svelte 4
- **Build Tool**: Vite 5
- **Language**: TypeScript 5
- **Adapter**: Node.js (adapter-node)

## Directory Structure
[Document new structure]

## Routing
[Document SvelteKit routing patterns]

## Data Loading
[Document +page.ts load functions]

## API Integration
[Document server-side API routes]
```

### 8.2 Update README

**Add to `apps/portal/README.md`:**

```markdown
## SvelteKit Portal

### Development
\`\`\`bash
pnpm --filter portal dev
\`\`\`

### Build
\`\`\`bash
pnpm --filter portal build
\`\`\`

### Routes
- `/` - Home page
- `/drc` - Design Rule Check (legacy form)
- `/synthesis` - Synthesis (legacy)
- `/assemblies/drc?assembly_id=X` - DRC Review (Step 3)
- `/assemblies/synthesis?draft_id=X` - Synthesis Review (Step 2)

### Environment Variables
- `PUBLIC_BFF_URL` - Public BFF URL (client-side)
- `BFF_INTERNAL_URL` - Internal BFF URL (server-side)
```

---

## Phase 9: Deploy to Staging (Week 4)

### Goals
- Deploy to staging environment
- Perform end-to-end testing
- Gather feedback

### 9.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors in dev
- [ ] No TypeScript errors
- [ ] Docker build succeeds
- [ ] Environment variables configured
- [ ] Health checks working
- [ ] Monitoring/logging configured

### 9.2 Deployment Steps

```bash
# 1. Build and tag image
docker-compose build portal
docker tag ananta-cable-platform-portal:latest registry.example.com/portal:staging

# 2. Push to registry
docker push registry.example.com/portal:staging

# 3. Deploy to staging
kubectl apply -f k8s/staging/portal-deployment.yaml

# 4. Verify deployment
kubectl rollout status deployment/portal -n staging
```

### 9.3 Post-Deployment Validation

- [ ] Health check endpoint returns 200
- [ ] All routes accessible
- [ ] API calls succeed
- [ ] Performance metrics acceptable
- [ ] No error spikes in logs
- [ ] Telemetry data flowing

---

## Phase 10: Production Deployment (Week 5)

### Goals
- Deploy to production
- Monitor performance
- Ensure zero downtime

### 10.1 Pre-Production Checklist

- [ ] Staging environment stable for 48+ hours
- [ ] All stakeholders approved
- [ ] Rollback plan documented
- [ ] Database migrations completed (if any)
- [ ] Monitoring alerts configured
- [ ] Runbook updated

### 10.2 Deployment Strategy

**Blue-Green Deployment:**

```bash
# 1. Deploy new version (green)
kubectl apply -f k8s/prod/portal-deployment-v2.yaml

# 2. Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=portal,version=v2 -n prod

# 3. Run smoke tests
curl https://portal-v2.example.com/health

# 4. Switch traffic to new version
kubectl patch service portal -n prod -p '{"spec":{"selector":{"version":"v2"}}}'

# 5. Monitor for 30 minutes
# If issues, rollback:
kubectl patch service portal -n prod -p '{"spec":{"selector":{"version":"v1"}}}'

# 6. If stable, remove old version
kubectl delete deployment portal-v1 -n prod
```

### 10.3 Post-Deployment Monitoring

**Monitor for 24 hours:**
- [ ] Error rates < 1%
- [ ] Response times < 500ms (p95)
- [ ] No memory leaks
- [ ] CPU usage stable
- [ ] User feedback positive

---

## 🎯 Expected Benefits After Migration

### Immediate Benefits

1. ✅ **Official Routing**
   - No custom router maintenance
   - Better error handling
   - Standard patterns

2. ✅ **Better Developer Experience**
   - Type-safe routing with `$types`
   - Auto-imports for `$app/*` modules
   - Built-in TypeScript support

3. ✅ **Data Loading**
   - `load` functions for server/client data
   - Parallel data fetching
   - Better loading states

4. ✅ **SEO Ready**
   - SSR capability for better indexing
   - Meta tags management
   - Dynamic titles

5. ✅ **Form Actions**
   - Built-in form handling
   - Progressive enhancement
   - Better UX without JS

6. ✅ **Error Handling**
   - Standardized error pages
   - Error boundaries
   - Better error reporting

### Long-term Benefits

1. 🚀 **Performance**
   - Automatic code splitting
   - Smaller initial bundles
   - Faster page transitions

2. 🔄 **Preloading**
   - Smart link prefetching
   - Faster navigation
   - Better perceived performance

3. 📦 **Smaller Bundles**
   - Better tree-shaking
   - Dead code elimination
   - Optimized builds

4. 🔐 **Security**
   - Server-side auth patterns
   - CSRF protection built-in
   - Safer API endpoints

5. 📱 **Progressive Enhancement**
   - Works without JavaScript
   - Better accessibility
   - Resilient to failures

6. 🌐 **i18n Ready**
   - Built-in localization support
   - Multiple language routing
   - Better user experience globally

---

## ⚠️ Breaking Changes to Address

### 1. URL Format Change

**Before:**
```
http://localhost:5173/#/assemblies/drc?assembly_id=123
```

**After:**
```
http://localhost:5173/assemblies/drc?assembly_id=123
```

**Impact:**
- Bookmarks will break (need redirect)
- External links need updating
- Analytics URLs change

**Mitigation:**
Create redirect handler in `+layout.server.ts`:

```typescript
export const load: LayoutServerLoad = async ({ url }) => {
  // Redirect old hash-based URLs
  if (url.hash.startsWith('#/')) {
    const newPath = url.hash.substring(1);
    throw redirect(301, newPath);
  }
};
```

### 2. Navigation API Change

**Before:**
```typescript
import { navigate } from '$lib/router';
navigate('/path');
```

**After:**
```typescript
import { goto } from '$app/navigation';
goto('/path');
```

**Impact:**
- All `navigate()` calls need updating
- Import statements need changing

**Mitigation:**
- Find and replace across codebase
- Update linting rules to catch old imports

### 3. Route Data Access Change

**Before:**
```typescript
import { route } from '$lib/router';
$: assemblyId = $route.params.assembly_id;
```

**After:**
```typescript
import { page } from '$app/stores';
$: assemblyId = $page.url.searchParams.get('assembly_id');
```

**Impact:**
- All route data access needs updating
- Different API for params vs search params

**Mitigation:**
- Comprehensive search and replace
- Test all query parameter usage

### 4. Build Output Change

**Before:**
- Static files in `dist/`
- Served by any static file server
- No server required

**After:**
- Node.js server in `build/`
- Requires Node.js runtime
- More complex deployment

**Impact:**
- Deployment process changes
- Hosting requirements change
- Infrastructure costs may increase

**Mitigation:**
- Update CI/CD pipelines
- Update infrastructure as code
- Document new deployment process

### 5. Environment Variables

**Before:**
- All env vars available via `import.meta.env`

**After:**
- Client vars must be prefixed with `PUBLIC_`
- Server vars not exposed to client

**Impact:**
- Some env vars may need renaming
- Better security (but more verbose)

**Mitigation:**
```typescript
// Before
const API_URL = import.meta.env.VITE_API_URL;

// After (client-side)
const API_URL = import.meta.env.PUBLIC_API_URL;

// After (server-side)
const API_URL = process.env.API_URL;
```

---

## 📊 Estimated Timeline

### Quick Migration (Minimal Changes)
**Duration:** 1-2 weeks

**Scope:**
- Basic SvelteKit setup
- Route conversion
- No server-side features
- Minimal testing

**Risk:** Medium

### Standard Migration (Recommended)
**Duration:** 3-4 weeks

**Scope:**
- Complete SvelteKit setup
- All routes migrated
- Server-side API routes
- Data loading with `+page.ts`
- Comprehensive testing
- Documentation updates

**Risk:** Low

### Full Migration (with Optimizations)
**Duration:** 5-6 weeks

**Scope:**
- Everything in standard
- SSR optimization
- Performance tuning
- Advanced caching
- Monitoring setup
- Gradual rollout

**Risk:** Very Low

---

## 🤔 Decision: Should You Migrate Now?

### ✅ Migrate If:

1. **Planning Major Features**
   - Adding many new routes
   - Need form handling (Step 1 builder?)
   - Want authentication/authorization

2. **SEO is Important**
   - Need better search indexing
   - Want social media previews
   - Public-facing content

3. **Performance Issues**
   - Large bundle sizes
   - Slow initial loads
   - Need code splitting

4. **Better DX Needed**
   - Team growing
   - Want type-safety
   - Need better tooling

5. **Long-term Maintenance**
   - Want framework support
   - Need ecosystem benefits
   - Planning long-term scaling

### ❌ Wait If:

1. **Current Setup Working**
   - No performance issues
   - No feature limitations
   - Team comfortable with current stack

2. **Time Constraints**
   - Close to major deadline
   - Limited developer resources
   - Other priorities higher

3. **Team Readiness**
   - Team unfamiliar with SvelteKit
   - No time for learning curve
   - Need stability right now

4. **Risk Aversion**
   - Critical period for business
   - Can't afford any downtime
   - No rollback strategy

---

## 📝 Migration Checklist Summary

### Planning Phase
- [ ] Read migration plan
- [ ] Assess current state
- [ ] Identify breaking changes
- [ ] Plan timeline
- [ ] Get team buy-in

### Phase 1: Setup
- [ ] Install SvelteKit dependencies
- [ ] Create svelte.config.js
- [ ] Update vite.config.ts
- [ ] Create app.html
- [ ] Test basic setup

### Phase 2: Layout
- [ ] Create +layout.svelte
- [ ] Update Nav component
- [ ] Test layout rendering
- [ ] Remove old App.svelte (later)

### Phase 3: Routes
- [ ] Migrate home page
- [ ] Migrate DRC pages
- [ ] Migrate synthesis pages
- [ ] Add +page.ts loaders
- [ ] Create +error.svelte
- [ ] Test all routes

### Phase 4: Docker
- [ ] Update Dockerfile
- [ ] Update docker-compose.yml
- [ ] Add health check endpoint
- [ ] Test Docker build
- [ ] Test Docker run

### Phase 5: API (Optional)
- [ ] Create server API routes
- [ ] Update API client
- [ ] Test server routes
- [ ] Update environment variables

### Phase 6: Testing
- [ ] Run type checking
- [ ] Run linting
- [ ] Manual testing
- [ ] Performance testing
- [ ] Accessibility testing

### Phase 7: Cleanup
- [ ] Remove old files
- [ ] Update .gitignore
- [ ] Clean up dependencies
- [ ] Run final tests

### Phase 8: Documentation
- [ ] Update README
- [ ] Create architecture doc
- [ ] Update deployment docs
- [ ] Create runbooks

### Phase 9: Staging
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Monitor performance
- [ ] Gather feedback

### Phase 10: Production
- [ ] Deploy to production
- [ ] Monitor closely
- [ ] Gather metrics
- [ ] Document lessons learned

---

## 🔗 Resources

### Official Documentation
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [Vite Guide](https://vitejs.dev/guide/)

### Migration Guides
- [From Vite to SvelteKit](https://kit.svelte.dev/docs/migrating)
- [Routing](https://kit.svelte.dev/docs/routing)
- [Load Functions](https://kit.svelte.dev/docs/load)
- [Form Actions](https://kit.svelte.dev/docs/form-actions)

### Community
- [SvelteKit Discord](https://discord.gg/svelte)
- [Svelte Summit](https://www.sveltesummit.com/)
- [Svelte Society](https://sveltesociety.dev/)

---

## 📞 Support & Questions

For questions about this migration:
1. Review this document
2. Check SvelteKit docs
3. Search GitHub issues
4. Ask in team chat
5. Consult tech lead

---

**Document Status:** Ready for review  
**Next Review:** After Phase 1 completion  
**Owner:** Development Team  
**Last Updated:** October 8, 2025
