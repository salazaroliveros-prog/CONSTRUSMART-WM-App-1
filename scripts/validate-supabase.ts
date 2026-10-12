/**
 * Script para validar la conexión a Supabase y verificar configuraciones
 * Ejecutar con: npx tsx scripts/validate-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://arkemshnmyfokhmbsvpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya2Vtc2hubXlmb2tobWJzdnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDI0MDEsImV4cCI6MjA5NTExODQwMX0.f7LByRJgnGK3ljVgpUwXXMyz50evFfjbv_XY5LSXnjI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateSupabase() {
  console.log('🔍 Validando conexión a Supabase...');
  console.log(`📡 URL: ${supabaseUrl}`);
  console.log('');

  try {
    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Error de conexión:', sessionError.message);
    } else {
      console.log('✅ Conexión exitosa');
    }

    // 2. Intentar verificar tablas existentes
    console.log('');
    console.log('2️⃣ Verificando tablas en la base de datos...');
    const tables = [
      'clientes',
      'proyectos',
      'presupuestos',
      'transacciones',
      'actividades',
      'equipos',
      'equipo_miembros',
      'empleados',
      'proveedores',
      'ordenes_compra',
      'notificaciones',
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: ${data.count} registros`);
        }
      } catch (e) {
        console.log(`   ⚠️  ${table}: Error al verificar`);
      }
    }

    // 3. Verificar usuario de prueba
    console.log('');
    console.log('3️⃣ Verificando usuario de prueba (demo@construsmart.com)...');
    try {
      const { data: users, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.log('   ⚠️  No se pueden listar usuarios (requiere service role key)');
      } else {
        const demoUser = users.users.find(u => u.email === 'demo@construsmart.com');
        if (demoUser) {
          console.log('   ✅ Usuario demo existe');
          console.log(`   🆔 ID: ${demoUser.id}`);
          console.log(`   📧 Email: ${demoUser.email}`);
          console.log(`   ✉️  Email confirmado: ${demoUser.email_confirmed_at ? 'Sí' : 'No'}`);
        } else {
          console.log('   ❌ Usuario demo no existe');
        }
      }
    } catch (e) {
      console.log('   ⚠️  No se puede verificar usuarios (requiere service role key)');
    }

    console.log('');
    console.log('📋 Configuraciones que requieren acción manual en Supabase Dashboard:');
    console.log('');
    console.log('1. Dominios permitidos (Site URL y Redirect URLs):');
    console.log('   - https://construsmart-wm-app-1.vercel.app');
    console.log('   - http://localhost:8080');
    console.log('');
    console.log('2. Autenticación:');
    console.log('   - Deshabilitar "Confirm email" para pruebas');
    console.log('   - Verificar que Email Auth esté habilitado');
    console.log('');
    console.log('3. Crear usuario de prueba:');
    console.log('   - Email: demo@construsmart.com');
    console.log('   - Contraseña: Demo123456');
    console.log('   - Nombre: Usuario Demo');
    console.log('');
    console.log('🌐 Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

validateSupabase();
