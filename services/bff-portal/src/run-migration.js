import { sql } from './db.js';
import { up as createAssembliesDraft } from './migrations/001_create_assemblies_draft.js';
import { up as createAssembliesSynthesis } from './migrations/002_create_assemblies_synthesis.js';
import { up as createAssembliesSchema } from './migrations/003_create_assemblies_schema.js';
import { up as createMdmTables } from './migrations/004_create_mdm_tables.js';
import { up as createDrcReports } from './migrations/005_create_drc_reports.js';
async function runMigrations() {
    try {
        console.log('Running all migrations...');
        console.log('1. Creating assemblies_draft table...');
        await createAssembliesDraft();
        console.log('2. Creating assemblies_synthesis table...');
        await createAssembliesSynthesis();
        console.log('3. Creating assemblies_schema table...');
        await createAssembliesSchema();
        console.log('4. Creating MDM tables...');
        await createMdmTables();
        console.log('5. Creating DRC reports table...');
        await createDrcReports();
        console.log('All migrations completed successfully');
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
    finally {
        await sql.end();
    }
}
runMigrations();
