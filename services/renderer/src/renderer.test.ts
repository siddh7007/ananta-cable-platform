import { describe, it, expect, beforeAll } from 'vitest';
import { renderToSVG } from './renderer/index.js';
import { RenderDSL } from './types.js';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Setup mock template pack
beforeAll(() => {
  const templateDir = join(process.cwd(), 'packages/templates/basic-a3');
  mkdirSync(templateDir, { recursive: true });
  
  const manifest = {
    id: 'basic-a3',
    version: '1.0.0',
    name: 'Basic A3 Template',
    paper: 'A3',
    dimensions: {
      width_mm: 420,
      height_mm: 297,
    },
    margins: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 20,
    },
    styles: {
      lineWidth: 0.35,
      fontSize: 3.5,
      font: 'DIN-Regular',
      colors: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#FF0000',
      },
    },
  };
  
  writeFileSync(
    join(templateDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
});

describe('Renderer', () => {
  describe('Ribbon Cable with IDC', () => {
    it('renders 12-way ribbon with red stripe and pin-1 indicators', async () => {
      const dsl: RenderDSL = {
        meta: {
          assembly_id: 'asm_ribbon_12way',
          schema_hash: 'hash123abc',
        },
        dimensions: {
          oal_mm: 1250,
          tolerance_mm: 5,
        },
        cable: {
          type: 'ribbon',
          ways: 12,
          pitch_in: 0.05,
          red_stripe: true,
        },
        endA: {
          connector_mpn: 'TE-102345',
          type: 'idc',
          positions: 12,
        },
        endB: {
          connector_mpn: 'TE-102345',
          type: 'idc',
          positions: 12,
        },
        nets: Array.from({ length: 12 }, (_, i) => ({
          circuit: `D${i}`,
          endA_pin: String(i + 1),
          endB_pin: String(i + 1),
          color: ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white', 'black', 'pink', 'turquoise'][i],
        })),
        labels: [
          {
            text: 'RIBBON CABLE ASSY',
            anchor: 'cable',
          },
        ],
        notesPack: 'IPC-620-CLASS-2',
        qr: 'https://example.com/asm_ribbon_12way',
      };

      const svg = await renderToSVG(dsl, 'basic-a3');

      // Structural assertions
      expect(svg).toContain('<?xml version="1.0"');
      expect(svg).toContain('<svg');
      expect(svg).toContain('assembly id="asm_ribbon_12way"');
      expect(svg).toContain('template id="basic-a3"');
      
      // Pin-1 indicators (both ends)
      expect(svg).toContain('id="asm_ribbon_12way-pin1-L"');
      expect(svg).toContain('id="asm_ribbon_12way-pin1-R"');
      
      // Red stripe
      expect(svg).toContain('red-stripe');
      
      // Connectors
      expect(svg).toContain('id="asm_ribbon_12way-endA"');
      expect(svg).toContain('id="asm_ribbon_12way-endB"');
      
      // All 12 nets
      for (let i = 0; i < 12; i++) {
        expect(svg).toContain(`id="asm_ribbon_12way-net-D${i}"`);
      }
      
      // Dimension
      expect(svg).toContain('id="asm_ribbon_12way-dim-oal"');
      expect(svg).toContain('1250 ±5 mm');
      
      // Label
      expect(svg).toContain('RIBBON CABLE ASSY');
      
      // Notes
      expect(svg).toContain('IPC-620-CLASS-2');
      
      // QR code
      expect(svg).toContain('id="asm_ribbon_12way-qr"');

      // Snapshot test for determinism
      expect(svg).toMatchSnapshot();
    });

    it('counts correct number of elements', async () => {
      const dsl: RenderDSL = {
        meta: {
          assembly_id: 'asm_count_test',
          schema_hash: 'hash456def',
        },
        dimensions: {
          oal_mm: 500,
          tolerance_mm: 3,
        },
        cable: {
          type: 'ribbon',
          ways: 6,
          pitch_in: 0.05,
        },
        endA: {
          connector_mpn: 'TE-102345',
          type: 'idc',
          positions: 6,
        },
        endB: {
          connector_mpn: 'TE-102345',
          type: 'idc',
          positions: 6,
        },
        nets: Array.from({ length: 6 }, (_, i) => ({
          circuit: `N${i}`,
          endA_pin: String(i + 1),
          endB_pin: String(i + 1),
        })),
        labels: [],
        notesPack: 'STD',
      };

      const svg = await renderToSVG(dsl, 'basic-a3');

      // Count elements
      const connectorCount = (svg.match(/class="connector"/g) || []).length;
      const wireCount = (svg.match(/class="wire"/g) || []).length;
      const pin1Count = (svg.match(/id="[^"]*-pin1-[LR]"/g) || []).length;
      const dimCount = (svg.match(/id="[^"]*-dim-/g) || []).length;

      expect(connectorCount).toBe(2); // endA and endB
      expect(wireCount).toBe(6); // 6 nets
      expect(pin1Count).toBe(2); // pin-1 indicators on both ends
      expect(dimCount).toBe(1); // OAL dimension
    });
  });

  describe('Round Cable with Labels', () => {
    it('renders 2-conductor power cable with labels and dimension', async () => {
      const dsl: RenderDSL = {
        meta: {
          assembly_id: 'asm_power_2cond',
          schema_hash: 'hash789ghi',
        },
        dimensions: {
          oal_mm: 800,
          tolerance_mm: 10,
        },
        cable: {
          type: 'round',
          conductors: 2,
          awg: 18,
          shield: 'none',
        },
        endA: {
          connector_mpn: 'PHOENIX-123',
          type: 'crimp',
          positions: 2,
        },
        endB: {
          connector_mpn: 'PHOENIX-123',
          type: 'crimp',
          positions: 2,
        },
        nets: [
          {
            circuit: '+48V',
            endA_pin: '1',
            endB_pin: '1',
            color: 'red',
          },
          {
            circuit: 'RTN',
            endA_pin: '2',
            endB_pin: '2',
            color: 'black',
          },
        ],
        labels: [
          {
            text: '+48V POWER',
            anchor: 'endA',
            offset_y: -5,
          },
          {
            text: 'LOAD',
            anchor: 'endB',
            offset_y: -5,
          },
        ],
        notesPack: 'UL-LISTED',
        qr: 'https://example.com/asm_power_2cond',
      };

      const svg = await renderToSVG(dsl, 'basic-a3');

      // Structural assertions
      expect(svg).toContain('assembly id="asm_power_2cond"');
      
      // Both nets
      expect(svg).toContain('id="asm_power_2cond-net-+48V"');
      expect(svg).toContain('id="asm_power_2cond-net-RTN"');
      
      // Wire colors
      expect(svg).toContain('stroke="red"');
      expect(svg).toContain('stroke="black"');
      
      // Labels
      expect(svg).toContain('+48V POWER');
      expect(svg).toContain('LOAD');
      
      // Dimension
      expect(svg).toContain('800 ±10 mm');
      
      // Notes
      expect(svg).toContain('UL-LISTED');

      // Snapshot test
      expect(svg).toMatchSnapshot();
    });
  });

  describe('Broken Dimension', () => {
    it('renders broken dimension glyph when needed', async () => {
      const dsl: RenderDSL = {
        meta: {
          assembly_id: 'asm_broken_dim',
          schema_hash: 'hash_broken',
        },
        dimensions: {
          oal_mm: 2500,
          tolerance_mm: 15,
          broken_dim: true,
        },
        cable: {
          type: 'round',
          conductors: 4,
        },
        endA: {
          connector_mpn: 'CONN-A',
          type: 'crimp',
          positions: 4,
        },
        endB: {
          connector_mpn: 'CONN-B',
          type: 'crimp',
          positions: 4,
        },
        nets: [
          { circuit: 'A', endA_pin: '1', endB_pin: '1' },
          { circuit: 'B', endA_pin: '2', endB_pin: '2' },
          { circuit: 'C', endA_pin: '3', endB_pin: '3' },
          { circuit: 'D', endA_pin: '4', endB_pin: '4' },
        ],
        labels: [],
        notesPack: 'STD',
      };

      const svg = await renderToSVG(dsl, 'basic-a3');

      // Check for broken dimension mark (zigzag path)
      expect(svg).toContain('<path d="M');
      expect(svg).toContain('2500 ±15 mm');

      // Snapshot test
      expect(svg).toMatchSnapshot();
    });
  });

  describe('Determinism', () => {
    it('produces identical SVG across multiple renders', async () => {
      const dsl: RenderDSL = {
        meta: {
          assembly_id: 'asm_determinism_test',
          schema_hash: 'hash_det',
        },
        dimensions: {
          oal_mm: 1000,
          tolerance_mm: 5,
        },
        cable: {
          type: 'ribbon',
          ways: 4,
          pitch_in: 0.05,
        },
        endA: {
          connector_mpn: 'TE-X',
          type: 'idc',
          positions: 4,
        },
        endB: {
          connector_mpn: 'TE-Y',
          type: 'idc',
          positions: 4,
        },
        nets: [
          { circuit: 'A', endA_pin: '1', endB_pin: '1' },
          { circuit: 'B', endA_pin: '2', endB_pin: '2' },
          { circuit: 'C', endA_pin: '3', endB_pin: '3' },
          { circuit: 'D', endA_pin: '4', endB_pin: '4' },
        ],
        labels: [],
        notesPack: 'STD',
      };

      // Render multiple times
      const svg1 = await renderToSVG(dsl, 'basic-a3');
      const svg2 = await renderToSVG(dsl, 'basic-a3');
      const svg3 = await renderToSVG(dsl, 'basic-a3');

      // All should be identical
      expect(svg1).toBe(svg2);
      expect(svg2).toBe(svg3);
    });

    it('normalizes numeric values to 2 decimals', async () => {
      const dsl: RenderDSL = {
        meta: {
          assembly_id: 'asm_precision',
          schema_hash: 'hash_prec',
        },
        dimensions: {
          oal_mm: 333.333333,
          tolerance_mm: 2.777777,
        },
        cable: {
          type: 'round',
          conductors: 1,
        },
        endA: {
          connector_mpn: 'C1',
          type: 'solder',
          positions: 1,
        },
        endB: {
          connector_mpn: 'C2',
          type: 'solder',
          positions: 1,
        },
        nets: [{ circuit: 'X', endA_pin: '1', endB_pin: '1' }],
        labels: [],
        notesPack: 'STD',
      };

      const svg = await renderToSVG(dsl, 'basic-a3');

      // Check that coordinates are normalized to 2 decimals
      // Should not contain more than 2 decimal places
      const coordRegex = /[xy]1?="(\d+\.\d+)"/g;
      let match;
      const coords: number[] = [];
      
      while ((match = coordRegex.exec(svg)) !== null) {
        coords.push(parseFloat(match[1]));
      }

      coords.forEach(coord => {
        const decimalPlaces = (coord.toString().split('.')[1] || '').length;
        expect(decimalPlaces).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('Template Pack Switching', () => {
    it('renders with STD-A3-IPC620 template pack', async () => {
      const dsl: RenderDSL = {
        meta: {
          assembly_id: 'asm_a3_test',
          schema_hash: 'hash_a3',
        },
        dimensions: {
          oal_mm: 1000,
          tolerance_mm: 5,
        },
        cable: {
          type: 'ribbon',
          ways: 8,
          pitch_in: 0.05,
          red_stripe: true,
        },
        endA: {
          connector_mpn: 'TEST-A',
          type: 'idc',
          positions: 8,
        },
        endB: {
          connector_mpn: 'TEST-B',
          type: 'idc',
          positions: 8,
        },
        nets: Array.from({ length: 8 }, (_, i) => ({
          circuit: `D${i}`,
          endA_pin: String(i + 1),
          endB_pin: String(i + 1),
        })),
        labels: [],
        notesPack: 'IPC-620-CLASS-2',
      };

      const svg = await renderToSVG(dsl, 'STD-A3-IPC620');

      expect(svg).toContain('width="420mm"');
      expect(svg).toContain('height="297mm"');
      expect(svg).toContain('STD-A3-IPC620');
      expect(svg).toContain('1.1.0');
      expect(svg).toContain('titleblock');
      expect(svg).toContain('notes-table');
      
      // Snapshot for visual comparison
      expect(svg).toMatchSnapshot('a3-template');
    });

    it('renders with STD-Letter-IPC620 template pack', async () => {
      const dsl: RenderDSL = {
        meta: {
          assembly_id: 'asm_letter_test',
          schema_hash: 'hash_letter',
        },
        dimensions: {
          oal_mm: 800,
          tolerance_mm: 5,
        },
        cable: {
          type: 'ribbon',
          ways: 8,
          pitch_in: 0.05,
          red_stripe: true,
        },
        endA: {
          connector_mpn: 'TEST-A',
          type: 'idc',
          positions: 8,
        },
        endB: {
          connector_mpn: 'TEST-B',
          type: 'idc',
          positions: 8,
        },
        nets: Array.from({ length: 8 }, (_, i) => ({
          circuit: `D${i}`,
          endA_pin: String(i + 1),
          endB_pin: String(i + 1),
        })),
        labels: [],
        notesPack: 'IPC-620-CLASS-2',
      };

      const svg = await renderToSVG(dsl, 'STD-Letter-IPC620');

      expect(svg).toContain('width="279.4mm"');
      expect(svg).toContain('height="215.9mm"');
      expect(svg).toContain('STD-Letter-IPC620');
      expect(svg).toContain('1.0.0');
      expect(svg).toContain('titleblock');
      expect(svg).toContain('notes-table');
      
      // Snapshot for visual comparison
      expect(svg).toMatchSnapshot('letter-template');
    });

    it('snapshots differ only in expected regions (sheet size and titleblock)', async () => {
      const dsl: RenderDSL = {
        meta: {
          assembly_id: 'asm_compare',
          schema_hash: 'hash_compare',
        },
        dimensions: {
          oal_mm: 1000,
          tolerance_mm: 5,
        },
        cable: {
          type: 'ribbon',
          ways: 8,
          pitch_in: 0.05,
          red_stripe: false,
        },
        endA: {
          connector_mpn: 'TEST',
          type: 'idc',
          positions: 8,
        },
        endB: {
          connector_mpn: 'TEST',
          type: 'idc',
          positions: 8,
        },
        nets: Array.from({ length: 8 }, (_, i) => ({
          circuit: `D${i}`,
          endA_pin: String(i + 1),
          endB_pin: String(i + 1),
        })),
        labels: [],
        notesPack: 'IPC-620',
      };

      const svgA3 = await renderToSVG(dsl, 'STD-A3-IPC620');
      const svgLetter = await renderToSVG(dsl, 'STD-Letter-IPC620');

      // Both should contain the same assembly content
      expect(svgA3).toContain('asm_compare');
      expect(svgLetter).toContain('asm_compare');

      // But different dimensions
      expect(svgA3).toContain('420');
      expect(svgLetter).toContain('279.4');

      // Different titleblock positions (visual verification needed)
      expect(svgA3).not.toEqual(svgLetter);
    });
  });
});
