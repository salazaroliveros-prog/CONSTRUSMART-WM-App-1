/**
 * Script para verificar que el usuario de prueba funciona
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eypwnpcaxcxvptsfcqvy.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHducGNheGN4dnB0c2ZjcXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDc0NTcsImV4cCI6MjEwNzQyMzQ1N30.N8bR0_pJOwCUUgEmyOK4ANIQcD6xhLfbb02NExr-Xvw';

const supabase = createClient(supabaseUrl, anonKey);

async function verifyUser() {
  console.log('🔍 Verificando usuario de prueba...');
  console.log(`📧 Email: demo@construsmart.com`);
  console.log(`🔑 Contraseña: Demo123456`);
  console.log('');

  try {
    // Intentar iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo@construsmart.com',
      password: 'Demo123456',
    });

    if (error) {
      console.error('❌ Error al iniciar sesión:', error.message);
      console.log('');
      console.log('📋 Solución:');
      console.log('1. Verifica que el usuario exista en Supabase Dashboard');
      console.log('2. Verifica que "Confirm email" esté deshabilitado');
      console.log('3. Si el email no está confirmado, deshabilita "Confirm email" en Auth settings');
      return;
    }

    console.log('✅ Usuario verificado exitosamente');
    console.log(`🆔 User ID: ${data.user?.id}`);
    console.log(`📧 Email: ${data.user?.email}`);
    console.log(`✉️  Email confirmado: ${data.user?.email_confirmed_at ? 'Sí' : 'No'}`);
    console.log(`🔐 Session: ${data.session ? 'Activa' : 'Inactiva'}`);
    console.log('');
    console.log('🎉 El usuario está listo para usar en la app');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

verifyUser();
