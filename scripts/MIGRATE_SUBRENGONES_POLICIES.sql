-- =====================================================================
-- MIGRATE_SUBRENGONES_POLICIES.sql
-- Políticas RLS para subrenglones
-- =====================================================================

DROP POLICY IF EXISTS "sr_select" ON public.subrenglones;
DROP POLICY IF EXISTS "sr_insert" ON public.subrenglones;
DROP POLICY IF EXISTS "sr_update" ON public.subrenglones;
DROP POLICY IF EXISTS "sr_delete" ON public.subrenglones;

CREATE POLICY "sr_select" ON public.subrenglones FOR SELECT TO authenticated USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sr_insert" ON public.subrenglones FOR INSERT TO authenticated WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sr_update" ON public.subrenglones FOR UPDATE TO authenticated USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sr_delete" ON public.subrenglones FOR DELETE TO authenticated USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

SELECT 'subrenglones policies created' as status;