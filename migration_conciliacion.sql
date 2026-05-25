CREATE TABLE IF NOT EXISTS public.conciliaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  banco text NOT NULL,
  periodo date NOT NULL,
  saldo_libros numeric(12,2) DEFAULT 0,
  saldo_banco numeric(12,2) DEFAULT 0,
  diferencia numeric(12,2) GENERATED ALWAYS AS (saldo_banco - saldo_libros) STORED,
  conciliado boolean DEFAULT false,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partidas_conciliacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conciliacion_id uuid REFERENCES public.conciliaciones(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('pendiente_libros', 'pendiente_banco', 'ajuste')),
  monto numeric(12,2) NOT NULL,
  descripcion text,
  fecha date,
  aplicado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.conciliaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas_conciliacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conc_select" ON public.conciliaciones FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "conc_insert" ON public.conciliaciones FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "conc_update" ON public.conciliaciones FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "conc_delete" ON public.conciliaciones FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "part_select" ON public.partidas_conciliacion FOR SELECT TO authenticated
  USING (conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid()));
CREATE POLICY "part_insert" ON public.partidas_conciliacion FOR INSERT TO authenticated
  WITH CHECK (conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid()));
CREATE POLICY "part_update" ON public.partidas_conciliacion FOR UPDATE TO authenticated
  USING (conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid()));
CREATE POLICY "part_delete" ON public.partidas_conciliacion FOR DELETE TO authenticated
  USING (conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid()));
