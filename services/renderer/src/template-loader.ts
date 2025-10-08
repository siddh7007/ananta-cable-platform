import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TemplateManifest {
  id: string;
  version: string;
  paper: string;
  dimensions: {
    width: number;
    height: number;
    unit: string;
  };
  margins: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  fonts: string[];
  strokes: {
    thin: number;
    medium: number;
    thick: number;
  };
  titleblock: string;
  notes: string;
}

export interface TemplatePack {
  manifest: TemplateManifest;
  basePath: string;
  symbols: Map<string, string>; // symbol name -> SVG content
}

const TEMPLATES_DIR = join(__dirname, '../../../packages/templates');

/**
 * Load all available template packs
 */
export function loadAllTemplatePacks(): Map<string, TemplatePack> {
  const packs = new Map<string, TemplatePack>();

  if (!existsSync(TEMPLATES_DIR)) {
    console.warn(`Templates directory not found: ${TEMPLATES_DIR}`);
    return packs;
  }

  const entries = readdirSync(TEMPLATES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const packPath = join(TEMPLATES_DIR, entry.name);
    const manifestPath = join(packPath, 'manifest.json');

    if (!existsSync(manifestPath)) {
      console.warn(`No manifest.json found in ${entry.name}`);
      continue;
    }

    try {
      const manifest: TemplateManifest = JSON.parse(
        readFileSync(manifestPath, 'utf-8')
      );

      const symbols = new Map<string, string>();

      // Load all symbols
      const symbolsDir = join(packPath, 'symbols');
      if (existsSync(symbolsDir)) {
        const symbolFiles = readdirSync(symbolsDir).filter(f => f.endsWith('.svg'));
        for (const file of symbolFiles) {
          const symbolName = file.replace('.svg', '');
          const symbolContent = readFileSync(join(symbolsDir, file), 'utf-8');
          symbols.set(symbolName, symbolContent);
        }
      }

      const pack: TemplatePack = {
        manifest,
        basePath: packPath,
        symbols,
      };

      packs.set(manifest.id, pack);
      console.log(`Loaded template pack: ${manifest.id}@${manifest.version} with ${symbols.size} symbols`);
    } catch (error) {
      console.error(`Failed to load template pack ${entry.name}:`, error);
    }
  }

  return packs;
}

/**
 * Get a specific template pack by ID
 */
export function getTemplatePack(packId: string, allPacks: Map<string, TemplatePack>): TemplatePack | null {
  return allPacks.get(packId) || null;
}

/**
 * Get a symbol from a template pack
 */
export function getSymbol(pack: TemplatePack, symbolName: string): string | null {
  return pack.symbols.get(symbolName) || null;
}

/**
 * List all available template packs
 */
export function listTemplatePacks(allPacks: Map<string, TemplatePack>): Array<{ id: string; version: string; paper: string }> {
  return Array.from(allPacks.values()).map(pack => ({
    id: pack.manifest.id,
    version: pack.manifest.version,
    paper: pack.manifest.paper,
  }));
}
