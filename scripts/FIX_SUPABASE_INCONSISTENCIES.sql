-- =====================================================================
-- FIX_SUPABASE_INCONSISTENCIES.sql
-- Corrige inconsistencias entre ERP_SCHEMA_FINAL.sql y Supabase
-- Detectadas el 2026-05-29
-- =====================================================================

-- =================================================================
-- PARTE 1: VERIFICAR / CREAR FUNCIONES FALTANTES
-- =================================================================

-- 1a. Función trigger fn_set_updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1b. Función SECURITY DEFINER para equipos (evita recursión RLS)
CREATE OR REPLACE FUNCTION public.user_owns_equipo(p_equipo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public, auth'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipos
    WHERE id = p_equipo_id AND user_id = auth.uid()
  );
$$;

-- 1c. Función SECURITY DEFINER para presupuestos
CREATE OR REPLACE FUNCTION public.user_owns_presupuesto(p_presupuesto_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public, auth'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.presupuestos
    WHERE id = p_presupuesto_id AND user_id = auth.uid()
  );
$$;

-- =================================================================
-- PARTE 2: CORREGIR POLÍTICAS RLS — BUGS DE SINTAXIS
-- (faltaban paréntesis de cierre en subconsultas anidadas)
-- =================================================================

-- 2a. Reparar movimientos_materiales (paréntesis faltantes)
DROP POLICY IF EXISTS "mov_select" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_insert" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_update" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_delete" ON public.movimientos_materiales;

