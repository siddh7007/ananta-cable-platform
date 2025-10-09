import { sql } from '../db.js';
export class DRCDao {
    /**
     * Store or update a DRC report
     */
    async upsertReport(report) {
        await sql `
      INSERT INTO drc_reports (
        assembly_id, ruleset_id, version, passed, errors, warnings,
        findings, fixes, generated_at
      ) VALUES (
        ${report.assembly_id}, ${report.ruleset_id}, ${report.version},
        ${report.passed}, ${report.errors}, ${report.warnings},
        ${JSON.stringify(report.findings)}, ${JSON.stringify(report.fixes)},
        ${report.generated_at}
      )
      ON CONFLICT (assembly_id) DO UPDATE SET
        ruleset_id = EXCLUDED.ruleset_id,
        version = EXCLUDED.version,
        passed = EXCLUDED.passed,
        errors = EXCLUDED.errors,
        warnings = EXCLUDED.warnings,
        findings = EXCLUDED.findings,
        fixes = EXCLUDED.fixes,
        generated_at = EXCLUDED.generated_at
    `;
    }
    /**
     * Get the latest DRC report for an assembly
     */
    async getReport(assemblyId) {
        const result = await sql `
      SELECT
        assembly_id, ruleset_id, version, passed, errors, warnings,
        findings, fixes, generated_at
      FROM drc_reports
      WHERE assembly_id = ${assemblyId}
      ORDER BY generated_at DESC
      LIMIT 1
    `;
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        return {
            assembly_id: row.assembly_id,
            ruleset_id: row.ruleset_id,
            version: row.version,
            passed: row.passed,
            errors: row.errors,
            warnings: row.warnings,
            findings: row.findings,
            fixes: row.fixes,
            generated_at: row.generated_at.toISOString()
        };
    }
}
