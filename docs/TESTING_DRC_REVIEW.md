# Testing the DRC Review Page - User Guide

## Overview
This guide will help you test the new Step 3 DRC Review page with fixes functionality in the cable platform portal.

## Prerequisites

### Services Running
Ensure all required services are running:
```bash
docker-compose ps
```

Should show:
- ✅ portal (port 5173)
- ✅ bff-portal (port 3000)
- ✅ api-gateway (port 8080)
- ✅ drc (port 8000)
- ✅ pg-extra (port 5442)
- ✅ supabase-db (port 5432)

### Start Services
If services aren't running:
```bash
docker-compose up -d
```

## Access the Portal

### Open in Browser
Navigate to: **http://localhost:5173**

The portal is running in development mode with hot reload enabled.

## Testing Workflow

### Option 1: Test with Mock Assembly ID

Since the DRC page requires an `assembly_id` query parameter, you can test with a direct URL:

```
http://localhost:5173/#/assemblies/drc?assembly_id=test-assembly-123
```

**Expected Behavior:**
1. Page loads with loading spinner
2. Attempts to fetch DRC report for `test-assembly-123`
3. If no report exists, automatically runs DRC
4. Displays error if backend isn't connected or assembly doesn't exist

### Option 2: Complete User Flow (Recommended)

#### Step 1: Create an Assembly (Step 1 Page)
1. Navigate to Assembly Builder: `http://localhost:5173/#/assemblies/builder`
2. Fill in assembly details:
   - **Name**: Test Cable Assembly
   - **Endpoints**: Add 2+ connector endpoints
   - **Conductor Count**: 4 (or your preference)
   - **AWG**: 22 (or your preference)
3. Click **Continue to Synthesis**
4. Note the `draft_id` in the URL

#### Step 2: Run Synthesis (Step 2 Page)
1. Should auto-navigate to: `#/assemblies/synthesis?draft_id=<id>`
2. Review synthesis proposal
3. Click **Accept Proposal**
4. Backend returns `assembly_id`
5. Auto-navigates to DRC page: `#/assemblies/drc?assembly_id=<id>`

#### Step 3: DRC Review (Step 3 Page - What We Just Built! 🎉)
This is where you test the new functionality:

##### 3.1 View Report
- **Sticky Header**: Shows overall status (PASSED/FAILED/WARNING)
- **Error/Warning Counts**: Displays in header badges
- **Summary Card**: Shows assembly_id, ruleset, version, generation time
- **Findings Section**: Issues grouped by domain

##### 3.2 Explore Findings
The page groups findings into 5 domains:
- **Mechanical**: Bend radius, cable OD issues
- **Electrical**: Ampacity, voltage, AWG violations
- **Standards**: Color coding, locale compliance
- **Labeling**: Label format, required fields
- **Consistency**: Design logic checks

Each finding shows:
- Severity chip (ERROR/WARNING/INFO)
- Code (e.g., `DRC_BEND_RADIUS`)
- Message explaining the issue
- Location (optional)
- References (optional)

##### 3.3 Review Suggested Fixes (NEW! ✨)
If DRC finds issues it can auto-fix, you'll see the **Suggested Fixes** section:

**Features to Test:**
1. **Fix List**: Each fix shows:
   - Checkbox for selection
   - Label (short description)
   - Full description
   - Effect badge (non-destructive/substitution/re-synthesis required)
   - Count of findings it addresses

2. **Select All Button**:
   - Click to select all fixes at once
   - Changes to "Deselect All" when all selected
   - Try toggling multiple times

3. **Selection Counter**:
   - Shows "X of Y selected" in real-time
   - Updates as you check/uncheck boxes

4. **Individual Selection**:
   - Click checkbox to select/deselect
   - Try spacebar key to toggle (keyboard accessibility!)
   - Try Enter key to toggle

5. **Apply Fixes Button**:
   - Disabled when no fixes selected
   - Shows count: "Apply Selected Fixes (N)"
   - Changes to "Applying Fixes..." during API call
   - Re-enables after completion

6. **After Applying**:
   - Report refreshes automatically
   - Selection cleared
   - New error/warning counts displayed
   - May show new fixes if more issues remain

##### 3.4 Continue to Layout
- **Button State**:
  - ✅ Enabled when `errors = 0` (warnings OK)
  - ❌ Disabled when `errors > 0`
  
- **Contextual Messages**:
  - With errors: "Fix all X error(s) before continuing"
  - With warnings only: "X warning(s) present. You may continue or fix them first"
  - All passed: "All checks passed! Click Continue to proceed"

- **Navigation**:
  - Click button to navigate to: `#/assemblies/layout?assembly_id=<id>`

## UI Testing Checklist

