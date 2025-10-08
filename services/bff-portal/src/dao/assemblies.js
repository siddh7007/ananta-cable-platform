import { sql } from '../db.js';
export class AssembliesDAO {
    /**
     * Save or update a draft assembly
     */
    async saveDraft(userId, draft) {
        const result = await sql `
      INSERT INTO assemblies_draft (user_id, step, payload, status)
      VALUES (${userId}, ${draft.step}, ${JSON.stringify(draft.payload)}, ${draft.status})
      ON CONFLICT (draft_id) DO UPDATE SET
        payload = EXCLUDED.payload,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING draft_id, status, updated_at
    `;
        return {
            draft_id: result[0].draft_id,
            status: result[0].status,
            updated_at: result[0].updated_at.toISOString(),
        };
    }
    /**
     * Get a draft by ID
     */
    async getDraft(draftId) {
        const result = await sql `
      SELECT draft_id, user_id, step, payload, status, created_at, updated_at
      FROM assemblies_draft
      WHERE draft_id = ${draftId}
    `;
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        return {
            draft_id: row.draft_id,
            user_id: row.user_id,
            step: row.step,
            payload: row.payload,
            status: row.status,
            created_at: row.created_at.toISOString(),
            updated_at: row.updated_at.toISOString(),
        };
    }
    /**
     * Get all drafts for a user
     */
    async getUserDrafts(userId) {
        const result = await sql `
      SELECT draft_id, user_id, step, payload, status, created_at, updated_at
      FROM assemblies_draft
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;
        return result.map(row => ({
            draft_id: row.draft_id,
            user_id: row.user_id,
            step: row.step,
            payload: row.payload,
            status: row.status,
            created_at: row.created_at.toISOString(),
            updated_at: row.updated_at.toISOString(),
        }));
    }
    /**
     * Delete a draft
     */
    async deleteDraft(draftId) {
        const result = await sql `
      DELETE FROM assemblies_draft
      WHERE draft_id = ${draftId}
      RETURNING draft_id
    `;
        return result.length > 0;
    }
    /**
     * Get assembly schema by assembly_id
     */
    async getAssemblySchema(assemblyId) {
        const result = await sql `
      SELECT assembly_id, draft_id, schema, schema_hash, created_at, updated_at
      FROM assemblies_schema
      WHERE assembly_id = ${assemblyId}
    `;
        if (result.length === 0) {
            return null;
        }
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
    /**
     * Update assembly schema with new schema and hash
     */
    async updateAssemblySchema(assemblyId, schema, schemaHash) {
        await sql `
      UPDATE assemblies_schema
      SET schema = ${JSON.stringify(schema)}, schema_hash = ${schemaHash}, updated_at = NOW()
      WHERE assembly_id = ${assemblyId}
    `;
    }
}
