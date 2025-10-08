import { sql } from '../db.js';
export class ConnectorsDAO {
    /**
     * Search connectors with fuzzy matching
     */
    async searchConnectors(query, limit = 20) {
        // Simple fuzzy search using ILIKE for now
        // In production, consider using full-text search or a dedicated search engine
        const searchPattern = `%${query}%`;
        const result = await sql `
      SELECT mpn, family, series, positions, pitch_in, termination
      FROM connectors
      WHERE
        mpn ILIKE ${searchPattern} OR
        family ILIKE ${searchPattern} OR
        series ILIKE ${searchPattern}
      ORDER BY
        CASE
          WHEN mpn ILIKE ${searchPattern} THEN 1
          WHEN family ILIKE ${searchPattern} THEN 2
          WHEN series ILIKE ${searchPattern} THEN 3
          ELSE 4
        END,
        mpn
      LIMIT ${limit}
    `;
        return result.map(row => ({
            mpn: row.mpn,
            family: row.family,
            series: row.series,
            positions: row.positions,
            pitch_in: row.pitch_in,
            termination: row.termination,
        }));
    }
    /**
     * Get detailed connector metadata by MPN
     */
    async getConnectorMetadata(mpn) {
        const result = await sql `
      SELECT * FROM connectors WHERE mpn = ${mpn}
    `;
        if (result.length === 0) {
            return null;
        }
        const row = result[0];
        return {
            mpn: row.mpn,
            family: row.family,
            series: row.series,
            positions: row.positions,
            pitch_in: row.pitch_in,
            termination: row.termination,
            gender: row.gender,
            keying: row.keying,
            compatible_contacts_awg: row.compatible_contacts_awg,
            backshell_strain_relief: row.backshell_strain_relief,
            pin1_semantics: row.pin1_semantics,
        };
    }
}
