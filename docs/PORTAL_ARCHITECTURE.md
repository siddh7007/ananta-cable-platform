# Portal Architecture

**Last Updated:** October 8, 2025  
**Status:** Production Ready  
**Framework:** SvelteKit 2.46.4

---

## Overview

The Cable Platform Portal is a web application built with SvelteKit that provides interfaces for Design Rule Checking (DRC) and cable assembly synthesis. The portal communicates with backend services through a Backend-for-Frontend (BFF) layer.

---

## Tech Stack

### Core Framework
- **SvelteKit:** 2.46.4 - Full-stack framework with SSR
- **Svelte:** 4.2.19 - Reactive UI component framework
- **Vite:** 5.4.20 - Build tool and dev server
- **TypeScript:** 5.9.3 - Type-safe development

### Adapter & Runtime
- **Adapter:** @sveltejs/adapter-node 5.3.3
- **Runtime:** Node.js 20 Alpine (Docker)
- **Server:** SvelteKit Node.js server

### Build & Development
- **Package Manager:** pnpm (workspace)
- **Type Checking:** svelte-check
- **Linting:** ESLint
- **Container:** Docker multi-stage build

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Portal UI (Svelte Components)              │  │
│  │  - Routes (DRC, Synthesis, Assemblies)                │  │
│  │  - Components (Nav, DRCResults, etc.)                 │  │
│  │  - Stores (telemetry, status, user)                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           │ HTTP/Fetch                       │
│                           ▼                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│                  SvelteKit Node.js Server                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    SSR Engine                         │  │
│  │  - Server-side rendering                              │  │
│  │  - Data loaders (+page.server.ts)                     │  │
│  │  - API routes (+server.ts)                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           │ Internal HTTP                    │
│                           ▼                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│                    BFF Portal (Node.js)                      │
│  - Business logic orchestration                              │
│  - Authentication/Authorization                              │
│  - Service composition                                       │
│  - API Gateway: http://bff-portal:4001                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        [DRC Service] [Catalog Svc] [Other Services]
```

---

## Directory Structure

```
apps/portal/
├── src/
│   ├── app.html                          # HTML template (replaces index.html)
│   ├── lib/                              # Shared library code
│   │   ├── api/
│   │   │   ├── client.ts                 # API client singleton
│   │   │   └── http.ts                   # HTTP configuration
│   │   ├── components/
│   │   │   ├── Nav.svelte                # Global navigation
│   │   │   └── DRCResults.svelte         # DRC results display
│   │   ├── stores/
│   │   │   ├── telemetry.ts              # Analytics/telemetry
│   │   │   ├── status.ts                 # App status tracking
│   │   │   └── user.ts                   # User state
│   │   ├── types/
│   │   │   └── api.ts                    # TypeScript type definitions
│   │   └── utils/
│   │       └── validation.ts             # Form validation helpers
│   │
│   └── routes/                           # SvelteKit file-based routing
│       ├── +layout.svelte                # Root layout (wraps all pages)
│       ├── +page.svelte                  # Home page (/)
│       ├── +error.svelte                 # Error boundary
│       │
│       ├── health/
│       │   └── +server.ts                # Health check endpoint
│       │
│       ├── api/                          # Server-side API routes
│       │   ├── drc/
│       │   │   └── [assembly_id]/
│       │   │       └── +server.ts        # DRC API proxy
│       │   └── synthesis/
│       │       ├── [draft_id]/
│       │       │   └── +server.ts        # Synthesis API proxy
│       │       └── accept/
│       │           └── [proposal_id]/
│       │               └── +server.ts    # Accept synthesis proxy
│       │
│       ├── drc/
│       │   └── +page.svelte              # DRC form page
│       │
│       ├── synthesis/
│       │   └── +page.svelte              # Synthesis form page
│       │
│       └── assemblies/
│           ├── drc/
│           │   ├── +page.svelte          # DRC review page (Step 3)
│           │   └── +page.server.ts       # Server-side data loader
│           └── synthesis/
│               ├── +page.svelte          # Synthesis review page (Step 2)
│               └── +page.server.ts       # Server-side data loader
│
├── build/                                # Production build output (Node.js server)
├── .svelte-kit/                          # SvelteKit generated files
├── static/                               # Static assets (favicon, etc.)
├── Dockerfile.portal                     # Multi-stage Docker build
├── svelte.config.js                      # SvelteKit configuration
├── vite.config.ts                        # Vite configuration
├── tsconfig.json                         # TypeScript configuration
└── package.json                          # Dependencies and scripts
```

---

## Routing System

### File-Based Routing

SvelteKit uses a file-based routing system where the file structure in `src/routes/` determines the URL structure.

#### Route Types

| File Pattern | Purpose | Example |
|--------------|---------|---------|
| `+page.svelte` | Page component | Home page, DRC form |
| `+page.ts` | Client-side data loader | Load data before rendering |
| `+page.server.ts` | Server-side data loader | SSR data fetching |
| `+server.ts` | API endpoint | REST API routes |
| `+layout.svelte` | Layout wrapper | Navigation, global styles |
| `+error.svelte` | Error boundary | 404, 500 errors |

#### Current Routes

| URL | File | Type | Description |
|-----|------|------|-------------|
| `/` | `routes/+page.svelte` | Page | Home page with quick links |
| `/drc` | `routes/drc/+page.svelte` | Page | DRC form for running checks |
| `/synthesis` | `routes/synthesis/+page.svelte` | Page | Synthesis form |
| `/assemblies/drc?assembly_id=X` | `routes/assemblies/drc/+page.svelte` | Page | DRC review (Step 3) |
| `/assemblies/synthesis?draft_id=X` | `routes/assemblies/synthesis/+page.svelte` | Page | Synthesis review |
| `/health` | `routes/health/+server.ts` | API | Health check endpoint |
| `/api/drc/:id` | `routes/api/drc/[assembly_id]/+server.ts` | API | DRC API proxy |
| `/api/synthesis/:id` | `routes/api/synthesis/[draft_id]/+server.ts` | API | Synthesis API proxy |

#### Dynamic Routes

Dynamic segments are indicated by `[parameter]`:

```
routes/api/drc/[assembly_id]/+server.ts
                └────────────┘
                     ↓
            URL: /api/drc/123
            Param: assembly_id = "123"
