import { sql } from '../db.js';

export async function up() {
  await sql`
    CREATE TABLE IF NOT EXISTS assemblies_draft (
      draft_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      step INTEGER NOT NULL CHECK (step = 1),
      payload JSONB NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('editing', 'ready_for_step2')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_assemblies_draft_user_id ON assemblies_draft(user_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_assemblies_draft_status ON assemblies_draft(status)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_assemblies_draft_updated_at ON assemblies_draft(updated_at)
  `;
}

export async function down() {
  await sql`
    DROP TABLE IF EXISTS assemblies_draft
  `;
}