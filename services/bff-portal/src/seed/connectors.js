import { sql } from '../db.js';
export const CONNECTOR_SEED_DATA = [
    {
        mpn: '3M-89110-0101HA',
        family: '3M IDC',
        series: '891',
        positions: 10,
        pitch_in: 0.1,
        termination: 'idc',
        gender: 'female',
        keying: 'polarized',
        compatible_contacts_awg: [24, 26, 28],
        backshell_strain_relief: true,
        pin1_semantics: 'standard'
    },
    {
        mpn: 'Molex-0436451000',
        family: 'Molex Mega-Fit',
        series: '43645',
        positions: 2,
        pitch_in: 0.315,
        termination: 'crimp',
        gender: 'female',
        keying: 'polarized',
        compatible_contacts_awg: [10, 12, 14],
        backshell_strain_relief: false,
        pin1_semantics: 'standard'
    },
    {
        mpn: 'TE-324717',
        family: 'TE Ring Lugs',
        series: '324717',
        positions: 1,
        pitch_in: 0.0,
        termination: 'ring_lug',
        gender: 'female',
        keying: 'none',
        compatible_contacts_awg: [8, 10, 12],
        backshell_strain_relief: false,
        pin1_semantics: 'n/a'
    }
];
export async function seedConnectors() {
    // Create connectors table if it doesn't exist
    await sql `
    CREATE TABLE IF NOT EXISTS connectors (
      mpn TEXT PRIMARY KEY,
      family TEXT NOT NULL,
      series TEXT NOT NULL,
      positions INTEGER NOT NULL,
      pitch_in REAL NOT NULL,
      termination TEXT NOT NULL,
      gender TEXT NOT NULL,
      keying TEXT NOT NULL,
      compatible_contacts_awg JSONB NOT NULL,
      backshell_strain_relief BOOLEAN NOT NULL,
      pin1_semantics TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_connectors_family ON connectors(family);
    CREATE INDEX IF NOT EXISTS idx_connectors_series ON connectors(series);
    CREATE INDEX IF NOT EXISTS idx_connectors_termination ON connectors(termination);
  `;
    // Insert seed data
    for (const connector of CONNECTOR_SEED_DATA) {
        await sql `
      INSERT INTO connectors (
        mpn, family, series, positions, pitch_in, termination,
        gender, keying, compatible_contacts_awg, backshell_strain_relief, pin1_semantics
      ) VALUES (
        ${connector.mpn}, ${connector.family}, ${connector.series}, ${connector.positions},
        ${connector.pitch_in}, ${connector.termination}, ${connector.gender}, ${connector.keying},
        ${JSON.stringify(connector.compatible_contacts_awg)}, ${connector.backshell_strain_relief},
        ${connector.pin1_semantics}
      )
      ON CONFLICT (mpn) DO NOTHING
    `;
    }
    console.log(`Seeded ${CONNECTOR_SEED_DATA.length} connectors`);
}
