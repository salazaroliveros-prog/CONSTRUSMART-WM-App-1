-- =====================================================================
-- Fix subrenglon_mano_obra policies - VERIFIED SYNTAX
-- =====================================================================

DROP POLICY IF EXISTS "smo_select" ON public.subrenglon_mano_obra;
DROP POLICY IF EXISTS "smo_insert" ON public.subrenglon_mano_obra;
DROP POLICY IF EXISTS "smo_update" ON public.subrenglon_mano_obra;
DROP POLICY IF EXISTS "smo_delete" ON public.subrenglon_mano_obra;

CREATE POLICY "smo_select" ON public.subrenglon_mano_obra FOR SELECT USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "smo_insert" ON public.subrenglon_mano_obra FOR INSERT WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "smo_update" ON public.subrenglon_mano_obra FOR UPDATE USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "smo_delete" ON public.subrenglon_mano_obra FOR DELETE USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

SELECT 'subrenglon_mano_obra policies created';