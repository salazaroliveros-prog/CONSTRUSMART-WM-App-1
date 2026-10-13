/**
 * Script para configurar Supabase automáticamente
 * Necesita el service role key para operaciones administrativas
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://arkemshnmyfokhmbsvpv.supabase.co';
// Nota: Para operaciones administrativas necesitamos el service role key
// Por ahora usaremos el anon key solo para verificar conexión
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya2Vtc2hubXlmb2tobWJzdnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDI0MDEsImV4cCI6MjA5NTExODQwMX0.f7LByRJgnGK3ljVgpUwXXMyz50evFfjbv_XY5LSXnjI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('🔧 Intentando crear usuario de prueba...');
  console.log('');

  const testUser = {
    email: 'demo@construsmart.com',
    password: 'Demo123456',
    nombre: 'Usuario Demo',
  };

  try {
    // Intentar registrar con el cliente normal
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          nombre: testUser.nombre,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('⚠️  El usuario ya existe. Intentando iniciar sesión para verificar...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.password,
        });

        if (signInError) {
          console.error('❌ Error al iniciar sesión:', signInError.message);
          console.log('');
          console.log('📋 NECESITA ACCIÓN MANUAL:');
          console.log('1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv/auth/users');
          console.log('2. Busca el usuario demo@construsmart.com');
          console.log('3. Si existe, restablece la contraseña o verifica el estado');
          console.log('4. Si no existe, créalo manualmente con "Auto Confirm User"');
          return;
        }

        console.log('✅ Usuario existente verificado. Contraseña correcta.');
        console.log(`🆔 User ID: ${signInData.user?.id}`);
        console.log(`📧 Email: ${signInData.user?.email}`);
        console.log(`✉️  Email confirmado: ${signInData.user?.email_confirmed_at ? 'Sí' : 'No'}`);
        console.log('');
        console.log('📋 Credenciales para iniciar sesión:');
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Contraseña: ${testUser.password}`);
        return;
      } else {
        console.error('❌ Error al crear usuario:', error.message);
        console.log('');
        console.log('📋 NECESITA ACCIÓN MANUAL:');
        console.log('1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv/auth/settings');
        console.log('2. Deshabilita "Confirm email" en Email Auth');
        console.log('3. Luego crea el usuario manualmente en Authentication → Users');
        return;
      }
    }

    console.log('✅ Usuario creado exitosamente.');
    console.log(`🆔 User ID: ${data.user?.id}`);
    console.log(`📧 Email: ${data.user?.email}`);
    console.log(`✉️  Email confirmado: ${data.user?.email_confirmed_at ? 'Sí' : 'No'}`);
    console.log('');
    console.log('📋 Credenciales para iniciar sesión:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Contraseña: ${testUser.password}`);
    console.log('');
    console.log('🌐 Inicia sesión en: https://construsmart-wm-app-1.vercel.app');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

createTestUser();
