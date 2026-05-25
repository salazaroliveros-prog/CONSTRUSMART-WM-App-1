CREATE TABLE IF NOT EXISTS public.bitacora_avance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
    user_id uuid DEFAULT auth.uid(),
    fecha date DEFAULT now(),
    avance_fisico numeric NOT NULL CHECK (avance_fisico >= 0 AND avance_fisico <= 100),
    descripcion text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bitacora_avance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso propietario bitacora" ON public.bitacora_avance;
CREATE POLICY "Acceso propietario bitacora" ON public.bitacora_avance 
FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bitacora_presupuesto ON public.bitacora_avance(presupuesto_id);
