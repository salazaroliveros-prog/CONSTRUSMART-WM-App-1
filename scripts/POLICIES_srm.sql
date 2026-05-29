-- =====================================================================
-- Policies for subrenglon_materiales
-- =====================================================================

DROP POLICY IF EXISTS sr_select ON public.subrenglon_materiales;
CREATE POLICY sr_select ON public.subrenglon_materiales FOR SELECT TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS sr_insert ON public.subrenglon_materiales;
CREATE POLICY sr_insert ON public.subrenglon_materiales FOR INSERT TO authenticated WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS sr_update ON public.subrenglon_materiales;
CREATE POLICY sr_update ON public.subrenglon_materiales FOR UPDATE TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS sr_delete ON public.subrenglon_materiales;
CREATE POLICY sr_delete ON public.subrenglon_materiales FOR DELETE TO authenticated USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

SELECT 'OK';