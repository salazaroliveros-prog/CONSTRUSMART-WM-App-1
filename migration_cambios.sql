-- Control de Cambios (M6)
CREATE TABLE IF NOT EXISTS public.cambios_presupuesto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  cambios jsonb NOT NULL DEFAULT '[]',
  motivo text NOT NULL DEFAULT '',
  aprobado_por uuid REFERENCES auth.users(id),
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cambios_presupuesto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cambios_select" ON public.cambios_presupuesto FOR SELECT TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "cambios_insert" ON public.cambios_presupuesto FOR INSERT TO authenticated
  WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "cambios_update" ON public.cambios_presupuesto FOR UPDATE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
