import { sql } from '../db.js';

export async function up() {
  await sql`
    CREATE TABLE IF NOT EXISTS assemblies_schema (
      assembly_id TEXT PRIMARY KEY,
      draft_id UUID NOT NULL REFERENCES assemblies_draft(draft_id),
      schema JSONB NOT NULL,
      schema_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_assemblies_schema_draft_id ON assemblies_schema(draft_id);
    CREATE INDEX IF NOT EXISTS idx_assemblies_schema_hash ON assemblies_schema(schema_hash);
    CREATE INDEX IF NOT EXISTS idx_assemblies_schema_created_at ON assemblies_schema(created_at);
  `;
}

export async function down() {
  await sql`
    DROP TABLE IF EXISTS assemblies_schema;
  `;
}