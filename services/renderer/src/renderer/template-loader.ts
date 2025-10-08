import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TemplatePackManifest } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple possible locations for templates
const POSSIBLE_TEMPLATE_DIRS = [
  join(__dirname, '../../../../packages/templates'),
  join(process.cwd(), 'packages/templates'),
  join(process.cwd(), '../../packages/templates'),
];

interface ExtendedTemplatePack extends TemplatePackManifest {
  symbols: Map<string, string>;
}

const cache = new Map<string, ExtendedTemplatePack>();

function findTemplatesDir(): string | null {
  for (const dir of POSSIBLE_TEMPLATE_DIRS) {
    if (existsSync(dir)) {
      return dir;
    }
  }
  return null;
}

export async function loadTemplatePack(id: string): Promise<TemplatePackManifest> {
  // Check cache
  if (cache.has(id)) {
    return cache.get(id)!;
  }

  const templatesDir = findTemplatesDir();
  if (!templatesDir) {
    throw new Error('Templates directory not found');
  }

  try {
    // Find the template pack directory (handle versioned directory names)
    const entries = readdirSync(templatesDir);
    const packDir = entries.find(entry => {
      return entry.startsWith(id + '@') || entry === id;
    });

    if (!packDir) {
      throw new Error(`Template pack '${id}' not found in ${templatesDir}`);
    }

    // Load manifest.json
    const manifestPath = join(templatesDir, packDir, 'manifest.json');
    const manifestData = readFileSync(manifestPath, 'utf-8');
    const manifest: TemplatePackManifest = JSON.parse(manifestData);

    // Validate required fields
    if (!manifest.id || !manifest.version || !manifest.paper) {
      throw new Error(`Invalid manifest for template pack: ${id}`);
    }

    // Load symbols
    const symbols = new Map<string, string>();
    const symbolsDir = join(templatesDir, packDir, 'symbols');
    if (existsSync(symbolsDir)) {
      const symbolFiles = readdirSync(symbolsDir).filter(f => f.endsWith('.svg'));
      for (const file of symbolFiles) {
        const symbolName = file.replace('.svg', '');
        const symbolContent = readFileSync(join(symbolsDir, file), 'utf-8');
        symbols.set(symbolName, symbolContent);
      }
    }

    const extendedPack: ExtendedTemplatePack = {
      ...manifest,
      symbols,
    };

    // Cache it
    cache.set(id, extendedPack);

    console.log(`Loaded template pack: ${manifest.id}@${manifest.version} from ${packDir} with ${symbols.size} symbols`);

    return extendedPack;
  } catch (error) {
    throw new Error(
      `Failed to load template pack '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function getSymbol(templatePack: TemplatePackManifest, symbolName: string): string | null {
  const extended = templatePack as ExtendedTemplatePack;
  return extended.symbols?.get(symbolName) || null;
}

export function clearCache(): void {
  cache.clear();
}
