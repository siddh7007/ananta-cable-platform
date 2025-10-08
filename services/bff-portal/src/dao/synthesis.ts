import { sql } from '../db.js';
import type { SynthesisProposal } from '@cable-platform/contracts/types/api';

export interface SynthesisRecord {
  proposal_id: string;
  draft_id: string;
  payload: SynthesisProposal;
  created_at: string;
  updated_at: string;
}

export interface SchemaRecord {
  assembly_id: string;
  draft_id: string;
  schema: SynthesisProposal; // The accepted schema
  schema_hash: string;
  created_at: string;
  updated_at: string;
}

export class SynthesisDAO {
  /**
   * Save or update a synthesis proposal
   */
  async saveProposal(draftId: string, proposal: SynthesisProposal): Promise<SynthesisRecord> {
    const result = await sql`
      INSERT INTO assemblies_synthesis (proposal_id, draft_id, payload)
      VALUES (${proposal.proposal_id}, ${draftId}, ${JSON.stringify(proposal)})
      ON CONFLICT (proposal_id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = NOW()
      RETURNING proposal_id, draft_id, payload, created_at, updated_at
    `;

    const row = result[0];
    return {
      proposal_id: row.proposal_id,
      draft_id: row.draft_id,
      payload: row.payload,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }

  /**
   * Get a synthesis proposal by ID
   */
  async getProposal(proposalId: string): Promise<SynthesisRecord | null> {
    const result = await sql`
      SELECT proposal_id, draft_id, payload, created_at, updated_at
      FROM assemblies_synthesis
      WHERE proposal_id = ${proposalId}
    `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      proposal_id: row.proposal_id,
      draft_id: row.draft_id,
      payload: row.payload,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }

  /**
   * Save an accepted assembly schema
   */
  async saveSchema(draftId: string, schema: SynthesisProposal, schemaHash: string): Promise<SchemaRecord> {
    // Generate ULID for assembly_id
    const assemblyId = `asm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await sql`
      INSERT INTO assemblies_schema (assembly_id, draft_id, schema, schema_hash)
      VALUES (${assemblyId}, ${draftId}, ${JSON.stringify(schema)}, ${schemaHash})
      RETURNING assembly_id, draft_id, schema, schema_hash, created_at, updated_at
    `;

    const row = result[0];
    return {
      assembly_id: row.assembly_id,
      draft_id: row.draft_id,
      schema: row.schema,
      schema_hash: row.schema_hash,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}