### Visual Design ✨
- [ ] Sticky header stays at top when scrolling
- [ ] Status badge shows correct color (green/red/yellow)
- [ ] Error/warning badges display counts
- [ ] Domain panels have proper spacing
- [ ] Severity chips are color-coded correctly
- [ ] Fixes section has blue border to stand out
- [ ] Loading spinner animates smoothly
- [ ] Buttons have hover effects (lift and glow)

### Interactions 🖱️
- [ ] Loading state appears when fetching report
- [ ] Error banner shows with retry button
- [ ] Domain panels expand/collapse properly
- [ ] Fix checkboxes toggle on click
- [ ] "Select All" button works correctly
- [ ] Selection counter updates in real-time
- [ ] Apply button disables when no selection
- [ ] Apply button shows loading state
- [ ] Continue button enables/disables correctly

### Keyboard Accessibility ⌨️
- [ ] Tab key navigates through all interactive elements
- [ ] Spacebar toggles fix checkboxes
- [ ] Enter key toggles fix checkboxes
- [ ] Focus indicators visible on all elements
- [ ] Screen reader announces status changes

### Responsive Design 📱
- [ ] Test on narrow window (< 768px)
- [ ] Header stacks vertically on mobile
- [ ] Summary card shows single column
- [ ] Fixes controls stack on mobile
- [ ] All text remains readable
- [ ] Buttons remain clickable

### Error Handling 🚨
- [ ] Missing assembly_id shows helpful error
- [ ] Network errors display with retry button
- [ ] Invalid assembly_id handled gracefully
- [ ] Failed fix application shows error message
- [ ] Telemetry tracks all error events

## Test Data Scenarios

### Scenario 1: All Passed ✅
- Assembly has no DRC violations
- **Expected**: Green "PASSED" badge, 0 errors, 0 warnings
- **Fixes Section**: Not visible (no fixes needed)
- **Continue Button**: Enabled immediately

