-- ============================================================================
-- FIX: Políticas RLS para materiales_proyecto y movimientos_materiales
-- ============================================================================
-- Este script corrige y asegura que las políticas RLS permitan
-- visualizar los materiales registrados en el módulo de Bodega.
-- ============================================================================

-- 1. CORREGIR POLÍTICAS DE materiales_proyecto
DROP POLICY IF EXISTS "mat_select" ON public.materiales_proyecto;
DROP POLICY IF EXISTS "mat_insert" ON public.materiales_proyecto;
DROP POLICY IF EXISTS "mat_update" ON public.materiales_proyecto;
DROP POLICY IF EXISTS "mat_delete" ON public.materiales_proyecto;

-- Asegurar que RLS esté habilitado
ALTER TABLE public.materiales_proyecto ENABLE ROW LEVEL SECURITY;

-- Política SELECT: permite ver materiales de presupuestos del usuario
CREATE POLICY "mat_select" ON public.materiales_proyecto
  FOR SELECT TO authenticated
  USING (
    presupuesto_id IN (
      SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
    )
  );

-- Política INSERT: permite crear materiales en presupuestos del usuario
CREATE POLICY "mat_insert" ON public.materiales_proyecto
  FOR INSERT TO authenticated
  WITH CHECK (
    presupuesto_id IN (
      SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
    )
  );

-- Política UPDATE: permite actualizar materiales de presupuestos del usuario
CREATE POLICY "mat_update" ON public.materiales_proyecto
  FOR UPDATE TO authenticated
  USING (
    presupuesto_id IN (
      SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
    )
  );

-- Política DELETE: permite eliminar materiales de presupuestos del usuario
CREATE POLICY "mat_delete" ON public.materiales_proyecto
  FOR DELETE TO authenticated
  USING (
    presupuesto_id IN (
      SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
    )
  );


-- 2. CORREGIR POLÍTICAS DE movimientos_materiales
DROP POLICY IF EXISTS "mov_select" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_insert" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_update" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_delete" ON public.movimientos_materiales;

ALTER TABLE public.movimientos_materiales ENABLE ROW LEVEL SECURITY;

-- Política SELECT: el usuario puede ver movimientos de materiales que pertenecen
-- a presupuestos del usuario
CREATE POLICY "mov_select" ON public.movimientos_materiales
  FOR SELECT TO authenticated
  USING (
    material_id IN (
      SELECT id FROM public.materiales_proyecto 
      WHERE presupuesto_id IN (
        SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
      )
    )
  );

-- Política INSERT: el usuario puede insertar movimientos para materiales propios
CREATE POLICY "mov_insert" ON public.movimientos_materiales
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() OR user_id IS NULL)
    AND
    material_id IN (
      SELECT id FROM public.materiales_proyecto 
      WHERE presupuesto_id IN (
        SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
      )
    )
  );

-- Política UPDATE
CREATE POLICY "mov_update" ON public.movimientos_materiales
  FOR UPDATE TO authenticated
  USING (
    material_id IN (
      SELECT id FROM public.materiales_proyecto 
      WHERE presupuesto_id IN (
        SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
      )
    )
  );

-- Política DELETE
CREATE POLICY "mov_delete" ON public.movimientos_materiales
  FOR DELETE TO authenticated
  USING (
    material_id IN (
      SELECT id FROM public.materiales_proyecto 
      WHERE presupuesto_id IN (
        SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
      )
    )
  );


-- 3. ASEGURAR QUE LA TABLA materiales_proyecto TENGA user_id (OPCIONAL MEJORA)
-- Nota: La tabla actual NO tiene user_id, depende enteramente de presupuesto_id
-- Si se desea agregar user_id como respaldo, descomentar:
-- ALTER TABLE public.materiales_proyecto 
--   ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 4. ACTUALIZAR movimiento para establecer user_id automático
-- Asegurar que todo movimiento insertado tenga user_id del usuario actual
CREATE OR REPLACE FUNCTION public.fn_movimiento_set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movimiento_set_user_id ON public.movimientos_materiales;
CREATE TRIGGER trg_movimiento_set_user_id
  BEFORE INSERT ON public.movimientos_materiales
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_movimiento_set_user_id();