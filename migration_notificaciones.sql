CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('info', 'alerta', 'exito', 'warning')),
  titulo text NOT NULL,
  mensaje text,
  leido boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select" ON public.notificaciones FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notif_insert" ON public.notificaciones FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_update" ON public.notificaciones FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notif_delete" ON public.notificaciones FOR DELETE TO authenticated
  USING (user_id = auth.uid());
