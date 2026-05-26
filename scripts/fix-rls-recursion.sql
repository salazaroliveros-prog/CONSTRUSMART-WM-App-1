-- Fix RLS infinite recursion (42P17) — VERSIÓN COMPLETA
-- Elimina TODAS las políticas que causan recursión circular entre
-- equipos, equipo_miembros y presupuestos.
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor.

-- ============================================================
-- PASO 1: Función SECURITY DEFINER que rompe el ciclo
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_owns_equipo(p_equipo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public, auth'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipos
    WHERE id = p_equipo_id AND user_id = auth.uid()
  );
$$;

-- ============================================================
-- PASO 2: Eliminar TODAS las políticas de equipos
-- (incluye nombres de TODOS los scripts que se hayan ejecutado)
-- ============================================================

DROP POLICY IF EXISTS "equipos_select" ON public.equipos;
DROP POLICY IF EXISTS "equipos_insert" ON public.equipos;
DROP POLICY IF EXISTS "equipos_update" ON public.equipos;
DROP POLICY IF EXISTS "equipos_delete" ON public.equipos;
DROP POLICY IF EXISTS "Acceso propietario equipos" ON public.equipos;

-- Re-crear equipos_select con solo owner (SIN subconsulta a equipo_miembros)
CREATE POLICY "equipos_select" ON public.equipos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "equipos_insert" ON public.equipos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "equipos_update" ON public.equipos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "equipos_delete" ON public.equipos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- PASO 3: Eliminar TODAS las políticas de equipo_miembros
-- ============================================================

DROP POLICY IF EXISTS "equipo_miembros_select" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_insert" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_update" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_delete" ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_select" ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_insert" ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_delete" ON public.equipo_miembros;
DROP POLICY IF EXISTS "Acceso propietario equipo_miembros" ON public.equipo_miembros;
DROP POLICY IF EXISTS "Acceso a equipos como miembro" ON public.equipo_miembros;

-- Re-crear usando función SECURITY DEFINER (NO consulta equipos directamente)
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

-- ============================================================
-- PASO 4: Eliminar política que extiende recursión a presupuestos
-- ============================================================

DROP POLICY IF EXISTS "presupuestos_select_team" ON public.presupuestos;

-- ============================================================
-- PASO 5: Verificación — mostrar políticas resultantes
-- ============================================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('equipos', 'equipo_miembros', 'presupuestos')
ORDER BY tablename, policyname;