```

#### Query Parameters

Accessed via `$page.url.searchParams`:

```typescript
import { page } from '$app/stores';

$: assemblyId = $page.url.searchParams.get('assembly_id');
```

---

## Data Loading Patterns

### Server-Side Loading (+page.server.ts)

Used for data that should be fetched on the server before rendering:

```typescript
// routes/assemblies/drc/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {
  const assemblyId = url.searchParams.get('assembly_id');
  
  if (!assemblyId) {
    return { assemblyId: null, report: null };
  }

  try {
    const response = await fetch(`/api/drc/${assemblyId}`);
    const report = await response.json();
    return { assemblyId, report };
  } catch (err) {
    return { assemblyId, report: null, error: 'Failed to load report' };
  }
};
```

**Benefits:**
- ✅ Data available on initial page load (no loading spinners)
- ✅ Better SEO (content in HTML)
- ✅ Faster perceived performance
- ✅ Works without JavaScript

### Client-Side Loading

Used for data that changes frequently or requires user interaction:

```typescript
// In component
import { api } from '$lib/api/client';

let loading = false;
let result = null;

async function runDrc(formData) {
  loading = true;
  try {
    result = await api.runDrc(assemblyId, formData);
  } finally {
    loading = false;
  }
}
```

---

## API Integration

### Architecture

The portal uses a **server-side proxy pattern** to communicate with the BFF:

```
Browser → SvelteKit Server Routes → BFF Portal → Backend Services
         (/api/*)                   (http://bff-portal:4001)
```

### Server-Side API Routes

Located in `routes/api/`, these routes:
- Hide backend URLs from the client
- Enable server-side authentication
- Provide a clean API interface
- Handle errors consistently

Example:

```typescript
// routes/api/drc/[assembly_id]/+server.ts
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

const BFF_URL = process.env.BFF_PORTAL_URL || 'http://bff-portal:4001';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const { assembly_id } = params;
  
  try {
    const response = await fetch(`${BFF_URL}/api/drc/${assembly_id}`);
    
    if (!response.ok) {
      throw error(response.status, 'Failed to fetch DRC report');
    }
    
    const data = await response.json();
    return json(data);
  } catch (err) {
    throw error(500, 'Internal server error');
  }
};
```

### API Client

The API client (`$lib/api/client.ts`) provides a type-safe interface:

```typescript
class ApiClient {
  async getDrcReport(assemblyId: string): Promise<DrcReport> {
    const response = await fetch(`/api/drc/${assemblyId}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }
  
  async runDrc(assemblyId: string, data: DrcFormData): Promise<DrcReport> {
    const response = await fetch(`/api/drc/${assemblyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to run DRC');
    return response.json();
  }
}

export const api = new ApiClient();
```

---

## State Management

### Svelte Stores

The portal uses Svelte stores for reactive state:

#### Telemetry Store (`$lib/stores/telemetry.ts`)

Tracks user actions and page views:

```typescript
import { writable } from 'svelte/store';

export const telemetry = writable<TelemetryEvent[]>([]);

export function emitTelemetry(event: string, data?: any) {
  telemetry.update(events => [...events, { event, data, timestamp: Date.now() }]);
  console.log('[Telemetry]', event, data);
}
```

#### Status Store (`$lib/stores/status.ts`)

Tracks service health:

```typescript
export const statusStore = writable<ServiceStatus[]>([]);

export async function checkStatus() {
  const response = await fetch('/health');
  const data = await response.json();
  statusStore.set([{ name: 'portal', status: data.status }]);
}
```

#### User Store (`$lib/stores/user.ts`)

Tracks user authentication state:

```typescript
export const userStore = writable<User | null>(null);

export async function loadUser() {
  const response = await fetch('/api/user');
  const user = await response.json();
  userStore.set(user);
}
```

### SvelteKit Stores

Built-in stores provided by SvelteKit:

```typescript
import { page, navigating, updated } from '$app/stores';

// Current page data
$page.url      // URL object
$page.params   // Route parameters
$page.data     // Data from load functions
$page.error    // Error object if any
$page.status   // HTTP status code

// Navigation state
$navigating    // true during navigation

// App updates
$updated       // true when new version available
```

---

## Component Architecture

### Layout Hierarchy

```
+layout.svelte (Root Layout)
├── Nav.svelte (Global Navigation)
└── <slot> (Page Content)
    ├── +page.svelte (Home)
    ├── drc/+page.svelte (DRC Form)
    ├── synthesis/+page.svelte (Synthesis Form)
    └── assemblies/
        ├── drc/+page.svelte (DRC Review)
        │   └── DRCResults.svelte
        └── synthesis/+page.svelte (Synthesis Review)
```

### Shared Components

#### Nav Component (`$lib/components/Nav.svelte`)

Global navigation bar:
- Logo and branding
- Main navigation links
- Active route highlighting
- Responsive design

#### DRCResults Component (`$lib/components/DRCResults.svelte`)

Reusable DRC results display:
- Findings grouped by domain
- Severity indicators
- Checkbox selection
- ARIA accessibility
- Loading states

### Page Components

Each page component follows this structure:

```svelte
<script lang="ts">
  // 1. Imports
  import { page } from '$app/stores';
  import { api } from '$lib/api/client';
  
  // 2. Props (from load functions)
  export let data;
  
  // 3. Local state
  let loading = false;
  let error = null;
  
  // 4. Reactive declarations
  $: assemblyId = $page.url.searchParams.get('assembly_id');
  
  // 5. Functions
  async function handleSubmit() {
    // ...
  }
  
  // 6. Lifecycle (if needed)
  import { onMount } from 'svelte';
  onMount(() => {
    // ...
  });
</script>

<!-- 7. Head (meta tags) -->
<svelte:head>
  <title>Page Title</title>
</svelte:head>

<!-- 8. Template -->
<main>
  <!-- Content -->
</main>

<!-- 9. Styles (component-scoped) -->
<style>
  main {
    /* Scoped to this component */
  }
