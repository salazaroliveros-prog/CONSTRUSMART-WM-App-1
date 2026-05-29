-- =====================================================================
-- Fix movimientos_materiales policies - VERIFIED SYNTAX
-- =====================================================================

DROP POLICY IF EXISTS "mov_select" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_insert" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_update" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_delete" ON public.movimientos_materiales;

CREATE POLICY "mov_select" ON public.movimientos_materiales FOR SELECT USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mov_insert" ON public.movimientos_materiales FOR INSERT WITH CHECK (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mov_update" ON public.movimientos_materiales FOR UPDATE USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mov_delete" ON public.movimientos_materiales FOR DELETE USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

SELECT 'movimientos_materiales policies created';