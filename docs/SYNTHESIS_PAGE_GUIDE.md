# Synthesis Page Usage Guide

## Overview
The Synthesis Review page allows you to review and accept AI-generated cable assembly proposals based on your draft specifications.

## Accessing the Synthesis Page

The Synthesis page requires a `draft_id` parameter in the URL. You cannot navigate to it without this parameter.

### Correct URL Format:
```
http://localhost:5173/#/assemblies/synthesis?draft_id=YOUR_DRAFT_ID
```

### Example with a test draft:
```
http://localhost:5173/#/assemblies/synthesis?draft_id=draft-001
```

## Error: "No draft_id provided"

If you see this error, it means you navigated to `/assemblies/synthesis` without the required `draft_id` parameter.

**To fix**:
1. Click the "← Return to Home" link
2. Create or select a draft first
3. Use the proper URL format with a `draft_id` parameter

## Typical Workflow

### 1. Create a Draft Assembly
First, you need to create a draft assembly specification. This is typically done through:
- The Home page
- An Assembly Creation form
- An API call to create a draft

Example API call:
```bash
POST /v1/assemblies/draft
{
  "name": "Power Cable Assembly",
  "endpoints": {
    "A": { "connector_type": "JST-PH-2POS", "termination": "crimp" },
    "B": { "connector_type": "JST-PH-2POS", "termination": "crimp" }
  },
  "conductor_count": 2,
  "conductor_awg": 22,
  "length_mm": 300
}
```

This will return a `draft_id` that you can use.

### 2. Navigate to Synthesis
Once you have a `draft_id`, navigate to:
```
#/assemblies/synthesis?draft_id=YOUR_DRAFT_ID
```

### 3. Review the Proposal
The page will:
- Call the synthesis API to generate a proposal
- Display warnings and errors (if any)
- Show suggested parts for each section
- Allow you to lock specific part selections
- Provide options to recompute or accept

### 4. Accept or Modify
- **Recompute**: If you lock certain parts, click "Recompute" to regenerate the proposal
- **Accept**: Once satisfied, click "Accept" to finalize the assembly
- After acceptance, you'll navigate to the DRC (Design Rule Check) page

## Available Actions

### Lock a Part
Click the "Lock" button next to a part to freeze that selection. When you recompute, the locked parts will stay the same while other parts may change.

### Recompute
After locking parts or making changes, click "Recompute Synthesis" to regenerate the proposal while respecting your locks.

### Accept
When the proposal looks good (no blocking errors), click "Accept Proposal" to:
1. Finalize the assembly
2. Get an `assembly_id`
3. Navigate to the DRC review page

## URL Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `draft_id` | Yes | The ID of the draft assembly to synthesize | `draft-001` |

## Navigation Flow

```
Home
  ↓
Create Draft
  ↓
Synthesis Review (#/assemblies/synthesis?draft_id=XXX)
  ↓
Accept Proposal
  ↓
DRC Review (#/assemblies/drc?assembly_id=YYY)
  ↓
Layout Editor (future)
```

## Troubleshooting

### Problem: "No draft_id provided"
**Solution**: Ensure your URL includes `?draft_id=YOUR_DRAFT_ID`

### Problem: "Failed to generate synthesis proposal"
**Possible causes**:
- Invalid `draft_id`
- Backend service unavailable
- Invalid draft specification

**Solution**: Check the browser console for detailed error messages

### Problem: Page shows errors preventing continuation
**Solution**: Review the errors, fix the draft specification, and try again with a new draft

## API Endpoints Used

The Synthesis page interacts with these endpoints:

1. **Generate Proposal**: `POST /v1/synthesis/propose`
2. **Recompute**: `POST /v1/synthesis/recompute`
3. **Accept**: `POST /v1/synthesis/accept`

## Testing

To test the Synthesis page, you can:

1. **Create a test draft via API**:
```bash
curl -X POST http://localhost:8080/v1/assemblies/draft \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Assembly",
    "endpoints": {
      "A": { "connector_type": "test-connector", "termination": "crimp" },
      "B": { "connector_type": "test-connector", "termination": "crimp" }
    }
  }'
```

2. **Use the returned `draft_id` in the URL**:
```
http://localhost:5173/#/assemblies/synthesis?draft_id=RETURNED_DRAFT_ID
```

---

**Related Pages**:
- [Home](http://localhost:5173) - Main portal page
- [DRC Review](http://localhost:5173/#/assemblies/drc?assembly_id=test-123) - Design Rule Check page
