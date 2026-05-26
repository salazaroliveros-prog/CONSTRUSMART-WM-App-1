/**
 * Script de configuración de base de datos Supabase
 *
 * Lee DATABASE_URL de .env.local y ejecuta SYNC_SUPABASE_FINAL.sql
 * Uso: node scripts/setup-database.mjs
 */

import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env.local manualmente (sin dotenv, para evitar dependencias)
const envLocalPath = resolve(__dirname, '..', '.env.local');
const sqlPath = resolve(__dirname, '..', 'SYNC_SUPABASE_FINAL.sql');

function loadEnvLocal() {
  if (!existsSync(envLocalPath)) {
    console.error(`❌ No se encuentra ${envLocalPath}`);
    console.error('   Creá el archivo .env.local con:');
    console.error('   DATABASE_URL=postgresql://postgres.xxxx:password@host:5432/postgres');
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
  console.error('❌ No se encontró DATABASE_URL en .env.local');
  process.exit(1);
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   CONSTRUSMART WM — Setup de Base de Datos      ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const connStr = loadEnvLocal();
  console.log('📦 Leyendo conexión de .env.local...');
  console.log('🔌 Conectando a PostgreSQL...\n');

  // Extraer credenciales
  const match = connStr.match(/postgresql:\/\/(.+?):(.+?)@(.+?):(\d+)\/(.+)/);
  if (!match) {
    console.error('❌ No se pudo parsear la connection string');
    process.exit(1);
  }
  const [, dbUser, dbPass, dbHost, dbPort, dbName] = match;
  console.log('   Host:', dbHost);
  console.log('   User:', decodeURIComponent(dbUser));

  const client = new pg.Client({
    host: decodeURIComponent(dbHost),
    port: parseInt(dbPort, 10),
    database: decodeURIComponent(dbName),
    user: decodeURIComponent(dbUser),
    password: decodeURIComponent(dbPass),
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Supabase PostgreSQL\n');
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  }

  // Leer SQL
  const sql = readFileSync(sqlPath, 'utf-8');

  // Ejecutar
  console.log('📦 Ejecutando SYNC_SUPABASE_FINAL.sql...');
  console.log('   Esto puede tomar unos segundos...\n');

  try {
    await client.query(sql);
    console.log('✅ SQL ejecutado correctamente\n');
  } catch (err) {
    // Errores de "already exists" son esperados (idempotente)
    if (err.message.includes('already exists')) {
      console.log('⚠️  Algunos objetos ya existían (idempotente — OK)\n');
    } else {
      console.error('❌ Error ejecutando SQL:', err.message);
      await client.end();
      process.exit(1);
    }
  }

  // Verificar tablas
  console.log('🔍 Verificando tablas creadas...\n');
  const tables = [
    'clientes', 'proyectos', 'presupuestos', 'transacciones', 'actividades',
    'equipos', 'equipo_miembros', 'renglones', 'renglon_usage', 'renglon_precios_historial',
    'cambios_presupuesto', 'materiales_proyecto', 'movimientos_materiales',
    'conciliaciones', 'partidas_conciliacion', 'checklist_items', 'notificaciones',
  ];

  let allOk = true;
  for (const t of tables) {
    try {
      const res = await client.query(
        `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename=$1) AS existe`,
        [t]
      );
      if (res.rows[0]?.existe) {
        console.log(`  ✅ ${t}`);
      } else {
        console.log(`  ❌ ${t} — NO EXISTE`);
        allOk = false;
      }
    } catch (err) {
      console.log(`  ❌ ${t} — ${err.message}`);
      allOk = false;
    }
  }

  // Verificar RLS
  console.log('\n🔍 Verificando RLS...');
  try {
    const rlsRes = await client.query(`
      SELECT tablename, rowsecurity FROM pg_tables
      WHERE schemaname='public' AND tablename = ANY($1)
      ORDER BY tablename
    `, [tables]);
    let rlsOk = 0;
    for (const row of rlsRes.rows) {
      if (row.rowsecurity) {
        console.log(`  ✅ ${row.tablename}: RLS ON`);
        rlsOk++;
      } else {
        console.log(`  ⚠️  ${row.tablename}: RLS OFF`);
      }
    }
    console.log(`\n   ${rlsOk}/${tables.length} tablas con RLS habilitado`);
  } catch (err) {
    console.log('  ⚠️  No se pudo verificar RLS:', err.message);
  }

  await client.end();

  if (allOk) {
    console.log('\n🎁 Base de datos configurada correctamente.');
    console.log('   Ahora podés recargar la app y los datos se guardarán en Supabase.');
  } else {
    console.log('\n⚠️  Hubo errores. Revisá los mensajes arriba.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
