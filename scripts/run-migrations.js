#!/usr/bin/env node

import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationsDir = join(__dirname, '../services/bff-portal/src/migrations');

async function runMigrations() {
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .sort();

  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}`);
    const migrationPath = join(migrationsDir, file);

    // Dynamic import of migration
    const migrationUrl = `file://${migrationPath}`;
    const { up } = await import(migrationUrl);

    if (typeof up === 'function') {
      await up();
      console.log(`✓ Migration ${file} completed`);
    } else {
      console.error(`✗ Migration ${file} does not export an 'up' function`);
    }
  }

  console.log('All migrations completed!');
}

runMigrations().catch(console.error);