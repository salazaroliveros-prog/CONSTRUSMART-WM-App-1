-- =====================================================================
-- MIGRACION: Equipos multi-usuario (Mejora 14)
-- =====================================================================

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS public.equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  creador_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

-- Miembros del equipo
CREATE TABLE IF NOT EXISTS public.equipo_miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id uuid REFERENCES public.equipos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text DEFAULT 'miembro' CHECK (rol IN ('admin', 'miembro', 'visor')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(equipo_id, user_id)
);

-- RLS equipos
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo_miembros ENABLE ROW LEVEL SECURITY;

-- Políticas equipos
CREATE POLICY "equipos_select" ON public.equipos FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR id IN (
    SELECT equipo_id FROM public.equipo_miembros WHERE user_id = auth.uid()
  ));

CREATE POLICY "equipos_insert" ON public.equipos FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "equipos_update" ON public.equipos FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "equipos_delete" ON public.equipos FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Políticas miembros
CREATE POLICY "miembros_select" ON public.equipo_miembros FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    equipo_id IN (
      SELECT id FROM public.equipos WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "miembros_insert" ON public.equipo_miembros FOR INSERT TO authenticated
  WITH CHECK (equipo_id IN (
    SELECT id FROM public.equipos WHERE user_id = auth.uid()
  ));

CREATE POLICY "miembros_delete" ON public.equipo_miembros FOR DELETE TO authenticated
  USING (equipo_id IN (
    SELECT id FROM public.equipos WHERE user_id = auth.uid()
  ));

-- Extender RLS de presupuestos para permitir acceso a miembros del equipo
DROP POLICY IF EXISTS "presupuestos_select_team" ON public.presupuestos;
CREATE POLICY "presupuestos_select_team" ON public.presupuestos
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    user_id IN (
      SELECT user_id FROM public.equipo_miembros WHERE equipo_id IN (
        SELECT equipo_id FROM public.equipo_miembros WHERE user_id = auth.uid()
      )
    )
  );