CREATE POLICY "mov_select" ON public.movimientos_materiales
  FOR SELECT TO authenticated
  USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "mov_insert" ON public.movimientos_materiales
  FOR INSERT TO authenticated
  WITH CHECK (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "mov_update" ON public.movimientos_materiales
  FOR UPDATE TO authenticated
  USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "mov_delete" ON public.movimientos_materiales
  FOR DELETE TO authenticated
  USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

-- 2b. Reparar subrenglon_materiales
DROP POLICY IF EXISTS "srm_select" ON public.subrenglon_materiales;
DROP POLICY IF EXISTS "srm_insert" ON public.subrenglon_materiales;
DROP POLICY IF EXISTS "srm_update" ON public.subrenglon_materiales;
DROP POLICY IF EXISTS "srm_delete" ON public.subrenglon_materiales;

CREATE POLICY "srm_select" ON public.subrenglon_materiales
  FOR SELECT TO authenticated
  USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "srm_insert" ON public.subrenglon_materiales
  FOR INSERT TO authenticated
  WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "srm_update" ON public.subrenglon_materiales
  FOR UPDATE TO authenticated
  USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "srm_delete" ON public.subrenglon_materiales
  FOR DELETE TO authenticated
  USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

-- 2c. Reparar subrenglon_mano_obra
DROP POLICY IF EXISTS "smo_select" ON public.subrenglon_mano_obra;
DROP POLICY IF EXISTS "smo_insert" ON public.subrenglon_mano_obra;
DROP POLICY IF EXISTS "smo_update" ON public.subrenglon_mano_obra;
DROP POLICY IF EXISTS "smo_delete" ON public.subrenglon_mano_obra;

CREATE POLICY "smo_select" ON public.subrenglon_mano_obra
  FOR SELECT TO authenticated
  USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "smo_insert" ON public.subrenglon_mano_obra
  FOR INSERT TO authenticated
  WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "smo_update" ON public.subrenglon_mano_obra
  FOR UPDATE TO authenticated
  USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "smo_delete" ON public.subrenglon_mano_obra
  FOR DELETE TO authenticated
  USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

-- 2d. Reparar subrenglon_equipos
DROP POLICY IF EXISTS "sre_select" ON public.subrenglon_equipos;
DROP POLICY IF EXISTS "sre_insert" ON public.subrenglon_equipos;
DROP POLICY IF EXISTS "sre_update" ON public.subrenglon_equipos;
DROP POLICY IF EXISTS "sre_delete" ON public.subrenglon_equipos;

CREATE POLICY "sre_select" ON public.subrenglon_equipos
  FOR SELECT TO authenticated
  USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "sre_insert" ON public.subrenglon_equipos
  FOR INSERT TO authenticated
  WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "sre_update" ON public.subrenglon_equipos
  FOR UPDATE TO authenticated
  USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

CREATE POLICY "sre_delete" ON public.subrenglon_equipos
  FOR DELETE TO authenticated
  USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

-- =================================================================
-- PARTE 3: VERIFICAR / CREAR TRIGGERS FALTANTES
-- =================================================================

-- 3a. presupuestos
DROP TRIGGER IF EXISTS trg_presupuestos_updated_at ON public.presupuestos;
CREATE TRIGGER trg_presupuestos_updated_at
  BEFORE UPDATE ON public.presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3b. subrenglones
DROP TRIGGER IF EXISTS trg_subrenglones_updated_at ON public.subrenglones;
CREATE TRIGGER trg_subrenglones_updated_at
  BEFORE UPDATE ON public.subrenglones
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3c. caja_proyecto
DROP TRIGGER IF EXISTS trg_caja_proyecto_updated_at ON public.caja_proyecto;
CREATE TRIGGER trg_caja_proyecto_updated_at
  BEFORE UPDATE ON public.caja_proyecto
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3d. movimientos_caja
DROP TRIGGER IF EXISTS trg_movimientos_caja_updated_at ON public.movimientos_caja;
CREATE TRIGGER trg_movimientos_caja_updated_at
  BEFORE UPDATE ON public.movimientos_caja
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3e. transacciones_recurrentes
DROP TRIGGER IF EXISTS trg_transacciones_recurrentes_updated_at ON public.transacciones_recurrentes;
CREATE TRIGGER trg_transacciones_recurrentes_updated_at
  BEFORE UPDATE ON public.transacciones_recurrentes
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3f. proveedores
DROP TRIGGER IF EXISTS trg_proveedores_updated_at ON public.proveedores;
CREATE TRIGGER trg_proveedores_updated_at
  BEFORE UPDATE ON public.proveedores
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3g. ordenes_compra
DROP TRIGGER IF EXISTS trg_ordenes_compra_updated_at ON public.ordenes_compra;
CREATE TRIGGER trg_ordenes_compra_updated_at
  BEFORE UPDATE ON public.ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3h. conciliaciones
DROP TRIGGER IF EXISTS trg_conciliaciones_updated_at ON public.conciliaciones;
CREATE TRIGGER trg_conciliaciones_updated_at
  BEFORE UPDATE ON public.conciliaciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3i. renglones
DROP TRIGGER IF EXISTS trg_renglones_updated_at ON public.renglones;
CREATE TRIGGER trg_renglones_updated_at
  BEFORE UPDATE ON public.renglones
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- =================================================================
-- PARTE 4: VERIFICAR RLS HABILITADO EN TABLAS CRÍTICAS
-- =================================================================

ALTER TABLE public.subrenglones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglon_materiales  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglon_mano_obra   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglon_equipos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_materiales ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- PARTE 5: CREAR ÍNDICES FALTANTES (SOLO SI NO EXISTEN)
-- =================================================================

-- Índices para subrenglones y sub-tablas
CREATE INDEX IF NOT EXISTS idx_subrenglones_presupuesto_id ON public.subrenglones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_subrenglones_renglon_id ON public.subrenglones(renglon_id);
CREATE INDEX IF NOT EXISTS idx_srm_subrenglon_id ON public.subrenglon_materiales(subrenglon_id);
CREATE INDEX IF NOT EXISTS idx_srm_material_id ON public.subrenglon_materiales(material_id);
CREATE INDEX IF NOT EXISTS idx_smo_subrenglon_id ON public.subrenglon_mano_obra(subrenglon_id);
CREATE INDEX IF NOT EXISTS idx_sre_subrenglon_id ON public.subrenglon_equipos(subrenglon_id);

-- Índices de performance para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON public.transacciones(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_proyecto_id ON public.transacciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_empleado_id ON public.transacciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_user_id ON public.transacciones(user_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON public.transacciones(tipo);

CREATE INDEX IF NOT EXISTS idx_presupuestos_user_id ON public.presupuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_fase ON public.presupuestos(fase);

CREATE INDEX IF NOT EXISTS idx_ordenes_compra_user_id ON public.ordenes_compra(user_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor ON public.ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estatus ON public.ordenes_compra(estatus);
CREATE INDEX IF NOT EXISTS idx_oci_orden_compra_id ON public.orden_compra_items(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_oci_material_id ON public.orden_compra_items(material_id);
CREATE INDEX IF NOT EXISTS idx_recepcion_oc_orden_compra_id ON public.recepcion_oc(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_recepcion_oc_user_id ON public.recepcion_oc(user_id);

CREATE INDEX IF NOT EXISTS idx_renglones_user_id ON public.renglones(user_id);
CREATE INDEX IF NOT EXISTS idx_renglones_codigo ON public.renglones(codigo);
CREATE INDEX IF NOT EXISTS idx_renglones_categoria ON public.renglones(categoria);
CREATE INDEX IF NOT EXISTS idx_renglones_activo ON public.renglones(activo);
CREATE INDEX IF NOT EXISTS idx_renglones_favorito ON public.renglones(favorito);

CREATE INDEX IF NOT EXISTS idx_mat_proy_presupuesto_id ON public.materiales_proyecto(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_mov_mat_material_id ON public.movimientos_materiales(material_id);
CREATE INDEX IF NOT EXISTS idx_cambios_presupuesto_id ON public.cambios_presupuesto(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_checklist_presupuesto_id ON public.checklist_items(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_checklist_fase ON public.checklist_items(fase);
CREATE INDEX IF NOT EXISTS idx_bitacora_presupuesto_id ON public.bitacora_avance(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_actividades_user_id ON public.actividades(user_id);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha ON public.actividades(fecha);
CREATE INDEX IF NOT EXISTS idx_actividades_presupuesto_id ON public.actividades(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_equipos_user_id ON public.equipos(user_id);
CREATE INDEX IF NOT EXISTS idx_equipo_miembros_equipo_id ON public.equipo_miembros(equipo_id);
CREATE INDEX IF NOT EXISTS idx_equipo_miembros_user_id ON public.equipo_miembros(user_id);

CREATE INDEX IF NOT EXISTS idx_conciliaciones_user_id ON public.conciliaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_proyecto_id ON public.conciliaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON public.notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido ON public.notificaciones(leido);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_user_id ON public.proveedores(user_id);

CREATE INDEX IF NOT EXISTS idx_ocr_user ON public.ocr_documentos(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_proyecto_id ON public.ocr_documentos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ocr_status ON public.ocr_documentos(status);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_proyecto_user_id ON public.caja_proyecto(user_id);
CREATE INDEX IF NOT EXISTS idx_caja_proyecto_proyecto_id ON public.caja_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_caja_id ON public.movimientos_caja(caja_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_user_id ON public.movimientos_caja(user_id);

-- =================================================================
-- PARTE 6: VERIFICACIÓN FINAL
-- =================================================================

-- 6a. Verificar RLS activo en todas las tablas
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes','proyectos','presupuestos','transacciones',
    'empleados','audit_log','bitacora_avance',
    'actividades','equipos','equipo_miembros',
    'renglones','renglon_usage','renglon_precios_historial',
    'cambios_presupuesto','materiales_proyecto','movimientos_materiales',
    'conciliaciones','partidas_conciliacion','checklist_items',
    'notificaciones','proveedores','ordenes_compra','orden_compra_items',
    'recepcion_oc','recepcion_oc_items',
    'subrenglones','subrenglon_materiales','subrenglon_mano_obra','subrenglon_equipos',
    'ocr_documentos','device_tokens','caja_proyecto','movimientos_caja','transacciones_recurrentes'
  )
ORDER BY tablename;

-- 6b. Verificar funciones creadas
SELECT proname AS funcion, prosecdef AS security_definer
FROM pg_proc
WHERE proname IN ('fn_set_updated_at','user_owns_equipo','user_owns_presupuesto');

-- 6c. Verificar triggers creados
SELECT trigger_name, event_object_table AS tabla
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trg_%_updated_at'
ORDER BY event_object_table;

-- =================================================================
-- FIN — Revisar que todas las filas muestren ✅ RLS ON
-- =================================================================