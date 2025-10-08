import { readFileSync } from 'fs';
import { join } from 'path';
import { TemplatePackManifest } from '../types.js';

const TEMPLATE_PACKS_DIR = process.env.TEMPLATE_PACKS_DIR || '../../packages/templates';

const cache = new Map<string, TemplatePackManifest>();

export async function loadTemplatePack(id: string): Promise<TemplatePackManifest> {
  // Check cache
  if (cache.has(id)) {
    return cache.get(id)!;
  }

  try {
    // Load manifest.json
    const manifestPath = join(process.cwd(), TEMPLATE_PACKS_DIR, id, 'manifest.json');
    const manifestData = readFileSync(manifestPath, 'utf-8');
    const manifest: TemplatePackManifest = JSON.parse(manifestData);

    // Validate required fields
    if (!manifest.id || !manifest.version || !manifest.paper) {
      throw new Error(`Invalid manifest for template pack: ${id}`);
    }

    // Cache it
    cache.set(id, manifest);

    return manifest;
  } catch (error) {
    throw new Error(
      `Failed to load template pack '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function clearCache(): void {
  cache.clear();
}