### Scenario 2: Warnings Only ⚠️
- Assembly has minor issues (e.g., cable length > 10m)
- **Expected**: Yellow "WARNING" badge, 0 errors, N warnings
- **Fixes Section**: May show optional fixes
- **Continue Button**: Enabled (warnings don't block)

### Scenario 3: Errors Present ❌
- Assembly has violations (e.g., bend radius too tight)
- **Expected**: Red "FAILED" badge, N errors, M warnings
- **Fixes Section**: Shows suggested fixes
- **Continue Button**: Disabled until errors = 0

### Scenario 4: Fixes Available 🔧
- Assembly has auto-fixable issues
- **Expected**: Fixes section visible with checkboxes
- **Test**:
  1. Select 1-2 fixes
  2. Click "Apply Selected Fixes"
  3. Wait for loading
  4. Verify report updates
  5. Check if errors decreased

### Scenario 5: Multiple Fix Rounds 🔄
- Assembly needs several fix iterations
- **Test**:
  1. Apply first batch of fixes
  2. Report refreshes
  3. New fixes appear
  4. Apply second batch
  5. Continue until errors = 0

## Telemetry Verification

### Events to Verify
Open browser DevTools Console and check for telemetry events:

1. **drc.run**
   ```json
   { event: "drc.run", properties: { assembly_id: "..." } }
   ```

2. **drc.pass** or **drc.fail**
   ```json
   { 
     event: "drc.pass", 
     properties: { 
       assembly_id: "...", 
       errors: 0, 
       warnings: 2 
     } 
   }
   ```

3. **drc.applyFixes** (NEW!)
   ```json
   { 
     event: "drc.applyFixes", 
     properties: { 
       assembly_id: "...", 
       fix_count: 3,
       fix_ids: ["fix-001", "fix-002", "fix-003"]
     } 
   }
   ```

4. **drc.fixesApplied** (NEW!)
   ```json
   { 
     event: "drc.fixesApplied", 
     properties: { 
       assembly_id: "...", 
       fix_count: 3,
       new_errors: 0,
       new_warnings: 1
     } 
   }
   ```

5. **drc.continue**
   ```json
   { event: "drc.continue", properties: { assembly_id: "..." } }
   ```

### How to Check Telemetry
```javascript
// In browser console
localStorage.getItem('telemetry_events')
```

## API Verification

### Check DRC Report Structure
Open Network tab in DevTools and verify API responses:

#### GET `/v1/assemblies/{id}/drc`
```json
{
  "assembly_id": "asm-123",
  "ruleset_id": "rs-001",
  "version": "1.0.0",
  "passed": false,
  "errors": 2,
  "warnings": 1,
  "findings": [
    {
      "id": "finding-001",
      "severity": "error",
      "domain": "mechanical",
      "code": "DRC_BEND_RADIUS",
      "message": "Bend radius too tight",
      "where": "cable.od_mm=6.5",
      "refs": ["IEC 60228"]
    }
  ],
  "fixes": [
    {
      "id": "fix-001",
      "label": "Increase cable diameter",
      "description": "Use a larger cable to meet minimum bend radius",
      "applies_to": ["finding-001"],
      "effect": "substitution"
    }
  ],
  "generated_at": "2025-10-08T15:30:00Z"
}
```

#### POST `/v1/assemblies/{id}/drc/fixes`
```json
// Request
{
  "fixIds": ["fix-001", "fix-002"]
}

// Response: Updated DrcReport with new findings/fixes
```

## Known Limitations

1. **No Backend Integration Yet**: If DRC service returns mock data, fixes may not actually modify the assembly
2. **No Undo**: Once fixes are applied, you can't revert (yet)
3. **No Pagination**: Large reports (>100 findings) may be slow
4. **No Search/Filter**: Can't filter findings by severity or search within report

## Troubleshooting

### Page Doesn't Load
- Check if portal container is running: `docker-compose ps portal`
- View portal logs: `docker-compose logs portal -f`
- Verify port 5173 is accessible: `curl http://localhost:5173`

### No DRC Report Found
- Ensure DRC service is running: `docker-compose ps drc`
- Check DRC logs: `docker-compose logs drc -f`
- Verify assembly exists in database
- Try running DRC manually via API

### Fixes Button Doesn't Work
- Open browser DevTools Console for JavaScript errors
- Check Network tab for failed API calls
- Verify `applyDrcFixes` method exists in `api/client.ts`
- Ensure backend endpoint `/v1/assemblies/{id}/drc/fixes` is implemented

### Styling Looks Broken
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Check for CSS errors in DevTools Console
- Verify Svelte compiled correctly (check terminal logs)

### Type Errors in Editor
- Run `pnpm install` in workspace root
- Restart VS Code
- Check TypeScript version matches workspace requirements
- Verify `tsconfig.json` paths are correct

## Performance Testing

### Load Time
- Initial page load should be < 2s
- Report fetch should be < 500ms
- Fix application should be < 1s

### Bundle Size
- DRC page bundle: ~28KB (compiled)
- Gzipped: ~7KB
- Should not impact overall app bundle significantly

### Memory Usage
- Open Chrome DevTools > Performance
- Record page interaction
- Check memory heap doesn't grow unbounded
- Verify no memory leaks after applying fixes

## Accessibility Testing

### Screen Reader Testing
Test with NVDA (Windows) or VoiceOver (Mac):
- [ ] Header announces status correctly
- [ ] Findings read in logical order
- [ ] Fix checkboxes announce state
- [ ] Button states announced
- [ ] Loading states announced

### Color Contrast
Use browser DevTools Accessibility Inspector:
- [ ] Error text: contrast ratio ≥ 4.5:1
- [ ] Warning text: contrast ratio ≥ 4.5:1
- [ ] Info text: contrast ratio ≥ 4.5:1
- [ ] Button text: contrast ratio ≥ 4.5:1

### Keyboard Navigation
- [ ] Can reach all interactive elements with Tab
- [ ] Tab order is logical
- [ ] Focus trap doesn't occur
- [ ] Can activate buttons with Enter/Space

## Success Criteria

✅ **Phase 1: Basic Display**
- Report loads and displays correctly
- Findings grouped by domain
- Status badges show correct values

✅ **Phase 2: Fixes UI**
- Fixes section visible when available
- Checkboxes toggle correctly
- Selection counter updates
- Select All/Deselect All works

✅ **Phase 3: Fix Application**
- Apply button triggers API call
- Loading state shows during request
- Report refreshes after success
- Error handling works

✅ **Phase 4: Navigation**
- Continue button enables/disables correctly
- Navigates to layout page with assembly_id
- Telemetry tracks all events

✅ **Phase 5: Polish**
- Professional visual design
- Smooth animations and transitions
- Responsive on all screen sizes
- Accessible to keyboard and screen readers

## Next Steps

After successful testing:

1. **Create Test Cases**: Document specific test scenarios in Playwright/Cypress
2. **Backend Integration**: Ensure DRC service implements fix application
3. **E2E Tests**: Add automated tests for complete flow
4. **Performance Monitoring**: Track page load and interaction times
5. **User Feedback**: Gather feedback from QA and stakeholders
6. **Production Deployment**: Merge to main and deploy

## Questions or Issues?

If you encounter any problems:
1. Check browser console for errors
2. Review docker-compose logs for services
3. Verify all environment variables are set
4. Consult `docs/DRC_REVIEW_PAGE.md` for detailed documentation
5. Reach out to the development team

---

**Happy Testing! 🚀**

*Last Updated: October 8, 2025*
*Version: 1.0.0*
*Author: Development Team*
