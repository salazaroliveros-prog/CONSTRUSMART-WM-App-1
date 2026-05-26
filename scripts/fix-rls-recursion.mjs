import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(__dirname, '..', '.env.local');
const fixSqlPath = resolve(__dirname, 'fix-rls-recursion.sql');

function loadDbUrl() {
  if (!existsSync(envLocalPath)) {
    console.error(`❌ No se encuentra ${envLocalPath}`);
    process.exit(1);
  }
  const content = readFileSync(envLocalPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key === 'DATABASE_URL') return val;
  }
  console.error('❌ DATABASE_URL no encontrado en .env.local');
  process.exit(1);
}

async function main() {
  const connStr = loadDbUrl();
  const match = connStr.match(/postgresql:\/\/(.+?):(.+?)@(.+?):(\d+)\/(.+)/);
  if (!match) {
    console.error('❌ No se pudo parsear DATABASE_URL');
    process.exit(1);
  }
  const [, dbUser, dbPass, dbHost, dbPort, dbName] = match;

  const client = new pg.Client({
    host: decodeURIComponent(dbHost),
    port: parseInt(dbPort, 10),
    database: decodeURIComponent(dbName),
    user: decodeURIComponent(dbUser),
    password: decodeURIComponent(dbPass),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Conectado a PostgreSQL');

  const sql = readFileSync(fixSqlPath, 'utf-8');
  await client.query(sql);
  console.log('✅ Fix RLS recursion aplicado correctamente');

  await client.end();
  console.log('✅ Listo');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