</style>
```

---

## Error Handling

### Error Boundary (+error.svelte)

Catches all errors and displays user-friendly messages:

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  
  $: status = $page.status;
  $: message = $page.error?.message;
</script>

<main class="error-page">
  <h1>{status}</h1>
  <h2>{message}</h2>
  <a href="/">Go Home</a>
</main>
```

### Error Types

| Status | Description | User Message |
|--------|-------------|--------------|
| 400 | Bad Request | "Please check your input" |
| 404 | Not Found | "Page doesn't exist" |
| 500 | Server Error | "Something went wrong" |

### Throwing Errors

In server routes:

```typescript
import { error } from '@sveltejs/kit';

if (!assemblyId) {
  throw error(400, 'Assembly ID required');
}
```

---

## TypeScript Types

### Generated Types

SvelteKit auto-generates types in `.svelte-kit/types/`:

```typescript
// Available in every route file
import type { PageData, PageServerLoad } from './$types';
```

### Custom Types

Defined in `$lib/types/api.ts`:

```typescript
export interface DrcReport {
  assembly_id: string;
  status: 'pass' | 'fail';
  findings: DrcFinding[];
  summary: DrcSummary;
}

export interface DrcFinding {
  domain: DrcDomain;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  where?: string;
  refs?: string[];
}

export type DrcDomain = 'electrical' | 'mechanical' | 'thermal' | 'lifecycle';
```

