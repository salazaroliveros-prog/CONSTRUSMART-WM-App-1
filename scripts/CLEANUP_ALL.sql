-- =====================================================================
-- CLEANUP_ALL.sql
-- Elimina TODO el esquema de CONSTRUSMART WM de Supabase
-- Ejecutar ANTES de ERP_SCHEMA_FINAL.sql para tener una base limpia
-- =====================================================================

-- 1. ELIMINAR POLÍTICAS RLS (barrido completo - despeja dependencias)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. ELIMINAR TRIGGERS
-- Los triggers se eliminarán automáticamente con DROP TABLE ... CASCADE

-- 3. ELIMINAR FUNCIONES (CASCADE por si quedan dependencias)
DROP FUNCTION IF EXISTS public.fn_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.user_owns_equipo(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_owns_presupuesto(uuid) CASCADE;

-- 4. ELIMINAR TABLAS (orden inverso al de creación para respetar FKs)
DROP TABLE IF EXISTS public.transacciones_recurrentes CASCADE;
DROP TABLE IF EXISTS public.movimientos_caja CASCADE;
DROP TABLE IF EXISTS public.caja_proyecto CASCADE;
DROP TABLE IF EXISTS public.ocr_documentos CASCADE; -- New table
DROP TABLE IF EXISTS public.device_tokens CASCADE; -- New table
DROP TABLE IF EXISTS public.recepcion_oc_items CASCADE;
DROP TABLE IF EXISTS public.recepcion_oc CASCADE;
DROP TABLE IF EXISTS public.orden_compra_items CASCADE;
DROP TABLE IF EXISTS public.ordenes_compra CASCADE;
DROP TABLE IF EXISTS public.proveedores CASCADE;
DROP TABLE IF EXISTS public.notificaciones CASCADE;
DROP TABLE IF EXISTS public.checklist_items CASCADE;
DROP TABLE IF EXISTS public.partidas_conciliacion CASCADE;
DROP TABLE IF EXISTS public.conciliaciones CASCADE;
DROP TABLE IF EXISTS public.movimientos_materiales CASCADE;
DROP TABLE IF EXISTS public.materiales_proyecto CASCADE;
DROP TABLE IF EXISTS public.cambios_presupuesto CASCADE;
DROP TABLE IF EXISTS public.renglon_precios_historial CASCADE;
DROP TABLE IF EXISTS public.renglon_usage CASCADE;
DROP TABLE IF EXISTS public.renglones CASCADE;
DROP TABLE IF EXISTS public.equipo_miembros CASCADE;
DROP TABLE IF EXISTS public.equipos CASCADE;
DROP TABLE IF EXISTS public.empleados CASCADE;
DROP TABLE IF EXISTS public.actividades CASCADE;
DROP TABLE IF EXISTS public.bitacora_avance CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.transacciones CASCADE;
DROP TABLE IF EXISTS public.presupuestos CASCADE;
DROP TABLE IF EXISTS public.proyectos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;


-- 5. ELIMINAR EXTENSIONES (opcional — comentar si se usan en otros proyectos)
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- 6. VERIFICACIÓN: tablas restantes
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes','proyectos','presupuestos','transacciones',
    'empleados',
    'audit_log','bitacora_avance',
    'actividades','equipos','equipo_miembros',
    'renglones','renglon_usage','renglon_precios_historial',
    'cambios_presupuesto','materiales_proyecto','movimientos_materiales',
    'conciliaciones','partidas_conciliacion','checklist_items',
    'notificaciones',
    'proveedores','ordenes_compra','orden_compra_items','recepcion_oc','recepcion_oc_items',
    'ocr_documentos','device_tokens','caja_proyecto','movimientos_caja','transacciones_recurrentes'
  );

-- Si el SELECT anterior no devuelve filas, la base está limpia ✅
-- Luego ejecutar ERP_SCHEMA_FINAL.sql
-- =====================================================================
