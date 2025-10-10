# 🏠 Dashboard Integration - Visual Guide

## Current Navigation Structure

```
┌─────────────────────────────────────────────────┐
│  Cable Platform  [Home] [DRC] [Synthesis]      │  ← Existing Nav
└─────────────────────────────────────────────────┘

Current Routes:
/ ────────────→ Dashboard (NEW - just added)
/drc ─────────→ Design Rule Check
/synthesis ───→ Synthesis
```

---

## 🎯 RECOMMENDED: Option 1 - Smart/Adaptive Home

### Visual Flow:

```
User visits: /
       │
       ├─── Has activity? ──→ YES ──→ Show Dashboard
       │                              ┌─────────────────────┐
       │                              │ 📊 Dashboard        │
       │                              │ ├─ System Health    │
       │                              │ ├─ Recent Projects  │
       │                              │ ├─ Latest Quotes    │
       │                              │ └─ Recent Orders    │
       │                              └─────────────────────┘
       │
       └─── Has activity? ──→ NO ───→ Show Welcome
                                      ┌─────────────────────┐
                                      │ 👋 Welcome!         │
                                      │                     │
                                      │ Get Started:        │
                                      │ [→ Run DRC]         │
                                      │ [→ Synthesis]       │
                                      │ [→ Drawings]        │
                                      └─────────────────────┘
```

### What "Has Activity" Means:

- User has projects (length > 0), OR
- User has quotes (length > 0), OR
- User has orders (length > 0)

### User Experience:

**First Visit:**

```
1. User lands on /
2. Sees: "Welcome to Cable Platform" + Quick Links
3. Clicks "Run DRC" → goes to /drc
4. Creates first project
5. Returns to /
6. NOW sees: Dashboard with their project!
```

**Returning User:**

```
1. User lands on /
2. Immediately sees Dashboard with their activity
3. Can jump to recent projects/quotes/orders
```

---

## 📐 Proposed File Structure

```
apps/portal/src/
├── routes/
│   ├── +page.ts              (keeps current logic - fetches data)
│   ├── +page.svelte          (NEW LOGIC - switches between views)
│   ├── drc/
│   └── synthesis/
│
└── lib/
    ├── components/
    │   ├── Nav.svelte           (existing - no changes)
    │   ├── WelcomeView.svelte   (NEW - extracted from old +page.svelte)
    │   └── DashboardView.svelte (NEW - extracted from current +page.svelte)
    │
    └── format.ts                (existing)
```

---

## 🔧 Implementation Changes

### 1. Create `WelcomeView.svelte` (New Component)

```svelte
<!-- apps/portal/src/lib/components/WelcomeView.svelte -->
<script lang="ts">
  export let healthStatus: 'ok' | 'degraded' | 'fail' = 'ok';
</script>

<main class="home-page">
  <h1>Welcome to Cable Platform</h1>
  <p class="lead">Design, synthesize, and verify cable assemblies...</p>

  <div class="quick-links">
    <a href="/drc" class="card">
      <h2>Design Rule Check</h2>
      <p>Verify your cable designs...</p>
    </a>
    <!-- ... other cards ... -->
  </div>
</main>
```

### 2. Create `DashboardView.svelte` (New Component)

```svelte
<!-- apps/portal/src/lib/components/DashboardView.svelte -->
<script lang="ts">
  import type { DashboardData } from '../routes/+page';
  export let data: DashboardData;
</script>

<main class="dashboard-page">
  <h1>Dashboard</h1>
  <!-- ... current dashboard tiles ... -->
</main>
```

### 3. Update `+page.svelte` (Smart Router)

```svelte
<!-- apps/portal/src/routes/+page.svelte -->
<script lang="ts">
  import WelcomeView from '$lib/components/WelcomeView.svelte';
  import DashboardView from '$lib/components/DashboardView.svelte';
  import type { DashboardData } from './+page';

  export let data: DashboardData;

  // Smart detection
  $: hasActivity =
    data.projects.length > 0 ||
    data.quotes.length > 0 ||
    data.orders.length > 0;
</script>

<svelte:head>
  <title>
    {hasActivity ? 'Dashboard' : 'Home'} - Cable Platform Portal
  </title>
</svelte:head>

{#if hasActivity}
  <DashboardView {data} />
{:else}
  <WelcomeView healthStatus={data.health.status} />
{/if}
```

---

## 🚀 Alternative: Quick Fix (5 minutes)

If you want minimal changes right now, just add this to the current dashboard:

```svelte
<!-- At the top of apps/portal/src/routes/+page.svelte -->

{#if data.projects.length === 0 && data.quotes.length === 0}
  <div class="welcome-banner">
    <h2>Welcome to Cable Platform! 👋</h2>
    <p>Get started by creating your first design:</p>
    <div class="quick-actions">
      <a href="/drc" class="btn-primary">Run DRC</a>
      <a href="/synthesis" class="btn-secondary">Start Synthesis</a>
    </div>
  </div>
{/if}

<!-- Then show dashboard tiles below -->
```

---

## 📊 Comparison Table

| Aspect               | Current State      | Option 1 (Adaptive) | Quick Fix                  |
| -------------------- | ------------------ | ------------------- | -------------------------- |
| New users see        | Dashboard (empty)  | Welcome + CTAs ✅   | Welcome banner + Dashboard |
| Returning users see  | Dashboard ✅       | Dashboard ✅        | Dashboard ✅               |
| Implementation time  | -                  | 30 min              | 5 min                      |
| Code complexity      | Low                | Medium              | Low                        |
| User experience      | Poor for new users | Best for both ✅    | Good compromise            |
| Maintains both views | No                 | Yes ✅              | Yes                        |

---

## 🤔 What Should We Do?

**Tell me:**

1. **Do you like the adaptive approach?** (Show welcome when empty, dashboard when active)
2. **Or prefer always showing dashboard** with a welcome banner at top when empty?
3. **Or keep them separate?** (/ = welcome, /dashboard = dashboard)

I'll implement whichever you choose! 🚀
