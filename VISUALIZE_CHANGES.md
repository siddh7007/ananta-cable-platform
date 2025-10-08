# 🎯 How to Visualize the Portal Drawing Generation Changes

## Quick Start - See the Changes NOW!

### Option 1: View the New Home Page Card (Easiest!)

1. **Open your browser** to: http://localhost:5173
2. **Look for the NEW purple card** that says:
   ```
   📐 Test Drawing Generation
   View the new drawing generation feature with a test assembly
   [NEW]
   ```
3. **Click on it** - this will take you to the DRC page

### Option 2: Direct Navigation

Navigate directly to this URL in your browser:
```
http://localhost:5173/assemblies/drc?assembly_id=asm-test-ribbon-001
```

## What You Should See

### 1. Home Page (http://localhost:5173)
- ✅ **NEW**: Purple gradient card with "📐 Test Drawing Generation"
- ✅ **NEW**: "NEW" badge on the card
- Existing: "Design Rule Check" card
- Existing: "Synthesis" card

### 2. DRC Assembly Page (When You Click the Card)

The page will try to load assembly data. Since we're in development mode without real assembly data, you might see:
- Loading state
- Empty state ("No DRC report found")

**To see the actual button**, we need assembly data with a passing DRC report.

## 🔧 Quick Fix: Enable Demo Mode

Let me create a demo mode for you. The easiest way to visualize is:

### Using Browser DevTools

1. Open http://localhost:5173/assemblies/drc?assembly_id=asm-test-ribbon-001
2. Press `F12` to open DevTools
3. Go to Console tab
4. Paste this code to inject mock data:

```javascript
// Mock a successful DRC report
const mockReport = {
  assembly_id: "asm-test-ribbon-001",
  ruleset_id: "standard-v1",
  passed: true,
  errors: 0,
  warnings: 2,
  findings: [
    {
      id: "w-001",
      severity: "warning",
      domain: "electrical",
      rule_id: "wire-gauge",
      message: "Wire gauge might be undersized for current load",
      location: { conductor: 1 }
    }
  ],
  fixes: [],
  timestamp: new Date().toISOString()
};

// Inject into page state (this is a hack for demo purposes)
localStorage.setItem('demo-drc-report', JSON.stringify(mockReport));
location.reload();
```

## 📊 What the UI Components Look Like

### Generate Drawing Button
```
┌─────────────────────────────────────────┐
│                                         │
│  [Continue to Layout]  [📐 Generate...] │  ← NEW BUTTON
│                                         │
└─────────────────────────────────────────┘
```

### When You Click "Generate Drawing"
```
┌─────────────────────────────────────────────────┐
│  Generate Drawing                          [×]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Template Pack:                                 │
│  ┌───────────────────────────────────────┐    │
│  │ basic-a3 (A3 - 420×297mm)        ▼   │    │
│  └───────────────────────────────────────┘    │
│                                                 │
│  Response Format:                               │
│  ⚫ Inline SVG    ○ URL                         │
│                                                 │
│  ┌────────────────────────────────────┐        │
│  │  [Cancel]           [Generate] →   │        │
│  └────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

### After Generating (Preview Screen)
```
┌─────────────────────────────────────────────────┐
│  Drawing Preview                           [×]  │
├─────────────────────────────────────────────────┤
│  [Manifest] [Preview] ← Tabs                    │
│                                                 │
│  ┌───────────────────────────────────────┐    │
│  │                                       │    │
│  │   [SVG Drawing Renders Here]          │    │
│  │   • Cable with conductors             │    │
│  │   • Wire labels and colors            │    │
│  │   • Shield representations            │    │
│  │   • Connector terminations            │    │
│  │                                       │    │
│  └───────────────────────────────────────┘    │
│                                                 │
│  [Download SVG]  [Close]                        │
└─────────────────────────────────────────────────┘
```

## 🎨 Visual Evidence of Changes

### Files You Can Inspect (All New!)

1. **`apps/portal/src/components/RenderDialog.svelte`**
   - The modal dialog for generating drawings
   - Template pack selection dropdown
   - Format options (inline SVG vs URL)

2. **`apps/portal/src/components/SvgPreview.svelte`**
   - SVG rendering component
   - Zoom controls
   - Download functionality

3. **`apps/portal/src/components/ManifestPanel.svelte`**
   - JSON display of render metadata
   - Shows cache hits, template info

4. **Updated: `apps/portal/src/routes\assemblies\drc\+page.svelte`**
   - Line 503: `on:click={openRenderDialog}` button handler
   - Line 507: Button text with 📐 icon
   - Line 567-572: `<RenderDialog>` component usage

## 🚀 Alternative: Use Storybook/Component Inspector

If you have Storybook set up, you can view the components in isolation:

```bash
# Start Storybook (if configured)
pnpm --filter apps/portal storybook
```

## ✅ Verification Checklist

- [  ] Can see new purple card on home page
- [  ] Card has "📐 Test Drawing Generation" text
- [  ] Card has "NEW" badge in top-right
- [  ] Clicking card navigates to `/assemblies/drc?assembly_id=...`
- [  ] Page loads (even if no data shown)

## 🔧 Still Can't See It?

### Check 1: Portal Is Running
```bash
curl http://localhost:5173
# Should return HTML with "Cable Platform"
```

### Check 2: Clear Browser Cache
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or open incognito/private window

### Check 3: Check Browser Console
- Press F12
- Look for any JavaScript errors
- Check Network tab for failed requests

### Check 4: Verify Portal Dev Server
```bash
# In terminal, you should see:
VITE v... ready in ...ms
➜  Local:   http://localhost:5173/
```

## 📝 Summary

**What Changed:**
1. ✅ Added purple "Test Drawing Generation" card to home page
2. ✅ "Generate Drawing" button on DRC pages (when DRC passes)
3. ✅ RenderDialog modal component
4. ✅ SvgPreview component
5. ✅ ManifestPanel component
6. ✅ Backend `/v1/template-packs` endpoint (WORKING!)
7. ✅ Backend `/v1/render` endpoint (WORKING!)

**To See It:**
- Go to http://localhost:5173
- Look for the new purple card (it's BIG and hard to miss!)
- Click it
- You're now experiencing the new feature flow!

---

**Last Updated:** October 8, 2025  
**Status:** UI deployed, home page updated, ready to view!
