import { sql } from '../db.js';
import fs from 'fs';
import path from 'path';
export async function seedMDMData() {
    const seedsDir = path.join(process.cwd(), 'seeds');
    // Load connectors
    const connectorsPath = path.join(seedsDir, 'mdm_connectors.json');
    if (fs.existsSync(connectorsPath)) {
        const connectors = JSON.parse(fs.readFileSync(connectorsPath, 'utf8'));
        for (const connector of connectors) {
            await sql `
        INSERT INTO mdm_connectors (
          mpn, family, series, positions, pitch_in, termination, gender, keying,
          compatible_contacts_awg, backshell_strain_relief, pin1_semantics, stud_size, status
        ) VALUES (
          ${connector.mpn}, ${connector.family}, ${connector.series}, ${connector.positions},
          ${connector.pitch_in}, ${connector.termination}, ${connector.gender}, ${connector.keying},
          ${JSON.stringify(connector.compatible_contacts_awg)}, ${connector.backshell_strain_relief},
          ${connector.pin1_semantics}, ${connector.stud_size}, ${connector.status}
        )
        ON CONFLICT (mpn) DO NOTHING
      `;
        }
        console.log(`Seeded ${connectors.length} MDM connectors`);
    }
    // Load cables
    const cablesPath = path.join(seedsDir, 'mdm_cables.json');
    if (fs.existsSync(cablesPath)) {
        const cables = JSON.parse(fs.readFileSync(cablesPath, 'utf8'));
        for (const cable of cables) {
            await sql `
        INSERT INTO mdm_cables (
          mpn, family, type, conductor_count, pitch_in, temp_rating_c, voltage_rating_v,
          shield, jacket_material, conductor_awg, od_in, flex_class, status
        ) VALUES (
          ${cable.mpn}, ${cable.family}, ${cable.type}, ${cable.conductor_count},
          ${cable.pitch_in}, ${cable.temp_rating_c}, ${cable.voltage_rating_v},
          ${cable.shield}, ${cable.jacket_material}, ${cable.conductor_awg},
          ${cable.od_in}, ${cable.flex_class}, ${cable.status}
        )
        ON CONFLICT (mpn) DO NOTHING
      `;
        }
        console.log(`Seeded ${cables.length} MDM cables`);
    }
    // Load contacts
    const contactsPath = path.join(seedsDir, 'mdm_contacts.json');
    if (fs.existsSync(contactsPath)) {
        const contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
        for (const contact of contacts) {
            await sql `
        INSERT INTO mdm_contacts (
          mpn, family, connector_family, termination, awg_range, plating, gender, status
        ) VALUES (
          ${contact.mpn}, ${contact.family}, ${contact.connector_family}, ${contact.termination},
          ${contact.awg_range}, ${contact.plating}, ${contact.gender}, ${contact.status}
        )
        ON CONFLICT (mpn) DO NOTHING
      `;
        }
        console.log(`Seeded ${contacts.length} MDM contacts`);
    }
    // Load accessories
    const accessoriesPath = path.join(seedsDir, 'mdm_accessories.json');
    if (fs.existsSync(accessoriesPath)) {
        const accessories = JSON.parse(fs.readFileSync(accessoriesPath, 'utf8'));
        for (const accessory of accessories) {
            await sql `
        INSERT INTO mdm_accessories (
          mpn, family, connector_family, type, cable_od_range_in, recovered_id_in,
          expanded_id_in, material, flame_rating, clamp_type, status
        ) VALUES (
          ${accessory.mpn}, ${accessory.family}, ${accessory.connector_family}, ${accessory.type},
          ${accessory.cable_od_range_in}, ${accessory.recovered_id_in},
          ${accessory.expanded_id_in}, ${accessory.material}, ${accessory.flame_rating},
          ${accessory.clamp_type}, ${accessory.status}
        )
        ON CONFLICT (mpn) DO NOTHING
      `;
        }
        console.log(`Seeded ${accessories.length} MDM accessories`);
    }
}
