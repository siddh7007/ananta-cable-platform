# Renderer Service

Deterministic SVG/PDF/PNG generator for cable assemblies.

## Overview

The renderer service transforms cable assembly data (RenderDSL) into production-ready drawings using template packs.

## Features

- **Deterministic Output**: Stable SVG with consistent element IDs and numeric precision
- **Multi-Format**: SVG (native), PDF, PNG via resvg
- **Template Packs**: Pluggable drawing templates with symbols, fonts, and layouts
- **Pipeline Architecture**: Topology → Routing → Collisions → Dimensions → Decorations
- **Type-Safe**: Full TypeScript with Zod validation

## API Endpoints

### POST /render

Render an assembly drawing.

**Request:**
```json
{
  "dsl": {
    "meta": {
      "assembly_id": "asm_123",
      "schema_hash": "abc123"
    },
    "dimensions": {
      "oal_mm": 1250,
      "tolerance_mm": 5
    },
    "cable": {
      "type": "ribbon",
      "ways": 12,
      "pitch_in": 0.05
    },
    "endA": {
      "connector_mpn": "TE-102345",
      "type": "idc",
      "positions": 12
    },
    "endB": {
      "connector_mpn": "TE-102345",
      "type": "idc",
      "positions": 12
    },
    "nets": [
      { "circuit": "D0", "endA_pin": "1", "endB_pin": "1", "color": "brown" }
    ],
    "labels": [],
    "notesPack": "IPC-620-CLASS-2",
    "qr": "https://example.com/asm_123"
  },
  "templatePackId": "basic-a3",
  "format": "svg"
}
```

**Response:**
```json
{
  "svg": "<svg>...</svg>",
  "manifest": {
    "rendererVersion": "0.0.0",
    "templatePackId": "basic-a3",
    "rendererKind": "svg2d",
    "schemaHash": "abc123"
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "version": "0.0.0",
  "uptime": 123.45
}
```

### GET /metrics

Prometheus-compatible metrics (stub).

## Rendering Pipeline

### 1. Topology Pass
- Place endpoints (left/right or top/bottom)
- Calculate grid dimensions
- Position connector footprints

### 2. Routing Pass
- Assign lanes for each net
- Minimize crossings for ribbon cables
- Calculate path coordinates

### 3. Collision Detection
- Detect label overlaps
- Nudge callouts to avoid collisions
- Adjust dimension line positions

### 4. Dimensions Pass
- Calculate OAL (Overall Length)
- Add tolerance annotations (±tol)
- Generate broken-dimension glyphs when needed

### 5. Decorations Pass
- Add pin-1 indicators (triangles)
- Add red stripe for ribbon cables
- Add QR codes and notes

## Template Packs

Template packs define drawing styles and are loaded from `packages/templates/`.

**Structure:**
```
packages/templates/
  basic-a3/
    manifest.json      # Template metadata
    symbols/
      idc-12.svg       # Connector symbols
      pin1-tri.svg     # Pin-1 indicator
    fonts/
      DIN-Regular.ttf  # Drawing fonts
```

**manifest.json:**
```json
{
  "id": "basic-a3",
  "version": "1.0.0",
  "name": "Basic A3 Template",
  "paper": "A3",
  "dimensions": {
    "width_mm": 420,
    "height_mm": 297
  },
  "margins": {
    "top": 20,
    "right": 20,
    "bottom": 30,
    "left": 20
  },
  "styles": {
    "lineWidth": 0.35,
    "fontSize": 3.5,
    "font": "DIN-Regular"
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode (port 5002)
pnpm --filter services/renderer dev

# Run tests
pnpm --filter services/renderer test

# Build
pnpm --filter services/renderer build

# Start production
pnpm --filter services/renderer start
```

## Testing

The service includes snapshot tests for:
- 12-way ribbon cable with IDC connectors
- 2-conductor power cable with labels
- Structural validation (element counts)

Tests verify deterministic output across runs.

## Configuration

Environment variables:

- `PORT` - Server port (default: 5002)
- `HOST` - Server host (default: 0.0.0.0)
- `LOG_LEVEL` - Logging level (default: info)
- `TEMPLATE_PACKS_DIR` - Template packs directory (default: ../../packages/templates)

## Architecture

```
Request → Validation (Zod)
       ↓
    Load Template Pack
       ↓
    Render Pipeline
       ├─ Topology
       ├─ Routing
       ├─ Collisions
       ├─ Dimensions
       └─ Decorations
       ↓
    Generate SVG
       ↓
    Convert Format (if PDF/PNG)
       ↓
    Response
```

## Deterministic Output

The renderer ensures deterministic output by:
- Stable element IDs based on assembly data
- Numeric normalization to 2 decimal places
- Consistent ordering of elements
- Reproducible random seeds (if needed)

**Example IDs:**
- `asm-123-pin1-L` - Left pin-1 indicator
- `asm-123-net-D0` - Net D0 trace
- `asm-123-dim-oal` - Overall length dimension

## Type Definitions

See `src/types.ts` for complete RenderDSL interface.

## License

Proprietary - Ananta Cable Platform
