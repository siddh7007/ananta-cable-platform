# Template Packs

Template packs define the visual style and layout for cable assembly drawings.

## Structure

Each template pack contains:
- `manifest.json` - Template metadata and styling
- `symbols/` - SVG symbols for connectors and decorations
- `fonts/` - Custom fonts (optional)

## Available Templates

### basic-a3
Standard A3 (420mm × 297mm) template with minimal styling.

## Creating a Custom Template

1. Create a new directory: `packages/templates/my-template/`
2. Add `manifest.json`:

```json
{
  "id": "my-template",
  "version": "1.0.0",
  "name": "My Template",
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
    "font": "DIN-Regular",
    "colors": {
      "primary": "#000000",
      "secondary": "#666666",
      "accent": "#FF0000"
    }
  }
}
```

3. Add custom symbols to `symbols/` directory
4. Add custom fonts to `fonts/` directory (optional)

## Paper Sizes

Supported paper sizes:
- A3: 420mm × 297mm
- A4: 297mm × 210mm
- Letter: 279.4mm × 215.9mm (11" × 8.5")
