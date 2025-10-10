# Dashboard Integration Proposal

## Current Situation

We just replaced the **Welcome page** at `/` with a **Dashboard**:

### What We Had (Before)

```
/ → Welcome to Cable Platform
    - Marketing copy
    - Quick links to DRC, Synthesis, Drawing Generation
    - New user onboarding messaging
```

### What We Have Now (After)

```
/ → Dashboard
    - System Health tile
    - Recent Projects tile (empty)
    - Latest Quotes tile (empty)
    - Recent Orders tile (empty)
```

## Problem Statement

We've lost the welcoming, onboarding-friendly experience for:

- New users who need to understand what the platform does
- First-time visitors who need clear CTAs
- Users looking for quick access to key features

The dashboard is great for **returning users** but poor for **first-time users**.

---

## 🎯 Proposed Solutions

### **Option 1: Hybrid Home Page (RECOMMENDED)**

Keep `/` as the home page but make it **adaptive** based on user activity:

#### For New/Empty Users:

Show the **Welcome experience** with quick links when:

- No recent projects
- No recent activity
- First visit

#### For Active Users:

Show the **Dashboard** when:

- User has projects/quotes/orders
- System detects returning user
- Has recent activity

**Implementation:**

```svelte
<!-- apps/portal/src/routes/+page.svelte -->
<script lang="ts">
  export let data: DashboardData;

  // Detect if user is new/empty
  $: isEmpty =
    data.projects.length === 0 &&
    data.quotes.length === 0 &&
    data.orders.length === 0;
</script>

{#if isEmpty}
  <!-- Show Welcome Page with Quick Links -->
  <WelcomeView />
{:else}
  <!-- Show Dashboard -->
  <DashboardView {data} />
{/if}
```

**Pros:**

- Best user experience for both personas
- No routing changes needed
- Progressive disclosure of complexity
- Natural onboarding → dashboard transition

**Cons:**

- Slightly more complex component logic
- Need to maintain both views

---

### **Option 2: Separate Routes**

Create distinct routes for different purposes:

```
/              → Welcome Page (keep original)
/dashboard     → Dashboard (move current impl here)
/projects      → Projects list
/quotes        → Quotes list
/orders        → Orders list
```

Add a **"View Dashboard"** button on the welcome page.

**Pros:**

- Clear separation of concerns
- Both experiences always available
- Easy to navigate between them

**Cons:**

- Extra click to reach dashboard
- Need to update navigation
- Which one is the "home"?

---

### **Option 3: Dashboard with Welcome Card**

Keep dashboard at `/` but add a **dismissible Welcome card** when empty:

```
Dashboard
├── [Welcome Card] ← Shows when no data, can be dismissed
│   ├── "Get Started with Cable Platform"
│   ├── Quick links to DRC, Synthesis
│   └── [Dismiss × ]
├── System Health
├── Recent Projects (empty → "Get started" link)
├── Latest Quotes (empty)
└── Recent Orders (empty)
```

**Pros:**

- Single page, no routing complexity
- Welcome message contextually appears
- Doesn't interrupt experienced users

**Cons:**

- Less prominent than full welcome page
- Welcome card might get dismissed too soon

---

### **Option 4: Welcome Page First, Dashboard in Navigation**

Keep the original welcome page at `/`, add dashboard to navigation:

```
Navigation:
├── Home (/)           → Welcome page
├── Dashboard          → Dashboard
├── DRC
├── Synthesis
└── ...
```

**Pros:**

- Marketing/welcome stays primary
- Dashboard available via navigation
- Clear mental model

**Cons:**

- Dashboard not the default view
- Requires navigation bar update
- Less discoverable

---

## 💡 My Recommendation: **Option 1 (Hybrid Home Page)**

### Why?

1. **Best UX**: Adapts to user's experience level
2. **No routing changes**: `/` stays home
3. **Progressive**: New users see simple, returning users see powerful
4. **Smart defaults**: Empty state = welcome, activity = dashboard

### Implementation Plan

```typescript
// apps/portal/src/routes/+page.svelte

<script lang="ts">
  import WelcomeView from '$lib/components/WelcomeView.svelte';
  import DashboardView from '$lib/components/DashboardView.svelte';
  import type { DashboardData } from './+page';

  export let data: DashboardData;

  // Detect if user has any activity
  $: hasActivity =
    data.projects.length > 0 ||
    data.quotes.length > 0 ||
    data.orders.length > 0;
</script>

<svelte:head>
  <title>
    {hasActivity ? 'Dashboard' : 'Welcome'} - Cable Platform Portal
  </title>
</svelte:head>

{#if hasActivity}
  <DashboardView {data} />
{:else}
  <WelcomeView healthStatus={data.health.status} />
{/if}
```

### Files to Create:

1. `apps/portal/src/lib/components/WelcomeView.svelte` - Extract old welcome page
2. `apps/portal/src/lib/components/DashboardView.svelte` - Extract current dashboard
3. Update `apps/portal/src/routes/+page.svelte` - Hybrid logic

### Optional Enhancement:

Add a manual toggle button for users who want to switch views:

```svelte
<div class="view-toggle">
  <button on:click={() => showDashboard = !showDashboard}>
    {showDashboard ? 'View Welcome' : 'View Dashboard'}
  </button>
</div>
```

---

## Alternative: **Quick Implementation (Option 3)**

If you want minimal changes right now, add a hero section to the dashboard:

```svelte
<!-- At the top of dashboard grid -->
{#if isEmpty}
  <section class="welcome-banner">
    <h2>Welcome to Cable Platform! 🚀</h2>
    <p>Get started by running a Design Rule Check or creating a synthesis proposal.</p>
    <div class="cta-buttons">
      <a href="/drc" class="button-primary">Design Rule Check</a>
      <a href="/synthesis" class="button-secondary">Synthesis</a>
    </div>
  </section>
{/if}
```

---

## Questions for You

Before I implement, please tell me:

1. **Which option do you prefer?** (1, 2, 3, or 4)
2. **User priority**: Is this portal more for returning users (dashboard first) or new users (welcome first)?
3. **Do you want to keep both experiences** or focus on one?
4. **Navigation**: Do you have a nav bar where we could add a dashboard link?

Let me know and I'll implement the chosen solution!
