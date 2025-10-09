# Design Tokens & Base CSS Implementation ✅

**Commit:** `e9789a16d7e977be500192eae227011ac82b7e05`  
**Message:** `chore(portal): add design tokens and base CSS (prompt 28)`

---

## 📦 What Was Added

### 1. **tokens.css** - Design Token System

**Location:** `apps/portal/src/lib/styles/tokens.css`

Comprehensive CSS custom properties for consistent design:

#### Spacing Scale

- `--spacing-xs` through `--spacing-xl` (4px to 32px)

#### Border Radius

- `--radius-sm` through `--radius-xl` (4px to 16px)

#### Typography

- **Font Sizes:** `--font-size-sm` through `--font-size-3xl` (14px to 30px)
- **Font Weights:** normal, medium, semibold, bold (400-700)
- **Line Heights:** tight, normal, relaxed (1.25-1.75)

#### Transitions

- `--transition-fast`, `--transition-base`, `--transition-slow` (150ms-300ms)

#### Z-Index Scale

- `--z-base` through `--z-tooltip` (0-1600)

### 2. **base.css** - Theme System & Normalize

**Location:** `apps/portal/src/lib/styles/base.css`

#### Features:

- ✅ **Imports tokens.css** automatically
- ✅ **Light theme** (default)
- ✅ **Dark theme** via `@media (prefers-color-scheme: dark)`
- ✅ **Normalize-ish base styles**
- ✅ **Theme-aware color tokens**
- ✅ **Accessible focus styles**
- ✅ **Custom scrollbar styling**
- ✅ **Typography reset**

#### Color Tokens (Light & Dark)

```css
--color-background
--color-surface
--color-text-primary / secondary / tertiary
--color-border
--color-primary / primary-hover / primary-active
--color-success / warning / error / info
--shadow-sm / md / lg / xl
```

### 3. **Updated Layout**

**Location:** `apps/portal/src/routes/+layout.svelte`

- ✅ Imports `base.css` at the top of the script
- ✅ Removed duplicate global styles
- ✅ Kept component-specific layout styles
- ✅ Design tokens now available site-wide

### 4. **Bonus: Type Safety Fix**

**Location:** `apps/portal/src/lib/api/client.ts`

- ✅ Fixed `any` type to `AssemblyStep1` in `createDraft()` method
- ✅ Added proper type import
- ✅ Eliminated linting error

---

## 🎨 How to Use Design Tokens

### In Component Styles

```svelte
<style>
  .card {
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
    background-color: var(--color-surface);
    box-shadow: var(--shadow-md);
    transition: all var(--transition-base);
  }

  .card:hover {
    background-color: var(--color-surface-hover);
    box-shadow: var(--shadow-lg);
  }

  .title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
</style>
```

### Typography Tokens

```css
h1 {
  font-size: var(--font-size-3xl);
}
p {
  margin-bottom: var(--spacing-md);
}
button {
  padding: var(--spacing-sm) var(--spacing-lg);
}
```

### Theme Colors

```css
.primary-button {
  background-color: var(--color-primary);
  color: var(--color-background);
}

.primary-button:hover {
  background-color: var(--color-primary-hover);
}
```

---

## 🌓 Dark Mode Support

Dark mode is **automatic** based on system preferences:

```css
@media (prefers-color-scheme: dark) {
  /* Colors automatically adjust */
}
```

All color tokens automatically switch when user has dark mode enabled.

---

## ✅ Verification

### Build Status

```bash
✅ pnpm -w run lint  # 11 warnings (pre-existing, not from our changes)
✅ pnpm -w run build # All services built successfully
✅ Portal built in 11.7s
```

### Files Changed

```
 apps/portal/src/lib/api/client.ts     |  20 +++-
 apps/portal/src/lib/styles/base.css   | 220 +++++++++++++++++++++
 apps/portal/src/lib/styles/tokens.css |  53 ++++++
 apps/portal/src/routes/+layout.svelte |  31 +----
 4 files changed, 293 insertions(+), 31 deletions(-)
```

### No Component Styles Changed

✅ Existing component styles remain untouched  
✅ Tokens are available site-wide but not forced  
✅ Components can opt-in to using tokens gradually

---

## 🎯 Benefits

1. **Consistency** - Unified spacing, colors, and typography
2. **Maintainability** - Change tokens in one place, update everywhere
3. **Dark Mode** - Automatic theme switching
4. **Accessibility** - Proper focus states and color contrast
5. **Developer Experience** - Clear, semantic variable names
6. **Type Safety** - Bonus fix for API client types

---

## 📚 Token Reference

### Spacing

- `xs` = 4px | `sm` = 8px | `md` = 16px
- `lg` = 24px | `xl` = 32px

### Radius

- `sm` = 4px | `md` = 8px
- `lg` = 12px | `xl` = 16px

### Font Sizes

- `sm` = 14px | `md` = 16px | `lg` = 18px
- `xl` = 20px | `2xl` = 24px | `3xl` = 30px

### Transitions

- `fast` = 150ms | `base` = 200ms | `slow` = 300ms

---

## 🚀 Next Steps

### Gradual Migration

Existing components can be updated over time to use tokens:

**Before:**

```css
.card {
  padding: 16px;
  border-radius: 8px;
  background: #f5f5f5;
}
```

**After:**

```css
.card {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
```

### Future Enhancements

- [ ] Add animation tokens
- [ ] Add container width tokens
- [ ] Add breakpoint tokens
- [ ] Create utility classes
- [ ] Document color palette usage

---

**Status:** ✅ Complete and Committed  
**Prompt:** 28  
**SvelteKit Compatible:** Yes  
**Ready for Production:** Yes 🎉
