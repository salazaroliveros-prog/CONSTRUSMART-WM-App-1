/**
 * Script para crear un usuario de prueba en Supabase
 * Ejecutar con: npx tsx scripts/create-test-user.ts
 */

import { createClient } from '@supabase/supabase-js';

// Credenciales de prueba (deben configurarse en .env.local)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://arkemshnmyfokhmbsvpv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya2Vtc2hubXlmb2tobWJzdnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDI0MDEsImV4cCI6MjA5NTExODQwMX0.f7LByRJgnGK3ljVgpUwXXMyz50evFfjbv_XY5LSXnjI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Datos del usuario de prueba
const testUser = {
  email: 'demo@construsmart.com',
  password: 'Demo123456',
  nombre: 'Usuario Demo',
};

async function createTestUser() {
  console.log('🔧 Creando usuario de prueba...');
  console.log(`📧 Email: ${testUser.email}`);
  console.log(`🔑 Contraseña: ${testUser.password}`);
  console.log(`👤 Nombre: ${testUser.nombre}`);
  console.log('');

  try {
    // Intentar registrar el usuario
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
        console.log('⚠️  El usuario ya existe. Intentando iniciar sesión...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: testUser.password,
        });

        if (signInError) {
          console.error('❌ Error al iniciar sesión:', signInError.message);
          process.exit(1);
        }

        console.log('✅ Usuario existente. Sesión iniciada correctamente.');
        console.log(`🆔 User ID: ${signInData.user?.id}`);
        return signInData.user?.id;
      } else {
        console.error('❌ Error al crear usuario:', error.message);
        process.exit(1);
      }
    }

    console.log('✅ Usuario creado exitosamente.');
    console.log(`🆔 User ID: ${data.user?.id}`);
    console.log('');
    console.log('📋 Credenciales de prueba:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Contraseña: ${testUser.password}`);
    console.log('');
    console.log('🌐 Puedes usar estas credenciales para iniciar sesión en la app.');

    return data.user?.id;
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

// Ejecutar el script
createTestUser()
  .then((userId) => {
    if (userId) {
      console.log('');
      console.log('✨ Usuario de prueba listo para usar.');
      console.log(`🆔 User ID: ${userId}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
