import { sql } from '../db.js';
export async function up() {
    await sql `
    CREATE TABLE IF NOT EXISTS assemblies_synthesis (
      proposal_id TEXT PRIMARY KEY,
      draft_id UUID NOT NULL REFERENCES assemblies_draft(draft_id),
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_assemblies_synthesis_draft_id ON assemblies_synthesis(draft_id);
    CREATE INDEX IF NOT EXISTS idx_assemblies_synthesis_created_at ON assemblies_synthesis(created_at);
  `;
}
export async function down() {
    await sql `
    DROP TABLE IF EXISTS assemblies_synthesis;
  `;
}
