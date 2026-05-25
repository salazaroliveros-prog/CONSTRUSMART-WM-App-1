CREATE TABLE IF NOT EXISTS public.materiales_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  codigo text,
  unidad text DEFAULT 'unidad',
  cantidad_estimada numeric(12,2) DEFAULT 0,
  cantidad_utilizada numeric(12,2) DEFAULT 0,
  costo_unitario numeric(12,2) DEFAULT 0,
  proveedor text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.movimientos_materiales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materiales_proyecto(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'salida', 'devolucion')),
  cantidad numeric(12,2) NOT NULL,
  ubicacion text,
  referencia text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.materiales_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_materiales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mat_select" ON public.materiales_proyecto FOR SELECT TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mat_insert" ON public.materiales_proyecto FOR INSERT TO authenticated
  WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mat_update" ON public.materiales_proyecto FOR UPDATE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mat_delete" ON public.materiales_proyecto FOR DELETE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "mov_select" ON public.movimientos_materiales FOR SELECT TO authenticated
  USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));
CREATE POLICY "mov_insert" ON public.movimientos_materiales FOR INSERT TO authenticated
  WITH CHECK (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));
CREATE POLICY "mov_update" ON public.movimientos_materiales FOR UPDATE TO authenticated
  USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));
CREATE POLICY "mov_delete" ON public.movimientos_materiales FOR DELETE TO authenticated
  USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));
