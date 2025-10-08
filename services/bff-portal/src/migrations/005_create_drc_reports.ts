import { sql } from '../db.js';

export async function up() {
  await sql`
    CREATE TABLE IF NOT EXISTS drc_reports (
      assembly_id TEXT PRIMARY KEY,
      ruleset_id TEXT NOT NULL,
      version TEXT NOT NULL,
      passed BOOLEAN NOT NULL,
      errors INTEGER NOT NULL DEFAULT 0,
      warnings INTEGER NOT NULL DEFAULT 0,
      findings JSONB NOT NULL DEFAULT '[]'::jsonb,
      fixes JSONB NOT NULL DEFAULT '[]'::jsonb,
      generated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_drc_reports_assembly_id ON drc_reports(assembly_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_drc_reports_generated_at ON drc_reports(generated_at)
  `;
}

export async function down() {
  await sql`
    DROP TABLE IF EXISTS drc_reports
  `;
}