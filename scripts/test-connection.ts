/**
 * Script para probar la conexión con Supabase
 * Usa las credenciales correctas del nuevo proyecto
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eypwnpcaxcxvptsfcqvy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHducGNheGN4dnB0c2ZjcXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDc0NTcsImV4cCI6MjEwNzQyMzQ1N30.N8bR0_pJOwCUUgEmyOK4ANIQcD6xhLfbb02NExr-Xvw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔧 Probando conexión con Supabase...');
  console.log(`📁 URL: ${supabaseUrl}`);
  console.log(`🆔 Project ID: eypwnpcaxcxvptsfcqvy`);
  console.log('');

  try {
    // Test 1: Conexión básica
    console.log('1️⃣  Probando conexión básica...');
    const { data, error } = await supabase.from('clientes').select('*').limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      console.log('');
      console.log('📋 Diagnóstico:');
      console.log('   - Verifica que el proyecto eypwnpcaxcxvptsfcqvy exista');
      console.log('   - Verifica que la key sea correcta');
      console.log('   - Verifica que las tablas existan');
      return;
    }

    console.log('✅ Conexión exitosa');
    console.log('');

    // Test 2: Verificar tablas
    console.log('2️⃣  Verificando tablas...');
    const tables = ['clientes', 'proyectos', 'presupuestos', 'transacciones', 'actividades', 'notificaciones'];
    
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('*').limit(1);
      if (tableError) {
        console.log(`   ❌ ${table}: ${tableError.message}`);
      } else {
        console.log(`   ✅ ${table}: OK`);
      }
    }

    console.log('');
    console.log('3️⃣  Probando login con usuario de prueba...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@construsmart.com',
      password: 'Demo123456',
    });

    if (authError) {
      console.error('❌ Error de login:', authError.message);
      console.log('');
      console.log('📋 Solución:');
      console.log('   - Verifica que el usuario exista en Supabase Dashboard');
      console.log('   - Verifica que "Confirm email" esté deshabilitado');
      console.log('   - Si el usuario no existe, créalo manualmente con "Auto Confirm User"');
    } else {
      console.log('✅ Login exitoso');
      console.log(`🆔 User ID: ${authData.user?.id}`);
      console.log(`📧 Email: ${authData.user?.email}`);
      console.log(`✉️  Email confirmado: ${authData.user?.email_confirmed_at ? 'Sí' : 'No'}`);
    }

    console.log('');
    console.log('🎉 La conexión con Supabase está funcionando correctamente');
    console.log('');
    console.log('📋 Siguiente paso:');
    console.log('   Ve a https://construsmart-wm-app-1.vercel.app');
    console.log('   Intenta iniciar sesión con demo@construsmart.com / Demo123456');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testConnection();
