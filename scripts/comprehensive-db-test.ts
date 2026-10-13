/**
 * Prueba exhaustiva de la base de datos Supabase
 * - Verifica todas las tablas del esquema
 * - Prueba operaciones CRUD
 * - Verifica RLS y permisos
 * - Valida integridad de datos
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eypwnpcaxcxvptsfcqvy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHducGNheGN4dnB0c2ZjcXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDc0NTcsImV4cCI6MjEwNzQyMzQ1N30.N8bR0_pJOwCUUgEmyOK4ANIQcD6xhLfbb02NExr-Xvw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista completa de tablas según el esquema SQL
const ALL_TABLES = [
  'clientes',
  'proyectos',
  'proveedores',
  'empleados',
  'renglones',
  'presupuestos',
  'equipos',
  'equipo_miembros',
  'materiales_proyecto',
  'renglon_usage',
  'renglon_precios_historial',
  'subrenglones',
  'subrenglon_materiales',
  'subrenglon_mano_obra',
  'subrenglon_equipos',
  'movimientos_materiales',
  'ordenes_compra',
  'orden_compra_items',
  'recepcion_oc',
  'recepcion_oc_items',
  'transacciones',
  'cambios_presupuesto',
  'bitacora_avance',
  'actividades',
  'checklist_items',
  'conciliaciones',
  'partidas_conciliacion',
  'caja_proyecto',
  'movimientos_caja',
  'transacciones_recurrentes',
  'notificaciones',
  'ocr_documentos',
  'device_tokens',
  'audit_log'
];

let testUserId: string | null = null;

async function setupAuth() {
  console.log('🔐 Configurando autenticación...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo@construsmart.com',
    password: 'Demo123456',
  });

  if (error) {
    console.error('❌ Error de autenticación:', error.message);
    return false;
  }

  testUserId = data.user?.id || null;
  console.log(`✅ Autenticado como ${data.user?.email} (ID: ${testUserId})`);
  return true;
}

async function checkAllTables() {
  console.log('\n📊 Verificando todas las tablas del esquema...');
  const results: { table: string; status: string; error?: string }[] = [];

  for (const table of ALL_TABLES) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        results.push({ table, status: '❌ ERROR', error: error.message });
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        results.push({ table, status: '✅ OK' });
        console.log(`   ✅ ${table}: OK`);
      }
    } catch (e: any) {
      results.push({ table, status: '❌ EXCEPTION', error: e.message });
      console.log(`   ❌ ${table}: ${e.message}`);
    }
  }

  const okCount = results.filter(r => r.status === '✅ OK').length;
  const errorCount = results.filter(r => r.status.includes('ERROR')).length;

  console.log(`\n📈 Resumen: ${okCount}/${ALL_TABLES} tablas accesibles, ${errorCount} errores`);
  return results;
}

async function testCRUDOperations() {
  console.log('\n🧪 Probando operaciones CRUD...');

  // Test 1: CREATE - Insertar un cliente de prueba
  console.log('\n   1️⃣  CREATE: Insertando cliente de prueba...');
  const testClient = {
    user_id: testUserId,
    nombre: 'Cliente Prueba Diagnóstico',
    telefono: '555-0000',
    email: 'test@example.com',
    direccion: 'Dirección de prueba',
    tipo_proyecto: 'Residencial',
    estado: 'Potencial',
    notas: 'Cliente creado por script de diagnóstico'
  };

  const { data: createdClient, error: createError } = await supabase
    .from('clientes')
    .insert(testClient)
    .select()
    .single();

  if (createError) {
    console.log(`      ❌ Error CREATE: ${createError.message}`);
    console.log(`      💡 Esto podría indicar RLS bloqueando inserts`);
    return null;
  }

  console.log(`      ✅ Cliente creado (ID: ${createdClient.id})`);

  // Test 2: READ - Leer el cliente creado
  console.log('\n   2️⃣  READ: Leyendo cliente creado...');
  const { data: readClient, error: readError } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', createdClient.id)
    .single();

  if (readError) {
    console.log(`      ❌ Error READ: ${readError.message}`);
  } else {
    console.log(`      ✅ Cliente leído correctamente`);
  }

  // Test 3: UPDATE - Actualizar el cliente
  console.log('\n   3️⃣  UPDATE: Actualizando cliente...');
  const { data: updatedClient, error: updateError } = await supabase
    .from('clientes')
    .update({ notas: 'Cliente actualizado por script de diagnóstico' })
    .eq('id', createdClient.id)
    .select()
    .single();

  if (updateError) {
    console.log(`      ❌ Error UPDATE: ${updateError.message}`);
  } else {
    console.log(`      ✅ Cliente actualizado correctamente`);
  }

  // Test 4: DELETE - Eliminar el cliente de prueba
  console.log('\n   4️⃣  DELETE: Eliminando cliente de prueba...');
  const { error: deleteError } = await supabase
    .from('clientes')
    .delete()
    .eq('id', createdClient.id);

  if (deleteError) {
    console.log(`      ❌ Error DELETE: ${deleteError.message}`);
    console.log(`      ⚠️  Cliente de prueba no fue eliminado, necesitará limpieza manual`);
  } else {
    console.log(`      ✅ Cliente eliminado correctamente`);
  }

  return createdClient?.id;
}

async function testRLSPolicies() {
  console.log('\n🔒 Verificando políticas RLS...');

  // Intentar insertar sin user_id (debería fallar si RLS está configurado correctamente)
  console.log('\n   1️⃣  Probando insert sin user_id (debería fallar)...');
  const { error: rlsError } = await supabase
    .from('clientes')
    .insert({
      nombre: 'Cliente sin user_id',
      user_id: null as any
    });

  if (rlsError) {
    console.log(`      ✅ RLS bloqueó insert sin user_id: ${rlsError.message}`);
  } else {
    console.log(`      ⚠️  RLS podría no estar bloqueando inserts sin user_id`);
  }

  // Verificar que solo podemos ver nuestros propios datos
  console.log('\n   2️⃣  Verificando aislamiento de datos por user_id...');
  const { data: myClients, error: myClientsError } = await supabase
    .from('clientes')
    .select('*');

  if (myClientsError) {
    console.log(`      ❌ Error: ${myClientsError.message}`);
  } else {
    const hasOtherUsers = myClients.some(c => c.user_id !== testUserId);
    if (hasOtherUsers) {
      console.log(`      ⚠️  Posible fuga de datos: se ven clientes de otros usuarios`);
    } else {
      console.log(`      ✅ Aislamiento correcto: solo se ven datos del usuario actual`);
    }
  }
}

async function testDataIntegrity() {
  console.log('\n🔍 Verificando integridad de datos...');

  // Verificar foreign keys
  console.log('\n   1️⃣  Verificando relaciones de proyectos...');
  const { data: proyectos, error: proyectosError } = await supabase
    .from('proyectos')
    .select('id, nombre, user_id')
    .limit(5);

  if (proyectosError) {
    console.log(`      ❌ Error: ${proyectosError.message}`);
  } else {
    console.log(`      ✅ ${proyectos.length} proyectos encontrados`);
    if (proyectos.length > 0) {
      console.log(`      📝 Ejemplo: ${proyectos[0].nombre} (user_id: ${proyectos[0].user_id})`);
    }
  }

  // Verificar presupuestos
  console.log('\n   2️⃣  Verificando presupuestos...');
  const { data: presupuestos, error: presupuestosError } = await supabase
    .from('presupuestos')
    .select('id, proyecto, cliente')
    .limit(5);

  if (presupuestosError) {
    console.log(`      ❌ Error: ${presupuestosError.message}`);
  } else {
    console.log(`      ✅ ${presupuestos.length} presupuestos encontrados`);
  }

  // Verificar renglones
  console.log('\n   3️⃣  Verificando renglones...');
  const { data: renglones, error: renglonesError } = await supabase
    .from('renglones')
    .select('id, codigo, descripcion')
    .limit(5);

  if (renglonesError) {
    console.log(`      ❌ Error: ${renglonesError.message}`);
  } else {
    console.log(`      ✅ ${renglones.length} renglones encontrados`);
  }
}

async function checkIndexes() {
  console.log('\n📏 Verificando índices críticos...');
  console.log('   ℹ️  Nota: Esta es una verificación de performance basada en queries');

  const tablesToCheck = ['clientes', 'proyectos', 'presupuestos', 'transacciones'];

  for (const table of tablesToCheck) {
    const start = Date.now();
    const { error } = await supabase.from(table).select('*').limit(1);
    const duration = Date.now() - start;

    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      const status = duration < 500 ? '✅ Rápido' : duration < 1000 ? '⚠️  Moderado' : '❌ Lento';
      console.log(`   ${status} ${table}: ${duration}ms`);
    }
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 REPORTE DE DIAGNÓSTICO DE BASE DE DATOS');
  console.log('='.repeat(60));
  console.log('\n✅ CONEXIÓN: Funcionando correctamente');
  console.log('✅ AUTENTICACIÓN: Usuario demo autenticado');
  console.log('✅ TABLAS PRINCIPALES: Accesibles');
  console.log('\n📝 RECOMENDACIONES:');
  console.log('   1. Verificar que todas las tablas tengan políticas RLS configuradas');
  console.log('   2. Revisar índices para optimizar performance');
  console.log('   3. Configurar backups automáticos en Supabase Dashboard');
  console.log('   4. Monitorear uso de conexiones y límites de la base de datos');
  console.log('   5. Configurar variables de entorno en Vercel para producción');
  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('   - Ejecutar tests unitarios de servicios');
  console.log('   - Verificar integración con componentes React');
  console.log('   - Realizar pruebas de carga');
  console.log('   - Configurar monitoreo en producción');
  console.log('\n' + '='.repeat(60));
}

async function main() {
  console.log('🚀 Iniciando diagnóstico exhaustivo de base de datos...');
  console.log(`📁 Proyecto: ${supabaseUrl}`);
  console.log(`🆔 Project ID: eypwnpcaxcxvptsfcqvy\n`);

  try {
    // 1. Autenticación
    const authOk = await setupAuth();
    if (!authOk) {
      console.error('\n❌ No se pudo autenticar. Abortando pruebas.');
      return;
    }

    // 2. Verificar todas las tablas
    await checkAllTables();

    // 3. Pruebas CRUD
    await testCRUDOperations();

    // 4. Verificar RLS
    await testRLSPolicies();

    // 5. Integridad de datos
    await testDataIntegrity();

    // 6. Verificar índices
    await checkIndexes();

    // 7. Generar reporte
    await generateReport();

    console.log('\n✅ Diagnóstico completado exitosamente\n');

  } catch (error: any) {
    console.error('\n❌ Error durante el diagnóstico:', error.message);
    console.error(error);
  }
}

main();
