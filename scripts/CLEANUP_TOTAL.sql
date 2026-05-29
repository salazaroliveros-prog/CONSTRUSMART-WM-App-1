-- =====================================================================
-- CLEANUP_TOTAL.sql
-- ELIMINA TODO: políticas, luego funciones, luego tablas
-- ADVERTENCIA: Borra TODOS los datos
-- =====================================================================

-- 1. Primero: Eliminar TODAS las políticas
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2. Eliminar triggers
DROP TRIGGER IF EXISTS trg_presupuestos_updated_at ON public.presupuestos;
DROP TRIGGER IF EXISTS trg_subrenglones_updated_at ON public.subrenglones;
DROP TRIGGER IF EXISTS trg_caja_proyecto_updated_at ON public.caja_proyecto;
DROP TRIGGER IF EXISTS trg_movimientos_caja_updated_at ON public.movimientos_caja;
DROP TRIGGER IF EXISTS trg_transacciones_recurrentes_updated_at ON public.transacciones_recurrentes;

-- 3. Eliminar funciones (después de políticas que dependen de ellas)
DROP FUNCTION IF EXISTS public.fn_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.user_owns_equipo(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_owns_presupuesto(uuid) CASCADE;

-- 4. Eliminar tablas en orden correcto
DROP TABLE IF EXISTS public.subrenglon_equipos CASCADE;
DROP TABLE IF EXISTS public.subrenglon_mano_obra CASCADE;
DROP TABLE IF EXISTS public.subrenglon_materiales CASCADE;
DROP TABLE IF EXISTS public.subrenglones CASCADE;
DROP TABLE IF EXISTS public.renglon_usage CASCADE;
DROP TABLE IF EXISTS public.renglon_precios_historial CASCADE;
DROP TABLE IF EXISTS public.renglones CASCADE;
DROP TABLE IF EXISTS public.orden_compra_items CASCADE;
DROP TABLE IF EXISTS public.recepcion_oc_items CASCADE;
DROP TABLE IF EXISTS public.recepcion_oc CASCADE;
DROP TABLE IF EXISTS public.ordenes_compra CASCADE;
DROP TABLE IF EXISTS public.proveedores CASCADE;
DROP TABLE IF EXISTS public.checklist_items CASCADE;
DROP TABLE IF EXISTS public.notificaciones CASCADE;
DROP TABLE IF EXISTS public.partidas_conciliacion CASCADE;
DROP TABLE IF EXISTS public.conciliaciones CASCADE;
DROP TABLE IF EXISTS public.transacciones_recurrentes CASCADE;
DROP TABLE IF EXISTS public.movimientos_caja CASCADE;
DROP TABLE IF EXISTS public.caja_proyecto CASCADE;
DROP TABLE IF EXISTS public.ocr_documentos CASCADE;
DROP TABLE IF EXISTS public.device_tokens CASCADE;
DROP TABLE IF EXISTS public.materiales_proyecto CASCADE;
DROP TABLE IF EXISTS public.movimientos_materiales CASCADE;
DROP TABLE IF EXISTS public.cambios_presupuesto CASCADE;
DROP TABLE IF EXISTS public.equipo_miembros CASCADE;
DROP TABLE IF EXISTS public.equipos CASCADE;
DROP TABLE IF EXISTS public.actividades CASCADE;
DROP TABLE IF EXISTS public.bitacora_avance CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.empleados CASCADE;
DROP TABLE IF EXISTS public.transacciones CASCADE;
DROP TABLE IF EXISTS public.presupuestos CASCADE;
DROP TABLE IF EXISTS public.proyectos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;

SELECT 'Cleanup completado - todo eliminado' as status;