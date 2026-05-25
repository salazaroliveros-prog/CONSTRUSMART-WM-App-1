-- =====================================================================
-- MIGRACION: CREAR TABLA presupuestos + COLUMNA fase + UNIFICACION
-- =====================================================================

-- 0. Crear tabla presupuestos (si no existe)
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto text NOT NULL,
  cliente text,
  ubicacion text,
  tipologia text,
  fase text DEFAULT 'planeación',
  factor_indirectos numeric DEFAULT 0,
  factor_administrativos numeric DEFAULT 0,
  factor_imprevistos numeric DEFAULT 0,
  factor_utilidad numeric DEFAULT 0,
  lineas jsonb DEFAULT '[]'::jsonb,
  avance_fisico numeric DEFAULT 0,
  avance_financiero numeric DEFAULT 0,
  ingresos numeric DEFAULT 0,
  gastos numeric DEFAULT 0,
  pendiente_aportar numeric DEFAULT 0,
  total numeric DEFAULT 0,
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1. Agregar columna fase a presupuestos (por si ya existe la tabla)
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS fase text DEFAULT 'planeación'::text;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS avance_fisico numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS avance_financiero numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS ingresos numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS gastos numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS pendiente_aportar numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS fecha_inicio date;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS fecha_fin date;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0;

-- 2. Sincronizar presupuestos existentes desde proyectos
UPDATE public.presupuestos p
SET
  avance_fisico = COALESCE((SELECT pr.avance_fisico FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1), 0),
  avance_financiero = COALESCE((SELECT pr.avance_financiero FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1), 0),
  ingresos = COALESCE((SELECT pr.ingresos FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1), 0),
  gastos = COALESCE((SELECT pr.gastos FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1), 0),
  pendiente_aportar = COALESCE((SELECT pr.pendiente_aportar FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1), 0),
  fecha_inicio = (SELECT pr.fecha_inicio FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1),
  fecha_fin = (SELECT pr.fecha_fin FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.proyectos pr WHERE pr.nombre = p.proyecto);

-- 3. Mapear estados de proyectos a fases en presupuestos
UPDATE public.presupuestos
SET fase =
  CASE
    WHEN (SELECT pr.estado FROM public.proyectos pr WHERE pr.nombre = presupuestos.proyecto LIMIT 1) = 'Ejecución' THEN 'ejecución'
    WHEN (SELECT pr.estado FROM public.proyectos pr WHERE pr.nombre = presupuestos.proyecto LIMIT 1) = 'Finalizado' THEN 'finalizado'
    WHEN (SELECT pr.estado FROM public.proyectos pr WHERE pr.nombre = presupuestos.proyecto LIMIT 1) = 'Parado' THEN 'pausa'
    WHEN (SELECT pr.estado FROM public.proyectos pr WHERE pr.nombre = presupuestos.proyecto LIMIT 1) = 'Evaluación' THEN 'ejecución'
    ELSE 'planeación'
  END
WHERE EXISTS (SELECT 1 FROM public.proyectos pr WHERE pr.nombre = presupuestos.proyecto);

-- 4. RLS para presupuestos
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir CRUD de presupuestos propios" ON public.presupuestos;
CREATE POLICY "Permitir CRUD de presupuestos propios" ON public.presupuestos
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- FUNCION: transicionar_fase
-- Mueve un presupuesto entre fases y crea/actualiza el proyecto asociado
-- =====================================================================
CREATE OR REPLACE FUNCTION public.transicionar_fase(
  p_presupuesto_id uuid,
  p_nueva_fase text,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_presupuesto record;
  v_proyecto_id uuid;
  v_estado_proyecto text;
BEGIN
  -- Obtener presupuesto
  SELECT * INTO v_presupuesto FROM public.presupuestos WHERE id = p_presupuesto_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Presupuesto no encontrado');
  END IF;

  -- Actualizar fase en presupuesto
  UPDATE public.presupuestos SET fase = p_nueva_fase, updated_at = now() WHERE id = p_presupuesto_id;

  -- Mapear fase -> estado del proyecto
  v_estado_proyecto := CASE p_nueva_fase
    WHEN 'planeación' THEN 'Planeación'
    WHEN 'ejecución' THEN 'Ejecución'
    WHEN 'pausa' THEN 'Parado'
    WHEN 'finalizado' THEN 'Finalizado'
    ELSE 'Planeación'
  END;

  -- Upsert en proyectos
  INSERT INTO public.proyectos (user_id, nombre, cliente, tipo, estado, presupuesto_total, avance_fisico, avance_financiero, ingresos, gastos, pendiente_aportar, fecha_inicio, fecha_fin)
  VALUES (
    p_user_id,
    v_presupuesto.proyecto,
    v_presupuesto.cliente,
    v_presupuesto.tipologia,
    v_estado_proyecto,
    COALESCE(v_presupuesto.total, 0),
    COALESCE(v_presupuesto.avance_fisico, 0),
    COALESCE(v_presupuesto.avance_financiero, 0),
    COALESCE(v_presupuesto.ingresos, 0),
    COALESCE(v_presupuesto.gastos, 0),
    COALESCE(v_presupuesto.pendiente_aportar, COALESCE(v_presupuesto.total, 0)),
    CASE WHEN p_nueva_fase = 'ejecución' THEN CURRENT_DATE ELSE v_presupuesto.fecha_inicio END,
    CASE WHEN p_nueva_fase = 'finalizado' THEN CURRENT_DATE ELSE v_presupuesto.fecha_fin END
  )
  ON CONFLICT ON CONSTRAINT proyectos_nombre_user_key DO UPDATE SET
    estado = v_estado_proyecto,
    presupuesto_total = COALESCE(v_presupuesto.total, 0),
    fecha_fin = CASE WHEN p_nueva_fase = 'finalizado' THEN CURRENT_DATE ELSE EXCLUDED.fecha_fin END,
    fecha_inicio = CASE WHEN p_nueva_fase = 'ejecución' AND EXCLUDED.fecha_inicio IS NULL THEN CURRENT_DATE ELSE EXCLUDED.fecha_inicio END
  RETURNING id INTO v_proyecto_id;

  RETURN jsonb_build_object('success', true, 'presupuesto_id', p_presupuesto_id, 'proyecto_id', v_proyecto_id, 'fase', p_nueva_fase);
END;
$$;

-- Indice unico para upsert en proyectos (si no existe)
CREATE UNIQUE INDEX IF NOT EXISTS proyectos_nombre_user_idx ON public.proyectos (nombre, user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'proyectos_nombre_user_key'
  ) THEN
    ALTER TABLE public.proyectos ADD CONSTRAINT proyectos_nombre_user_key UNIQUE (nombre, user_id);
  END IF;
END;
$$;
