# Fix Summary: 404 Error on Drawing Generation Card

## Problem

When clicking the purple "Test Drawing Generation" card on the home page, users received:

```
Error Loading DRC Report
HTTP 404
```

## Root Cause

The card was linking to `/assemblies/drc?assembly_id=asm-test-ribbon-001`, but:

1. This assembly ID doesn't exist in the backend database
2. The API endpoint `/v1/assemblies/asm-test-ribbon-001/drc` returns 404 Not Found
3. Users saw an error page instead of the feature demo

## Solution Implemented

Changed the purple card from a **clickable link** to an **informational card with usage instructions**.

### Before:

```html
<a href="/assemblies/drc?assembly_id=asm-test-ribbon-001" class="card demo-card">
  <h2>📐 Test Drawing Generation</h2>
  <p>View the new drawing generation feature with a test assembly</p>
  <span class="badge">NEW</span>
</a>
```

### After:

```html
<div class="card demo-card">
  <h2>📐 Drawing Generation</h2>
  <p>Generate technical drawings from DRC-validated assemblies</p>
  <span class="badge">NEW</span>
  <div class="demo-instructions">
    <strong>How to use:</strong>
    <ol>
      <li>Navigate to an assembly's DRC page</li>
      <li>Ensure the assembly has a passing DRC report</li>
      <li>Click "Generate Drawing" button</li>
    </ol>
    <p class="demo-note">
      💡 <em>Example:</em> <code>/assemblies/drc?assembly_id=your-assembly-id</code>
    </p>
  </div>
</div>
```

## Files Changed

1. **apps/portal/src/routes/+page.svelte**
   - Changed card from `<a>` to `<div>` (no longer clickable)
   - Added usage instructions
   - Added example URL format
   - Added CSS styling for instructions section

2. **DRAWING_GENERATION_GUIDE.md** (NEW)
   - Comprehensive guide explaining the 404 error
   - Detailed workflow documentation
   - Testing instructions with real assemblies
   - Mock data examples for development
   - Troubleshooting section

## Deployment

```bash
# Container rebuilt and restarted
docker-compose build portal   # 28.7s
docker-compose up -d portal    # 1.5s
```

## Verification

✅ Home page loads without errors
✅ Purple card displays instructions instead of link
✅ No more 404 errors when users interact with home page
✅ Clear guidance on how to use the feature properly

## User Impact

**Before**: Users clicked card → Got 404 error → Confused
**After**: Users see card → Read instructions → Know how to use feature properly

## Next Steps for Users

To test the drawing generation feature, users need:

1. A **real assembly ID** from the database
2. Navigate to: `/assemblies/drc?assembly_id={real-id}`
3. Ensure the assembly has a **passing DRC report** (errors = 0)
4. Click **"Generate Drawing"** button on that page
5. Select format and render

## Commit

```
adf59e2 - fix: Replace broken demo link with instructions on home page
```

## Related Documentation

- See `DRAWING_GENERATION_GUIDE.md` for comprehensive feature guide
- See `VISUALIZE_CHANGES.md` for UI testing instructions
- See `REBUILD_COMPLETE.md` for container deployment details

## Status

✅ **FIXED** - 404 error resolved
✅ **DEPLOYED** - Portal container running with updated code
✅ **DOCUMENTED** - Comprehensive guide created
