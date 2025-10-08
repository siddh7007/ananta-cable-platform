import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/cable_platform';
const sql = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

async function checkTables() {
  try {
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables:', result.map(r => r.table_name));
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await sql.end();
  }
}

checkTables();