-- =====================================================================
-- ADD_COLUMNS_PROYECTOS.sql
-- Agrega columnas faltantes a la tabla proyectos
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 30/05/2026
-- =====================================================================

-- 1. Agregar columna 'fase' a proyectos (sincroniza con presupuestos.fase)
ALTER TABLE public.proyectos 
ADD COLUMN IF NOT EXISTS fase text DEFAULT 'planeación';

-- 2. Agregar columna 'total' a proyectos (alias de presupuesto_total)
ALTER TABLE public.proyectos 
ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0;

-- 3. Agregar columna 'updated_at' a proyectos
ALTER TABLE public.proyectos 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. Trigger para updated_at automático en proyectos
DROP TRIGGER IF EXISTS trg_proyectos_updated_at ON public.proyectos;
CREATE TRIGGER trg_proyectos_updated_at
  BEFORE UPDATE ON public.proyectos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 5. Sync total = presupuesto_total para registros existentes
UPDATE public.proyectos SET total = presupuesto_total WHERE total = 0 AND presupuesto_total > 0;

-- 6. Sync fase = estado para registros existentes (mapeo de estados a fases)
UPDATE public.proyectos SET fase = 'planeación' WHERE estado = 'Planeación' AND (fase IS NULL OR fase = '');
UPDATE public.proyectos SET fase = 'ejecución' WHERE estado = 'Ejecución' AND (fase IS NULL OR fase = '');
UPDATE public.proyectos SET fase = 'pausa' WHERE estado = 'Parado' AND (fase IS NULL OR fase = '');
UPDATE public.proyectos SET fase = 'finalizado' WHERE estado = 'Finalizado' AND (fase IS NULL OR fase = '');

-- =====================================================================
-- POLICIES RLS para la tabla proyectos
-- =====================================================================

-- Eliminar policies existentes si las hay
DROP POLICY IF EXISTS "Users can view own proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Users can insert own proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Users can update own proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Users can delete own proyectos" ON public.proyectos;

-- Policy: SELECT - Los usuarios solo ven sus propios proyectos
CREATE POLICY "Users can view own proyectos"
  ON public.proyectos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: INSERT - Los usuarios solo crean proyectos propios
CREATE POLICY "Users can insert own proyectos"
  ON public.proyectos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: UPDATE - Los usuarios solo actualizan sus propios proyectos
CREATE POLICY "Users can update own proyectos"
  ON public.proyectos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: DELETE - Los usuarios solo eliminan sus propios proyectos
CREATE POLICY "Users can delete own proyectos"
  ON public.proyectos
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Habilitar RLS si no está habilitado
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;