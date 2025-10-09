# Portal Drawing Generation - Test Plan

## Manual Testing Guide

### Prerequisites

1. Backend services running:
   - BFF Portal: `http://localhost:8080`
   - Renderer Service: `http://localhost:15002`
2. Template packs deployed:
   - `STD-A3-IPC620@1.1.0`
   - `STD-Letter-IPC620@1.0.0`
3. Valid assembly with DRC pass (0 errors)

---

## Test Scenarios

### 1. Happy Path - SVG with Inline Preview

**Steps:**

1. Navigate to `/assemblies/drc?assembly_id=<valid-assembly-id>`
2. Wait for DRC report to load
3. Verify DRC passes (status: PASSED, 0 errors)
4. Verify "Generate Drawing" button appears
5. Click "Generate Drawing" button
6. **Expected**: Dialog opens with title "Generate Drawing"

**In Dialog:** 7. Verify template pack dropdown is populated 8. Select "STD-A3-IPC620 v1.1.0 (A3)" 9. Verify format defaults to SVG 10. Verify "Preview inline" checkbox is checked 11. Click "Generate Drawing" button 12. **Expected**: Dialog closes, "Generating..." shows on button

**After Render:** 13. **Expected**: Full-screen SVG preview opens 14. Verify drawing content is visible 15. Test zoom controls: - Click "+" button → drawing zooms in - Click "−" button → drawing zooms out - Click "↺" button → zoom resets to 100% - Click "⛶" button → fits to screen 16. Test mouse interactions: - Scroll wheel → zooms in/out - Click & drag → pans drawing 17. Test keyboard shortcuts: - Press "+" → zooms in - Press "-" → zooms out - Press "0" → resets zoom 18. Click "↓ Download" button 19. **Expected**: SVG file downloads as `<assembly-id>-<revision>.svg` 20. Click "×" button 21. **Expected**: Preview closes, success panel shows

**Success Panel:** 22. Verify "Drawing Generated Successfully!" heading 23. Click "Render Details" to expand manifest 24. Verify fields: - Assembly ID matches - Revision is shown - Template Pack: STD-A3-IPC620@1.1.0 - Renderer Version is shown - Schema Hash is shown - Format badge shows "SVG" - Generated At timestamp is current 25. Click "Dismiss" 26. **Expected**: Success panel disappears

---

### 2. PDF Generation (URL Download)

**Steps:**

1. Navigate to DRC page with passed assembly
2. Click "Generate Drawing"
3. **In Dialog:**
   - Select "STD-Letter-IPC620 v1.0.0 (Letter)"
   - Select "PDF" format
   - Verify "Preview inline" checkbox is disabled
   - Click "Generate Drawing"
4. **After Render:**
   - Verify success panel shows
   - Verify "↓ Download PDF Drawing" button appears
   - Click download button
5. **Expected**: New tab opens with PDF URL

---

### 3. Template Pack Loading

**Steps:**

1. Open "Generate Drawing" dialog
2. **Expected**: "Loading template packs..." shows briefly
3. **Expected**: Dropdown populates with template packs
4. Verify dropdown shows:
   - STD-A3-IPC620 v1.1.0 (A3)
   - STD-Letter-IPC620 v1.0.0 (Letter)
5. Verify first pack is selected by default

---

### 4. DRC Not Passed (Button Hidden)

**Steps:**

1. Navigate to DRC page with assembly that has errors
2. **Expected**: "Generate Drawing" button does NOT appear
3. **Expected**: Only "Continue to Layout" button shows (disabled)
4. **Expected**: Note shows "Fix all X error(s) before continuing to layout."

---

### 5. Keyboard Navigation

**Steps:**

1. Open "Generate Drawing" dialog
2. Press Tab repeatedly
3. **Expected**: Focus moves through:
   - Close button (×)
   - Template pack dropdown
   - SVG radio button
   - PDF radio button
   - Preview inline checkbox
   - Cancel button
   - Generate Drawing button
4. Press Escape
5. **Expected**: Dialog closes

**In Preview:** 6. Generate SVG with inline preview 7. Press "+" key 8. **Expected**: Zoom increases 9. Press "-" key 10. **Expected**: Zoom decreases 11. Press "0" key 12. **Expected**: Zoom resets 13. Press Escape 14. **Expected**: Preview closes

---

### 6. Error Handling - Template Loading Failure

**Test Setup:** Stop BFF server or block /v1/template-packs endpoint

**Steps:**

1. Open "Generate Drawing" dialog
2. **Expected**: Error message shows "Failed to load template packs"
3. **Expected**: "Retry" button appears
4. Start BFF server
5. Click "Retry"
6. **Expected**: Template packs load successfully

---

### 7. Error Handling - Render Failure

**Test Setup:** Stop renderer service or use invalid assembly ID

**Steps:**

1. Open dialog and select template pack
2. Click "Generate Drawing"
3. **Expected**: Dialog closes, button shows "Generating..."
4. **Expected**: Red error banner appears with error message
5. **Expected**: "Dismiss" button appears
6. Click "Dismiss"
7. **Expected**: Error banner disappears

---

### 8. Cached Render

**Steps:**

