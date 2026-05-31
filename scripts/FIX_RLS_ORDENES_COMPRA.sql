-- =====================================================================
-- FIX_RLS_ORDENES_COMPRA.sql
-- Corrige RLS policies para ordenes_compra y tablas relacionadas
-- Causa del error 403: Policies existentes en SQL pero NO aplicadas en Supabase
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 30/05/2026
-- =====================================================================

-- 1. Asegurar que RLS está habilitado
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recepcion_oc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recepcion_oc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales_proyecto ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar policies existentes para recrearlas
DROP POLICY IF EXISTS "oc_owner" ON public.ordenes_compra;
DROP POLICY IF EXISTS "oc_select" ON public.ordenes_compra;
DROP POLICY IF EXISTS "oc_insert" ON public.ordenes_compra;
DROP POLICY IF EXISTS "oc_update" ON public.ordenes_compra;
DROP POLICY IF EXISTS "oc_delete" ON public.ordenes_compra;

DROP POLICY IF EXISTS "oci_owner" ON public.orden_compra_items;
DROP POLICY IF EXISTS "rec_owner" ON public.recepcion_oc;
DROP POLICY IF EXISTS "reci_owner" ON public.recepcion_oc_items;

-- 3. Crear policies individuales (más robustas que FOR ALL)

-- ordenes_compra
CREATE POLICY "oc_select" ON public.ordenes_compra
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "oc_insert" ON public.ordenes_compra
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oc_update" ON public.ordenes_compra
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oc_delete" ON public.ordenes_compra
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- orden_compra_items
CREATE POLICY "oci_select" ON public.orden_compra_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_compra_id AND oc.user_id = auth.uid()));

CREATE POLICY "oci_insert" ON public.orden_compra_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_compra_id AND oc.user_id = auth.uid()));

CREATE POLICY "oci_update" ON public.orden_compra_items
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_compra_id AND oc.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_compra_id AND oc.user_id = auth.uid()));

CREATE POLICY "oci_delete" ON public.orden_compra_items
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_compra_id AND oc.user_id = auth.uid()));

-- recepcion_oc
CREATE POLICY "rec_select" ON public.recepcion_oc
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "rec_insert" ON public.recepcion_oc
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rec_update" ON public.recepcion_oc
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rec_delete" ON public.recepcion_oc
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- recepcion_oc_items
CREATE POLICY "reci_select" ON public.recepcion_oc_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recepcion_oc r WHERE r.id = recepcion_id AND r.user_id = auth.uid()));

CREATE POLICY "reci_insert" ON public.recepcion_oc_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.recepcion_oc r WHERE r.id = recepcion_id AND r.user_id = auth.uid()));

-- movimientos_materiales (usado por BodegaService)
DROP POLICY IF EXISTS "mov_owner" ON public.movimientos_materiales;
CREATE POLICY "mov_select" ON public.movimientos_materiales
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.materiales_proyecto mp WHERE mp.id = material_id AND mp.presupuesto_id IN (SELECT p.id FROM public.presupuestos p WHERE p.user_id = auth.uid())));

CREATE POLICY "mov_insert" ON public.movimientos_materiales
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.materiales_proyecto mp WHERE mp.id = material_id AND mp.presupuesto_id IN (SELECT p.id FROM public.presupuestos p WHERE p.user_id = auth.uid())));

-- materiales_proyecto (usado por BodegaService)
DROP POLICY IF EXISTS "mp_owner" ON public.materiales_proyecto;
CREATE POLICY "mp_select" ON public.materiales_proyecto
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.presupuestos p WHERE p.id = presupuesto_id AND p.user_id = auth.uid()));

CREATE POLICY "mp_insert" ON public.materiales_proyecto
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.presupuestos p WHERE p.id = presupuesto_id AND p.user_id = auth.uid()));

CREATE POLICY "mp_update" ON public.materiales_proyecto
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.presupuestos p WHERE p.id = presupuesto_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.presupuestos p WHERE p.id = presupuesto_id AND p.user_id = auth.uid()));

-- 4. Verificar policies aplicadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('ordenes_compra', 'orden_compra_items', 'recepcion_oc', 'recepcion_oc_items', 'movimientos_materiales', 'materiales_proyecto')
ORDER BY tablename, policyname;