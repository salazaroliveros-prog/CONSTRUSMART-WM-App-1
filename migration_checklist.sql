-- Checklist de Calidad por Fase (M10)
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  fase text NOT NULL CHECK (fase IN ('planeación', 'ejecución', 'pausa', 'finalizado')),
  item text NOT NULL,
  completado boolean DEFAULT false,
  foto_url text,
  completado_por uuid REFERENCES auth.users(id),
  completado_en timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_select" ON public.checklist_items FOR SELECT TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "checklist_insert" ON public.checklist_items FOR INSERT TO authenticated
  WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "checklist_update" ON public.checklist_items FOR UPDATE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "checklist_delete" ON public.checklist_items FOR DELETE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
