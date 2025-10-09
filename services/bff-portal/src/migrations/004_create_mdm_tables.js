import { sql } from '../db.js';
export async function up() {
    // Create MDM connectors table
    await sql `
    CREATE TABLE IF NOT EXISTS mdm_connectors (
      mpn TEXT PRIMARY KEY,
      family TEXT NOT NULL,
      series TEXT NOT NULL,
      positions INTEGER NOT NULL,
      pitch_in REAL NOT NULL,
      termination TEXT NOT NULL,
      gender TEXT NOT NULL,
      keying TEXT NOT NULL,
      compatible_contacts_awg JSONB NOT NULL,
      backshell_strain_relief BOOLEAN NOT NULL DEFAULT false,
      pin1_semantics TEXT NOT NULL,
      stud_size TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
    // Create MDM cables table
    await sql `
    CREATE TABLE IF NOT EXISTS mdm_cables (
      mpn TEXT PRIMARY KEY,
      family TEXT NOT NULL,
      type TEXT NOT NULL,
      conductor_count INTEGER,
      pitch_in REAL,
      temp_rating_c INTEGER NOT NULL,
      voltage_rating_v INTEGER NOT NULL,
      shield TEXT NOT NULL,
      jacket_material TEXT NOT NULL,
      conductor_awg INTEGER,
      od_in REAL NOT NULL,
      flex_class TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
    // Create MDM contacts table
    await sql `
    CREATE TABLE IF NOT EXISTS mdm_contacts (
      mpn TEXT PRIMARY KEY,
      family TEXT NOT NULL,
      connector_family TEXT NOT NULL,
      termination TEXT NOT NULL,
      awg_range INTEGER[] NOT NULL,
      plating TEXT NOT NULL,
      gender TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
    // Create MDM accessories table
    await sql `
    CREATE TABLE IF NOT EXISTS mdm_accessories (
      mpn TEXT PRIMARY KEY,
      family TEXT NOT NULL,
      connector_family TEXT NOT NULL,
      type TEXT NOT NULL,
      cable_od_range_in REAL[],
      recovered_id_in REAL,
      expanded_id_in REAL,
      material TEXT NOT NULL,
      flame_rating TEXT,
      clamp_type TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
    // Create indexes for efficient querying
    await sql `CREATE INDEX IF NOT EXISTS idx_mdm_connectors_family ON mdm_connectors(family)`;
    await sql `CREATE INDEX IF NOT EXISTS idx_mdm_connectors_termination ON mdm_connectors(termination)`;
    await sql `CREATE INDEX IF NOT EXISTS idx_mdm_cables_type ON mdm_cables(type)`;
    await sql `CREATE INDEX IF NOT EXISTS idx_mdm_cables_shield ON mdm_cables(shield)`;
    await sql `CREATE INDEX IF NOT EXISTS idx_mdm_contacts_connector_family ON mdm_contacts(connector_family)`;
    await sql `CREATE INDEX IF NOT EXISTS idx_mdm_accessories_connector_family ON mdm_accessories(connector_family)`;
}
export async function down() {
    await sql `DROP TABLE IF EXISTS mdm_accessories`;
    await sql `DROP TABLE IF EXISTS mdm_contacts`;
    await sql `DROP TABLE IF EXISTS mdm_cables`;
    await sql `DROP TABLE IF EXISTS mdm_connectors`;
}
