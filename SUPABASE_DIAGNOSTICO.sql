/**
 * SUPABASE DIAGNOSTICO - Identificar problemas con tablas
 * 
 * Ejecuta este script en SQL Editor de Supabase para diagnosticar qué salió mal
 */

-- ============================================================================
-- 1. VERIFICAR QUE LAS TABLAS EXISTAN
-- ============================================================================

SELECT 
  tablename,
  'Existe' as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('equipos', 'presupuestos', 'equipo_miembros', 'cambios_presupuesto', 'materiales_proyecto')
ORDER BY tablename;

-- ============================================================================
-- 2. VERIFICAR ESTRUCTURA DE TABLAS PRINCIPALES
-- ============================================================================

-- Columnas de equipos
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'equipos'
ORDER BY ordinal_position;

-- Columnas de presupuestos
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'presupuestos'
ORDER BY ordinal_position;

-- Columnas de equipo_miembros
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'equipo_miembros'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. VERIFICAR POLÍTICAS RLS ACTIVAS
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('equipos', 'presupuestos', 'equipo_miembros')
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. VERIFICAR RLS HABILITADO
-- ============================================================================

SELECT 
  tablename,
  rowsecurity as "RLS Habilitado"
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('equipos', 'presupuestos', 'equipo_miembros');

-- ============================================================================
-- 5. VERIFICAR FUNCIONES Y TRIGGERS
-- ============================================================================

SELECT 
  trigger_name,
  event_object_table as table_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('equipos', 'presupuestos', 'equipo_miembros', 'cambios_presupuesto')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 6. VERIFICAR TIPOS (ENUMS) CREADOS
-- ============================================================================

SELECT 
  typname,
  typtype
FROM pg_type
WHERE typname IN ('cambio_estado', 'movimiento_subtipo', 'frecuencia_pago');

-- ============================================================================
-- 7. INTENTAR QUERIES SIMPLES PARA PROBAR
-- ============================================================================

-- Test: SELECT simple de equipos
SELECT COUNT(*) as "Total Equipos" FROM equipos;

-- Test: SELECT simple de presupuestos
SELECT COUNT(*) as "Total Presupuestos" FROM presupuestos;

-- Test: SELECT simple de equipo_miembros
SELECT COUNT(*) as "Total Equipo Miembros" FROM equipo_miembros;

-- ============================================================================
-- 8. VERIFICAR VISTAS
-- ============================================================================

SELECT 
  table_name,
  'Vista' as tipo
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'VIEW'
AND table_name LIKE 'v_%'
ORDER BY table_name;

-- ============================================================================
-- 9. LISTAR TODAS LAS TABLAS Y SU RLS
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✓ Habilitado' ELSE '✗ Deshabilitado' END as "RLS Status",
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as "Cantidad Policies"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
