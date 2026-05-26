-- Fix RLS infinite recursion (42P17)
-- Problema: políticas SELECT en equipos ↔ equipo_miembros se referencian
-- circularmente. Además, presupuestos_select_team consulta equipo_miembros
-- y extiende el problema a presupuestos.
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor.

-- ============================================================
-- PASO 1: Función SECURITY DEFINER que rompe el ciclo
-- (corre como propietario, bypassea RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_owns_equipo(p_equipo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipos
    WHERE id = p_equipo_id AND user_id = auth.uid()
  );
$$;

-- ============================================================
-- PASO 2: Eliminar política problemática en presupuestos
-- presupuestos_select_team consulta equipo_miembros → cascada
-- ============================================================

DROP POLICY IF EXISTS "presupuestos_select_team" ON public.presupuestos;

-- ============================================================
-- PASO 3: equipos — simplificar a solo owner
-- ============================================================

DROP POLICY IF EXISTS "equipos_select" ON public.equipos;

CREATE POLICY "equipos_select" ON public.equipos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- PASO 4: equipo_miembros — recrear usando función
-- ============================================================

DROP POLICY IF EXISTS "equipo_miembros_select" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_insert" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_update" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_delete" ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_select" ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_insert" ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_delete" ON public.equipo_miembros;

CREATE POLICY "equipo_miembros_select" ON public.equipo_miembros
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    public.user_owns_equipo(equipo_id)
  );

CREATE POLICY "equipo_miembros_insert" ON public.equipo_miembros
  FOR INSERT WITH CHECK (
    public.user_owns_equipo(equipo_id)
  );

CREATE POLICY "equipo_miembros_update" ON public.equipo_miembros
  FOR UPDATE USING (
    public.user_owns_equipo(equipo_id)
  );

CREATE POLICY "equipo_miembros_delete" ON public.equipo_miembros
  FOR DELETE USING (
    public.user_owns_equipo(equipo_id)
  );
