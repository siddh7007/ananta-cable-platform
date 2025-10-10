# Master Copilot/Codex Prompts Guide

> **Purpose:** One canonical instruction sheet for Copilot/Codex so we don’t repeat ourselves.  
> **Use:** Paste the *Standard one-liner* at the top of every task prompt, then follow the sections below.

---

## 🔹 One‑liners to pin on every prompt

**Standard (use this)**
> Follow `docs/prompts/master-copilot-prompts.md`: ask-first (no assumptions), return **unified diffs only**, add/adjust tests (UI/service) for changes, keep styles minimal, no secrets in client, and finish with the verify-&-conventional-commit block.

**Ultra‑short**
> Ask first; diffs only; add tests; minimal CSS; no secrets; end with verify+conventional commit.

**UI‑focused**
> Ask-first; diffs only; add Playwright GUI test for new/changed pages; minimal accessible CSS (focus/aria-current); end with verify+conventional commit.

**Service‑focused**
> Ask-first; diffs only; schema-validate I/O; add unit+contract/e2e tests; JSON content-type strict; end with verify+conventional commit.

---

## 0) Ground rules (always apply)

- **Ask first / don’t assume:** If anything is unclear (paths, names, frameworks, endpoints, types), print what you found and **ask** before editing.
- **Diffs-only output:** Return **unified diffs** for created/changed files. No screenshots; keep prose minimal and actionable.
- **Repo layout:**
  - Portal (SvelteKit): `apps/portal/src/routes/**`
  - Gateway: `services/api-gateway/**`
  - BFF: `services/bff-portal/**`
  - Projects: `services/projects/**`
  - Shared contracts: `shared/contracts/**`
  - SDK: `@cable-platform/client-sdk` (generated)
- **Auth:** `DEV_AUTH_BYPASS=true` → bypass; otherwise apply role checks.
- **Env:** Portal uses `VITE_*` vars only (client-safe). **Never** expose secrets in client code.
- **Accessibility:** Headings, focus-visible rings, `aria-*`, keyboard support. Skip links where relevant.
- **Testing:**
  - UI: Playwright under `apps/portal/tests/**` when changing/adding UI.
  - Services: unit + contract + e2e as applicable.
- **Content-Type:** Enforce `application/json` on request bodies; respond with JSON + correct headers.

---

## 1) Reusable post‑prompt verify & commit block

```bash
# Lint, build, tests
pnpm -w run lint
pnpm -w run build
pnpm -w run test || true

# Keep GUI tests green for portal changes
pnpm --filter portal run test:ui || true

# Conventional Commit
git add -A
git commit -m "<type>(<scope>): <concise change> (prompt <N>)"
```

**Types:** feat, fix, chore, docs, refactor, perf, test, build, ci  
**Scopes:** portal, api-gateway, bff-portal, projects, drawings, drc, contracts, shared, ci, docs, security, infra

---

## 2) Prompt skeleton to copy for each task

```
**Follow:** docs/prompts/master-copilot-prompts.md (ask-first, diffs-only, tests, minimal CSS, no secrets, verify+commit).

**Goal:** <what to build/change in one paragraph>

**Ask first / confirm (don’t assume):**
- Confirm paths: <list>
- Confirm endpoints/types: <list>
- If missing or different, show what exists and ask how to map.

**Implementation:**
- Files to add/update: <explicit paths>
- Key behaviors: <bullets of must-haves>
- Accessibility: <bullets>
- Error handling: <bullets>
- Styling: minimal, local; no external frameworks unless requested.

**Tests:**
- UI: Playwright spec path + assertions.
- Service: unit/contract/e2e as applicable.

**Acceptance criteria:**
- <short, checkable list>

**Return:**
- Unified diffs only.
- If unclear, print findings and ask before proceeding.
```

---

## 3) Common conventions

- **Request ID:** Accept/generate `x-request-id`; echo in all responses; surface in portal toasts.
- **Tracing:** If enabled, propagate `traceparent` end‑to‑end.
- **Logging:** One JSON line per request start/end; redact PII; truncate large bodies.
- **Schemas:** JSON Schemas → `shared/contracts/schemas/v1/**`; OpenAPI → `shared/contracts/openapi/v1/**`.
- **SDK:** Prefer generated SDK; if missing, **ask** to regenerate before hand-writing wrappers.
- **Empty states:** UI must render gracefully with empty/unavailable data; never crash.
- **Color/tokens:** Use minimal tokens; avoid heavy UI kits unless requested.

---

## 4) Handy snippets

**Skip link (SvelteKit layout)**
```svelte
<a class="skip-link" href="#main">Skip to content</a>
<slot />
<style>
.skip-link{position:absolute;left:-9999px}
.skip-link:focus{left:0;top:0;background:#fff;padding:.5rem 1rem;z-index:1000}
</style>
```

**Active link (Svelte/SvelteKit)**
```svelte
<script lang="ts">
  import { page } from '$app/stores';
  export let href = '/';
  $: active = $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
</script>
<a {href} aria-current={active ? 'page' : undefined} class:active={active}><slot/></a>
```

**Unified API result shape**
```ts
export type Ok<T> = { ok: true; data: T; requestId?: string }
export type Err = { ok: false; error: string; status?: number; details?: unknown; requestId?: string }
```

**Playwright boilerplate**
```ts
import { test, expect } from '@playwright/test';
test.describe('GUI smoke', () => {
  test('page renders heading without console errors', async ({ page }) => {
    page.on('console', msg => { if (msg.type() === 'error') throw new Error(msg.text()); });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
```

---

## 5) Placement & usage

- Save this file at: `docs/prompts/master-copilot-prompts.md` in the repo.
- Reference it at the top of each task prompt:  
  _“Follow `docs/prompts/master-copilot-prompts.md` conventions: ask-first, diffs-only, tests, minimal CSS, no secrets, verify+commit.”_

---

## 6) Optional VS Code helpers

- `.vscode/settings.json`: enable formatOnSave, Svelte & ESLint integrations.
- `.vscode/tasks.json`: shortcuts for `lint`, `build`, `test`, `test:ui`.
- Snippet: “Prompt skeleton” for quick insertion in cards.
