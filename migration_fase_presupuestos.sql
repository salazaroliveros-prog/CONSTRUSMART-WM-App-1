-- =====================================================================
-- MIGRACION COMPLETA V2: RLS + proyecto_id + auto-financiero + audit
-- =====================================================================

-- ============================================================
-- PARTE 0: CREAR TABLA presupuestos (si no existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto text NOT NULL,
  cliente text,
  ubicacion text,
  tipologia text,
  fase text DEFAULT 'planeación',
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
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

ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS fase text DEFAULT 'planeación'::text;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS avance_fisico numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS avance_financiero numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS ingresos numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS gastos numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS pendiente_aportar numeric DEFAULT 0;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS fecha_inicio date;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS fecha_fin date;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0;

-- ============================================================
-- PARTE 1: Insertar presupuestos desde proyectos legacy
-- ============================================================
INSERT INTO public.presupuestos (user_id, proyecto, cliente, tipologia, fase, proyecto_id, total, avance_fisico, avance_financiero, ingresos, gastos, pendiente_aportar, fecha_inicio, fecha_fin)
SELECT
  p.user_id, p.nombre, p.cliente, p.tipo,
  CASE p.estado
    WHEN 'Ejecución' THEN 'ejecución' WHEN 'Finalizado' THEN 'finalizado'
    WHEN 'Parado' THEN 'pausa' WHEN 'Evaluación' THEN 'ejecución' ELSE 'planeación'
  END,
  p.id, p.presupuesto_total, p.avance_fisico, p.avance_financiero,
  p.ingresos, p.gastos, p.pendiente_aportar, p.fecha_inicio, p.fecha_fin
FROM public.proyectos p
LEFT JOIN public.presupuestos pr ON pr.proyecto = p.nombre AND pr.user_id = p.user_id
WHERE pr.id IS NULL;

UPDATE public.presupuestos p SET
  avance_fisico = COALESCE((SELECT pr.avance_fisico FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1), 0),
  avance_financiero = COALESCE((SELECT pr.avance_financiero FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1), 0),
  ingresos = COALESCE((SELECT pr.ingresos FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1), 0),
  gastos = COALESCE((SELECT pr.gastos FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1), 0),
  pendiente_aportar = COALESCE((SELECT pr.pendiente_aportar FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1), 0),
  fecha_inicio = (SELECT pr.fecha_inicio FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1),
  fecha_fin = (SELECT pr.fecha_fin FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1),
  fase = COALESCE(
    (SELECT CASE pr.estado WHEN 'Ejecución' THEN 'ejecución' WHEN 'Finalizado' THEN 'finalizado' WHEN 'Parado' THEN 'pausa' WHEN 'Evaluación' THEN 'ejecución' ELSE 'planeación' END FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1),
    'planeación'
  ),
  proyecto_id = (SELECT pr.id FROM public.proyectos pr WHERE pr.nombre = p.proyecto LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.proyectos pr WHERE pr.nombre = p.proyecto);

CREATE UNIQUE INDEX IF NOT EXISTS proyectos_nombre_user_idx ON public.proyectos (nombre, user_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proyectos_nombre_user_key') THEN
    ALTER TABLE public.proyectos ADD CONSTRAINT proyectos_nombre_user_key UNIQUE (nombre, user_id);
  END IF;
END $$;

-- ============================================================
-- PARTE 2: RLS policies completas (Mejora 6)
-- ============================================================
-- CLIENTES
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;
CREATE POLICY "clientes_select" ON public.clientes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clientes_insert" ON public.clientes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clientes_update" ON public.clientes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clientes_delete" ON public.clientes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PROYECTOS
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proyectos_select" ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_insert" ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_update" ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_delete" ON public.proyectos;
CREATE POLICY "proyectos_select" ON public.proyectos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "proyectos_insert" ON public.proyectos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proyectos_update" ON public.proyectos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proyectos_delete" ON public.proyectos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PRESUPUESTOS (reemplaza policy anterior)
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir CRUD de presupuestos propios" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_select" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_insert" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_update" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_delete" ON public.presupuestos;
CREATE POLICY "presupuestos_select" ON public.presupuestos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "presupuestos_insert" ON public.presupuestos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "presupuestos_update" ON public.presupuestos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "presupuestos_delete" ON public.presupuestos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- TRANSACCIONES
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transacciones_select" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_insert" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_update" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_delete" ON public.transacciones;
CREATE POLICY "transacciones_select" ON public.transacciones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transacciones_insert" ON public.transacciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transacciones_update" ON public.transacciones FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transacciones_delete" ON public.transacciones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ACTIVIDADES
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "actividades_select" ON public.actividades;
DROP POLICY IF EXISTS "actividades_insert" ON public.actividades;
DROP POLICY IF EXISTS "actividades_update" ON public.actividades;
DROP POLICY IF EXISTS "actividades_delete" ON public.actividades;
CREATE POLICY "actividades_select" ON public.actividades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "actividades_insert" ON public.actividades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "actividades_update" ON public.actividades FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "actividades_delete" ON public.actividades FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- PARTE 3: RPC transicionar_fase con proyecto_id reutilizable (Mejora 2)
-- ============================================================
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
  SELECT * INTO v_presupuesto FROM public.presupuestos WHERE id = p_presupuesto_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Presupuesto no encontrado');
  END IF;

  v_proyecto_id := v_presupuesto.proyecto_id;
  v_estado_proyecto := CASE p_nueva_fase
    WHEN 'planeación' THEN 'Planeación' WHEN 'ejecución' THEN 'Ejecución'
    WHEN 'pausa' THEN 'Parado' WHEN 'finalizado' THEN 'Finalizado' ELSE 'Planeación'
  END;

  UPDATE public.presupuestos SET fase = p_nueva_fase, updated_at = now() WHERE id = p_presupuesto_id;

  IF v_proyecto_id IS NOT NULL THEN
    UPDATE public.proyectos SET
      estado = v_estado_proyecto,
      presupuesto_total = COALESCE(v_presupuesto.total, 0),
      fecha_inicio = CASE WHEN p_nueva_fase = 'ejecución' AND fecha_inicio IS NULL THEN CURRENT_DATE ELSE fecha_inicio END,
      fecha_fin = CASE WHEN p_nueva_fase = 'finalizado' THEN CURRENT_DATE ELSE fecha_fin END
    WHERE id = v_proyecto_id;
  ELSE
    INSERT INTO public.proyectos (user_id, nombre, cliente, tipo, estado, presupuesto_total)
    VALUES (p_user_id, v_presupuesto.proyecto, v_presupuesto.cliente, v_presupuesto.tipologia, v_estado_proyecto, COALESCE(v_presupuesto.total, 0))
    ON CONFLICT ON CONSTRAINT proyectos_nombre_user_key DO UPDATE SET
      estado = v_estado_proyecto,
      presupuesto_total = COALESCE(v_presupuesto.total, 0),
      fecha_fin = CASE WHEN p_nueva_fase = 'finalizado' THEN CURRENT_DATE ELSE EXCLUDED.fecha_fin END,
      fecha_inicio = CASE WHEN p_nueva_fase = 'ejecución' AND EXCLUDED.fecha_inicio IS NULL THEN CURRENT_DATE ELSE EXCLUDED.fecha_inicio END
    RETURNING id INTO v_proyecto_id;

    UPDATE public.presupuestos SET proyecto_id = v_proyecto_id WHERE id = p_presupuesto_id;
  END IF;

  -- Crear actividad automática al cambiar de fase (Mejora 7)
  INSERT INTO public.actividades (user_id, titulo, fecha, descripcion, presupuesto_id)
  VALUES (
    p_user_id,
    'Fase: ' || p_nueva_fase || ' - ' || v_presupuesto.proyecto,
    CURRENT_DATE,
    'El proyecto cambió a fase ' || p_nueva_fase,
    p_presupuesto_id
  );

  RETURN jsonb_build_object('success', true, 'presupuesto_id', p_presupuesto_id, 'proyecto_id', v_proyecto_id, 'fase', p_nueva_fase);
END;
$$;

-- ============================================================
-- PARTE 4: Auto-actualizar financiero desde transacciones (Mejora 3)
-- ============================================================
CREATE OR REPLACE FUNCTION public.actualizar_financiero_presupuesto(p_presupuesto_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_proyecto_id uuid;
  v_total numeric;
BEGIN
  SELECT proyecto_id, total INTO v_proyecto_id, v_total FROM public.presupuestos WHERE id = p_presupuesto_id;

  UPDATE public.presupuestos SET
    ingresos = COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'ingreso'), 0),
    gastos = COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'gasto'), 0),
    pendiente_aportar = GREATEST(0, total - COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'ingreso'), 0)),
    avance_financiero = CASE WHEN v_total > 0 THEN
      LEAST(100, ROUND((COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'ingreso'), 0) / v_total) * 100))
    ELSE 0 END,
    updated_at = now()
  WHERE id = p_presupuesto_id;

  IF v_proyecto_id IS NOT NULL THEN
    UPDATE public.proyectos SET
      ingresos = COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'ingreso'), 0),
      gastos = COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'gasto'), 0)
    WHERE id = v_proyecto_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_actualizar_financiero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_presupuesto_id uuid;
  v_target_id uuid;
