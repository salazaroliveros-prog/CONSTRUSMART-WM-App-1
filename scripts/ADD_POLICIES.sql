-- =====================================================================
-- CLEANUP_POLICIES.sql
-- Solo elimina y crea políticas RLS existentes (NO elimina datos)
-- =====================================================================

DROP POLICY IF EXISTS "sr_select" ON public.subrenglones;
DROP POLICY IF EXISTS "sr_insert" ON public.subrenglones;
DROP POLICY IF EXISTS "sr_update" ON public.subrenglones;
DROP POLICY IF EXISTS "sr_delete" ON public.subrenglones;

DROP POLICY IF EXISTS "srm_select" ON public.subrenglon_materiales;
DROP POLICY IF EXISTS "srm_insert" ON public.subrenglon_materiales;
DROP POLICY IF EXISTS "srm_update" ON public.subrenglon_materiales;
DROP POLICY IF EXISTS "srm_delete" ON public.subrenglon_materiales;

DROP POLICY IF EXISTS "smo_select" ON public.subrenglon_mano_obra;
DROP POLICY IF EXISTS "smo_insert" ON public.subrenglon_mano_obra;
DROP POLICY IF EXISTS "smo_update" ON public.subrenglon_mano_obra;
DROP POLICY IF EXISTS "smo_delete" ON public.subrenglon_mano_obra;

DROP POLICY IF EXISTS "sre_select" ON public.subrenglon_equipos;
DROP POLICY IF EXISTS "sre_insert" ON public.subrenglon_equipos;
DROP POLICY IF EXISTS "sre_update" ON public.subrenglon_equipos;
DROP POLICY IF EXISTS "sre_delete" ON public.subrenglon_equipos;

DROP POLICY IF EXISTS "mov_select" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_insert" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_update" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_delete" ON public.movimientos_materiales;

SELECT 'Políticas eliminadas';

CREATE POLICY "sr_select" ON public.subrenglones FOR SELECT TO authenticated USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sr_insert" ON public.subrenglones FOR INSERT TO authenticated WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sr_update" ON public.subrenglones FOR UPDATE TO authenticated USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sr_delete" ON public.subrenglones FOR DELETE TO authenticated USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "srm_select" ON public.subrenglon_materiales FOR SELECT TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "srm_insert" ON public.subrenglon_materiales FOR INSERT TO authenticated WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "srm_update" ON public.subrenglon_materiales FOR UPDATE TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "srm_delete" ON public.subrenglon_materiales FOR DELETE TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "smo_select" ON public.subrenglon_mano_obra FOR SELECT TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "smo_insert" ON public.subrenglon_mano_obra FOR INSERT TO authenticated WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "smo_update" ON public.subrenglon_mano_obra FOR UPDATE TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "smo_delete" ON public.subrenglon_mano_obra FOR DELETE TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "sre_select" ON public.subrenglon_equipos FOR SELECT TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sre_insert" ON public.subrenglon_equipos FOR INSERT TO authenticated WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sre_update" ON public.subrenglon_equipos FOR UPDATE TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sre_delete" ON public.subrenglon_equipos FOR DELETE TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "mov_select" ON public.movimientos_materiales FOR SELECT TO authenticated USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mov_insert" ON public.movimientos_materiales FOR INSERT TO authenticated WITH CHECK (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mov_update" ON public.movimientos_materiales FOR UPDATE TO authenticated USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mov_delete" ON public.movimientos_materiales FOR DELETE TO authenticated USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

SELECT 'Políticas creadas exitosamente';