1. Generate drawing for an assembly
2. Dismiss success panel
3. Click "Generate Drawing" again
4. Select same template pack and format
5. Click "Generate Drawing"
6. **Expected**: Render completes very quickly
7. Expand "Render Details"
8. **Expected**: "Cached" badge appears next to "Render Details" heading

---

### 9. Mobile Responsiveness

**Test Device:** Chrome DevTools mobile emulation (iPhone 12 Pro)

**Steps:**

1. Navigate to DRC page
2. Verify button layout:
   - "Continue to Layout" button full width
   - "Generate Drawing" button full width
   - Buttons stacked vertically
3. Open dialog
4. Verify dialog width adapts to screen
5. Generate SVG with preview
6. Verify preview controls are touch-friendly
7. Test touch gestures:
   - Pinch to zoom (if supported)
   - Swipe to pan

---

### 10. Accessibility (Screen Reader)

**Test Tool:** NVDA or JAWS

**Steps:**

1. Navigate to DRC page with tab key
2. Focus on "Generate Drawing" button
3. **Expected**: Screen reader announces "Generate Drawing button"
4. Press Enter to activate
5. **Expected**: Dialog opens, screen reader announces "Generate Drawing dialog"
6. Tab through form controls
7. **Expected**: Screen reader announces labels and states
8. Focus on "Preview inline" checkbox
9. **Expected**: Screen reader announces "Preview inline checkbox, checked" or "Display the drawing directly in the browser with zoom and pan controls"
10. Submit form
11. **Expected**: Preview opens, screen reader announces role changes

---

## Telemetry Verification

### Check Browser Console

After each test, verify telemetry events in console:

**Test 1 (SVG with inline):**

```javascript
Telemetry: { event: 'render.openDialog', data: { assembly_id: '...' }, timestamp: ... }
Telemetry: { event: 'render.submit', data: { assembly_id: '...', template_pack_id: 'STD-A3-IPC620@1.1.0', format: 'svg', inline: true }, timestamp: ... }
Telemetry: { event: 'render.done', data: { assembly_id: '...', template_pack_id: 'STD-A3-IPC620@1.1.0', format: 'svg', inline: true, cached: false }, timestamp: ... }
Telemetry: { event: 'render.download', data: { assembly_id: '...', format: 'svg', source: 'inline' }, timestamp: ... }
```

**Error Scenario:**

```javascript
Telemetry: { event: 'render.loadTemplatesError', data: { assembly_id: '...', error: 'Failed to load template packs' }, timestamp: ... }
Telemetry: { event: 'render.error', data: { assembly_id: '...', error: 'Failed to render drawing' }, timestamp: ... }
```

---

## Visual Regression Testing

### Screenshots to Capture

1. DRC page with "Generate Drawing" button visible
2. Render dialog open (default state)
3. Render dialog with template selected
4. Render dialog - PDF format selected (inline disabled)
5. SVG preview - zoomed out
6. SVG preview - zoomed in
7. SVG preview - panned to corner
8. Success panel with manifest expanded
9. Success panel with download button
10. Error banner
11. Mobile layout - buttons stacked
12. Mobile dialog

---

## Performance Testing

### Metrics to Measure

1. **Template Loading Time**
   - Expected: < 200ms (cached)
   - Expected: < 1s (first load)

2. **Render Time (SVG)**
   - Expected: < 2s (first render)
   - Expected: < 100ms (cached)

3. **Render Time (PDF)**
   - Expected: < 5s

4. **Preview Load Time**
   - Expected: < 500ms (SVG content available immediately)

5. **Zoom/Pan Responsiveness**
   - Expected: 60fps (smooth transitions)

---

## Browser Compatibility

Test in:

- [ ] Chrome 120+
- [ ] Firefox 120+
- [ ] Safari 17+
- [ ] Edge 120+

---

## Acceptance Checklist

- [ ] Button appears after DRC pass (0 errors)
- [ ] Button hidden when DRC has errors
- [ ] Dialog opens on click
- [ ] Template packs load correctly
- [ ] SVG format selected by default
- [ ] Inline preview enabled by default
- [ ] PDF disables inline preview
- [ ] Form validates required fields
- [ ] Render API called with correct params
- [ ] Inline SVG preview displays
- [ ] Zoom controls work (+, -, reset, fit)
- [ ] Pan with mouse drag works
- [ ] Mouse wheel zoom works
- [ ] Keyboard shortcuts work (+, -, 0, Escape)
- [ ] Download button downloads SVG
- [ ] PDF download opens in new tab
- [ ] Manifest panel displays all fields
- [ ] Cached badge shows for cached renders
- [ ] Error messages display correctly
- [ ] Telemetry events fire correctly
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Mobile layout responsive
- [ ] Touch gestures work
- [ ] No console errors
- [ ] No accessibility warnings (handled with suppressions)

---

## Known Limitations

1. **PDF Preview**: Cannot preview PDF inline (browser limitation)
2. **Touch Zoom**: Native pinch-to-zoom may conflict with custom zoom on mobile
3. **Large Drawings**: Very large SVGs (>10MB) may cause performance issues
4. **Cached Downloads**: Cached renders still allow download (expected behavior)

---

## Future Enhancements to Test

1. Drawing history in assembly detail view
2. Multiple format generation at once
3. Print preview
4. Annotations/markup tools
5. DXF/STEP export