BEGIN
  v_target_id := COALESCE(NEW.proyecto_id, OLD.proyecto_id);
  SELECT id INTO v_presupuesto_id FROM public.presupuestos WHERE proyecto_id = v_target_id LIMIT 1;
  IF v_presupuesto_id IS NOT NULL THEN
    PERFORM public.actualizar_financiero_presupuesto(v_presupuesto_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_actualizar_financiero ON public.transacciones;
CREATE TRIGGER trg_actualizar_financiero
  AFTER INSERT OR UPDATE OR DELETE ON public.transacciones
  FOR EACH ROW EXECUTE FUNCTION public.trigger_actualizar_financiero();

-- ============================================================
-- PARTE 5: Tabla de auditoría (Mejora 9)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_select" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;
CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "audit_log_insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.trigger_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id, auth.uid()),
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_clientes ON public.clientes;
DROP TRIGGER IF EXISTS trg_audit_presupuestos ON public.presupuestos;
DROP TRIGGER IF EXISTS trg_audit_transacciones ON public.transacciones;
DROP TRIGGER IF EXISTS trg_audit_proyectos ON public.proyectos;
DROP TRIGGER IF EXISTS trg_audit_actividades ON public.actividades;
CREATE TRIGGER trg_audit_clientes AFTER INSERT OR UPDATE OR DELETE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.trigger_audit();
CREATE TRIGGER trg_audit_presupuestos AFTER INSERT OR UPDATE OR DELETE ON public.presupuestos FOR EACH ROW EXECUTE FUNCTION public.trigger_audit();
CREATE TRIGGER trg_audit_transacciones AFTER INSERT OR UPDATE OR DELETE ON public.transacciones FOR EACH ROW EXECUTE FUNCTION public.trigger_audit();
CREATE TRIGGER trg_audit_proyectos AFTER INSERT OR UPDATE OR DELETE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION public.trigger_audit();
CREATE TRIGGER trg_audit_actividades AFTER INSERT OR UPDATE OR DELETE ON public.actividades FOR EACH ROW EXECUTE FUNCTION public.trigger_audit();

-- ============================================================
-- PARTE 6: presupuesto_id en actividades (Mejora 7)
-- ============================================================
ALTER TABLE public.actividades ADD COLUMN IF NOT EXISTS presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL;
