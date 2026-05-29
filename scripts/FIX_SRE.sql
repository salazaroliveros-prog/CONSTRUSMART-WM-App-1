-- =====================================================================
-- Fix subrenglon_equipos policies - VERIFIED SYNTAX
-- =====================================================================

DROP POLICY IF EXISTS "sre_select" ON public.subrenglon_equipos;
DROP POLICY IF EXISTS "sre_insert" ON public.subrenglon_equipos;
DROP POLICY IF EXISTS "sre_update" ON public.subrenglon_equipos;
DROP POLICY IF EXISTS "sre_delete" ON public.subrenglon_equipos;

CREATE POLICY "sre_select" ON public.subrenglon_equipos FOR SELECT USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sre_insert" ON public.subrenglon_equipos FOR INSERT WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sre_update" ON public.subrenglon_equipos FOR UPDATE USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sre_delete" ON public.subrenglon_equipos FOR DELETE USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

SELECT 'subrenglon_equipos policies created';