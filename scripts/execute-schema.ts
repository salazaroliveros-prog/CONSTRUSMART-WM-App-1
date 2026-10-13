/**
 * Script para ejecutar el esquema SQL en Supabase remoto
 * Usa el service role key para ejecutar SQL
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eypwnpcaxcxvptsfcqvy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHducGNheGN4dnB0c2ZjcXZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NzQ1NywiZXhwIjoyMTA3NDIzNDU3fQ.XGvlUGARaf0QzKpoNBjQOp5hxksPx0zUox03-8UYWgU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSchema() {
  console.log('🔧 Leyendo esquema SQL...');
  const fs = await import('fs');
  const path = await import('path');

  const schemaPath = path.join(process.cwd(), 'scripts', 'SUPABASE_SCHEMA_DEFINITIVO.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('📊 Ejecutando esquema SQL en Supabase remoto...');
  console.log(`📁 Archivo: ${schemaPath}`);
  console.log(`📏 Tamaño: ${schemaSql.length} caracteres`);
  console.log('');

  try {
    // Dividir el SQL en statements individuales
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Procesando ${statements.length} statements...`);
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue;

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Intentar ejecutar directamente como query
          const { data: queryData, error: queryError } = await supabase
            .from('_temp')
            .select('*')
            .limit(1);

          // Si falla, es porque no podemos ejecutar SQL arbitrario via REST API
          if (queryError) {
            console.log(`⚠️  Statement ${i + 1}: No se puede ejecutar vía REST API`);
            console.log(`   Razón: Supabase REST API no permite ejecutar SQL arbitrario`);
            console.log(`   Solución: Necesita ejecutar manualmente en SQL Editor de Supabase Dashboard`);
            console.log('');
            break;
          }
        }

        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Procesados ${i + 1}/${statements.length} statements...`);
        }
      } catch (e) {
        errorCount++;
        console.log(`❌ Error en statement ${i + 1}:`, (e as Error).message);
      }
    }

    console.log('');
    console.log('📊 Resumen:');
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Debido a limitaciones de la REST API de Supabase,');
    console.log('   se requiere ejecutar el SQL manualmente en el Dashboard.');
    console.log('');
    console.log('📋 Instrucciones:');
    console.log('1. Ve a: https://supabase.com/dashboard/project/eypwnpcaxcxvptsfcqvy/sql/new');
    console.log('2. Abre el archivo: scripts/SUPABASE_SCHEMA_DEFINITIVO.sql');
    console.log('3. Copia todo el contenido');
    console.log('4. Pégalo en el SQL Editor');
    console.log('5. Haz clic en "Run"');
    console.log('');
    console.log('Esto creará todas las tablas, triggers, funciones y políticas RLS.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

executeSchema();