---

## Build & Deployment

### Development

```bash
# Start dev server
pnpm --filter portal dev

# Runs on: http://localhost:5174
# Hot module replacement enabled
# TypeScript checking in background
```

### Production Build

```bash
# Build for production
pnpm --filter portal build

# Output: build/ directory
# Contains: Node.js server + static assets
# Build time: ~6 seconds
```

### Type Checking

```bash
# Check types
pnpm --filter portal check

# Watch mode
pnpm --filter portal check:watch
```

### Docker Build

Multi-stage build for optimized images:

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install && pnpm build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/portal/build ./build
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "build/index.js"]
```

**Build stats:**
- Build time: ~6 seconds
- Image size: ~150MB
- Memory usage: 18MB (runtime)
- CPU usage: 0.03% (idle)

### Deployment

```bash
# Build image
docker-compose build portal

# Run container
docker-compose up -d portal

# Check health
curl http://localhost:5173/health
# Response: {"status":"ok","timestamp":"...","service":"portal"}
```

---

## Environment Variables

### Client-Side (Public)

Must be prefixed with `PUBLIC_`:

```bash
PUBLIC_BFF_URL=http://localhost:4001
```

Access in code:

```typescript
import { env } from '$env/dynamic/public';
const bffUrl = env.PUBLIC_BFF_URL;
```

### Server-Side (Private)

No prefix required:

```bash
BFF_PORTAL_URL=http://bff-portal:4001
```

Access in code:

```typescript
const bffUrl = process.env.BFF_PORTAL_URL;
```

### Configuration

**File: `docker-compose.yml`**

```yaml
services:
  portal:
    environment:
      - NODE_ENV=production
      - BFF_PORTAL_URL=http://bff-portal:4001
      - PUBLIC_BFF_URL=http://localhost:4001
```

---

## Performance Optimizations

### Automatic

SvelteKit automatically:
- ✅ Code splits by route
- ✅ Preloads linked pages on hover
- ✅ Optimizes bundle sizes
- ✅ Tree-shakes unused code
- ✅ Minifies production builds

### Bundle Analysis

Current build output:

```
Client bundle:   ~34KB gzipped (total)
Server bundle:   ~145KB
Total build:     ~5.77s
```

Key optimizations:
- Shared chunks extracted
- Dynamic imports for large components
- CSS scoped to components

### SSR Performance

Server-side rendering benefits:
- Initial HTML includes content (no spinner)
- Faster time to interactive
- Better SEO
- Progressive enhancement

---

## Security Considerations

### CSRF Protection

SvelteKit has built-in CSRF protection for form actions.

### Environment Variables

- ✅ Server-side vars not exposed to client
- ✅ API URLs hidden from browser
- ✅ Sensitive data stays server-side

### API Proxy Pattern

Benefits:
- Backend URLs not visible to users
- Can add auth middleware
- Rate limiting possible
- Request/response transformation

---

## Testing Strategy

### Type Safety

```bash
# Run type checking
pnpm check

