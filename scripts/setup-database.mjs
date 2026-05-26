/**
 * Script de configuración de base de datos Supabase
 *
 * Uso:
 *   1. Ve a Supabase Dashboard → Project Settings → Database → Connection string
 *      Copia la cadena "URI" (postgresql://postgres:xxxx@db.xxxx.supabase.co:5432/postgres)
 *   2. Ejecuta: node scripts/setup-database.mjs
 *
 * Alternativa con Supabase Management API:
 *   1. Crea un PAT en https://supabase.com/dashboard/account/tokens
 *   2. Ejecuta: node scripts/setup-database.mjs --pat
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_PATH = join(__dirname, '..', 'SYNC_SUPABASE_FINAL.sql');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function runViaConnectionString() {
  const connStr = (await ask('Connection String (postgresql://...): ')).trim();
  if (!connStr) {
    console.error('❌ Connection string requerida');
    return false;
  }

  const sql = readFileSync(SQL_PATH, 'utf-8');

  console.log('\n📦 Conectando a la base de datos...');
  const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Conectado\n');

  // Ejecutar el SQL completo
  console.log('📦 Ejecutando SYNC_SUPABASE_FINAL.sql...\n');
  try {
    await client.query(sql);
    console.log('✅ SQL ejecutado correctamente\n');
  } catch (err) {
    console.error('❌ Error ejecutando SQL:', err.message);
    return false;
  }

  // Verificar tablas
  console.log('🔍 Verificando tablas...');
  const tables = ['clientes', 'proyectos', 'presupuestos', 'transacciones', 'actividades',
    'equipos', 'equipo_miembros', 'renglones', 'conciliaciones', 'checklist_items', 'notificaciones',
    'cambios_presupuesto', 'materiales_proyecto', 'movimientos_materiales'];

  for (const t of tables) {
    try {
      const res = await client.query(`SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='${t}') AS existe`);
      if (res.rows[0]?.existe) {
        const count = await client.query(`SELECT COUNT(*)::int AS cnt FROM public.${t}`);
        console.log(`  ✅ ${t} (${count.rows[0].cnt} registros)`);
      } else {
        console.log(`  ❌ ${t} — NO EXISTE`);
      }
    } catch (err) {
      console.log(`  ❌ ${t} — ${err.message}`);
    }
  }

  await client.end();
  return true;
}

async function runViaManagementAPI() {
  const pat = (await ask('Supabase Personal Access Token: ')).trim();
  const ref = (await ask('Project Ref (de la URL: xxxxxxxx.supabase.co): ')).trim() || 'arkemshnmyfokhmbsvpv';

  if (!pat) {
    console.error('❌ PAT requerido. Créalo en: https://supabase.com/dashboard/account/tokens');
    return false;
  }

  const sql = readFileSync(SQL_PATH, 'utf-8');

  console.log('\n📦 Ejecutando SQL via Management API...\n');

  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));

  let ok = 0, fail = 0;
  for (let i = 0; i < statements.length; i++) {
    try {
      const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: statements[i] + ';' }),
      });
      if (res.ok) {
        ok++;
      } else {
        const text = await res.text();
        if (text.includes('already exists')) { ok++; continue; }
        fail++;
        if (fail <= 5) console.error(`  ❌ [${i}] ${statements[i].substring(0, 60)}... -> ${text.substring(0, 150)}`);
      }
    } catch (err) {
      fail++;
    }
    if ((i + 1) % 20 === 0) process.stdout.write(`  ${i + 1}/${statements.length} (✅ ${ok} | ❌ ${fail})\r`);
  }

  console.log(`\n\n✅ ${ok} sentencias OK, ${fail} errores`);
  return fail === 0;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   CONSTRUSMART WM — Setup de Base de Datos      ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('Elige el método de conexión:');
  console.log('  1. Connection String (postgresql://...) — RECOMENDADO');
  console.log('  2. Management API (requiere PAT)');

  const method = (await ask('\nMétodo (1/2): ')).trim();

  let success = false;
  if (method === '2') {
    success = await runViaManagementAPI();
  } else {
    success = await runViaConnectionString();
  }

  if (success) {
    console.log('\n🎉 Base de datos configurada correctamente.');
    console.log('   Ahora la app debería funcionar sin errores 500.');
  } else {
    console.log('\n⚠️  Hubo errores. Revisa los mensajes arriba.');
  }

  rl.close();
}

main().catch((err) => { console.error(err); rl.close(); process.exit(1); });
