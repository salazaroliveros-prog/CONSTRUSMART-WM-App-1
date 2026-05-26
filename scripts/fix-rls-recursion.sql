-- Fix RLS infinite recursion between equipos and equipo_miembros
-- The problem: equipos SELECT policy queries equipo_miembros, whose SELECT
-- policy queries equipos back, creating infinite recursion.
-- Execute this ONCE in Supabase SQL Editor.

-- STEP 1: Create a SECURITY DEFINER function that bypasses RLS
-- This breaks the circular reference because the subquery inside the
-- function runs as the table owner (bypassing RLS).

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

-- STEP 2: Drop equipos_select policy that queries equipo_miembros

DROP POLICY IF EXISTS "equipos_select" ON public.equipos;

-- STEP 3: Re-create equipos_select with simple owner-only check
-- Team members access equipos via the equipo_miembros table instead.

CREATE POLICY "equipos_select" ON public.equipos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- STEP 4: Drop existing policies on equipo_miembros that cause recursion

DROP POLICY IF EXISTS "equipo_miembros_select" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_insert" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_update" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_delete" ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_select" ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_insert" ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_delete" ON public.equipo_miembros;

-- STEP 5: Re-create equipo_miembros policies using the SECURITY DEFINER function
-- This avoids the circular reference because the function bypasses RLS.

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