# Current: 70 type warnings (non-blocking)
```

### Manual Testing

Checklist:
- [ ] All routes accessible
- [ ] Navigation works
- [ ] Forms submit correctly
- [ ] Errors display properly
- [ ] Health check returns 200

### Future: Automated Testing

Recommended additions:
- **Vitest**: Unit tests for utils/stores
- **Playwright**: E2E tests for user flows
- **Testing Library**: Component tests

---

## Monitoring & Observability

### Health Check

Endpoint: `GET /health`

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-08T12:34:56.789Z",
  "service": "portal"
}
```

### Telemetry

Events tracked:
- Page views
- DRC runs
- Synthesis runs
- Error occurrences

Console output:
```
[Telemetry] page.view { path: '/drc' }
[Telemetry] drc.run { assemblyId: '123' }
```

### Logging

Current: Console logs
Recommended: Structured logging with winston/pino

---

## Migration Notes

### What Changed

| Before | After | Impact |
|--------|-------|--------|
| Custom router | SvelteKit routing | URLs changed from `#/path` to `/path` |
| `index.html` | `app.html` | Template location changed |
| `main.ts` | SvelteKit entry | Entry point automated |
| `App.svelte` | `+layout.svelte` | Root component pattern |
| Client-only | SSR + Client | Better performance |
| Static build | Node.js server | Deployment changed |

### Breaking Changes

1. **URL Format**: `#/drc` → `/drc` (old bookmarks broken)
2. **Navigation API**: `navigate()` → `goto()`
3. **Route Data**: `$route` → `$page`
4. **Build Output**: `dist/` → `build/`
5. **Environment Vars**: Must prefix with `PUBLIC_` for client

### Benefits Gained

- ✅ Official framework support
- ✅ Server-side rendering
- ✅ Type-safe routing
- ✅ Better DX with auto-imports
- ✅ Cleaner URLs for SEO
- ✅ Automatic code splitting
- ✅ Better error handling

---

## Troubleshooting

### Common Issues

**Issue: Port 5173 already in use**

Solution:
```bash
# Dev server auto-switches to 5174
# Or manually set port
pnpm dev --port 5175
```

**Issue: Type errors in `.svelte-kit/`**

Solution:
```bash
# Regenerate types
pnpm check
```

**Issue: Docker build fails**

Solution:
```bash
# Clear cache
docker-compose build --no-cache portal
```

**Issue: Routes not found (404)**

Solution:
- Check file naming: Must be `+page.svelte`, not `page.svelte`
- Restart dev server: `pnpm dev`
- Check svelte.config.js routes path

---

## Future Enhancements

### Short Term
- [ ] Add Playwright E2E tests
- [ ] Implement proper logging (winston/pino)
- [ ] Add request tracing
- [ ] Set up error monitoring (Sentry)

### Medium Term
- [ ] Add authentication flow
- [ ] Implement WebSocket updates
- [ ] Add service worker (offline support)
- [ ] Improve accessibility (WCAG 2.1 AA)

### Long Term
- [ ] Add i18n support
- [ ] Implement caching strategy
- [ ] Add GraphQL layer
- [ ] Progressive Web App features

---

## Resources

### Official Documentation
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [Vite Guide](https://vitejs.dev/guide/)

### Internal Documentation
- [Migration Plan](./SVELTEKIT_MIGRATION_PLAN.md)
- [Migration Complete](../SVELTEKIT_MIGRATION_COMPLETE.md)
- [Phase 7 Cleanup](../SVELTEKIT_PHASE_7_CLEANUP.md)
- [Phase 6 Testing](../SVELTEKIT_PHASE_6_TESTING.md)

### Support
- Team Slack: #portal-dev
- Tech Lead: Review architecture questions
- SvelteKit Discord: Community support

---

**Document Owner:** Development Team  
**Reviewers:** Tech Lead, DevOps  
**Next Review:** After Phase 9 (Staging Deployment)
