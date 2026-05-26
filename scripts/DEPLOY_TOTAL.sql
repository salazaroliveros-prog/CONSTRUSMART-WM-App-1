-- =====================================================================
-- DEPLOY_TOTAL.sql
-- CONSTRUCTORA WM/M&S — Script ÚNICO de sincronización COMPLETA
-- 100% idempotente. Sin recursión RLS (usa SECURITY DEFINER).
-- Pegar TODO en Supabase SQL Editor y ejecutar UNA SOLA VEZ.
-- =====================================================================

-- ============================================================
-- PASO 0: Función SECURITY DEFINER (ANTES de las políticas)
-- Rompe el ciclo de recursión entre equipos ↔ equipo_miembros
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
-- PASO 1: EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PASO 2: TABLA clientes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre        text NOT NULL,
  telefono      text,
  email         text,
  direccion     text,
  tipo_proyecto text,
  estado        text DEFAULT 'Potencial'
                  CHECK (estado IN ('Potencial','Activo','Cerrado')),
  notas         text,
  fecha         date DEFAULT CURRENT_DATE,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 3: TABLA proyectos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.proyectos (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre            text NOT NULL,
  cliente           text,
  tipo              text,
  estado            text DEFAULT 'Planeación'
                      CHECK (estado IN ('Planeación','Ejecución','Finalizado','Evaluación','Parado')),
  presupuesto_total numeric DEFAULT 0,
  avance_fisico     numeric DEFAULT 0 CHECK (avance_fisico >= 0 AND avance_fisico <= 100),
  avance_financiero numeric DEFAULT 0 CHECK (avance_financiero >= 0 AND avance_financiero <= 100),
  ingresos          numeric DEFAULT 0,
  gastos            numeric DEFAULT 0,
  pendiente_aportar numeric DEFAULT 0,
  fecha_inicio      date,
  fecha_fin         date,
  created_at        timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 4: TABLA presupuestos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto               text NOT NULL,
  cliente                text,
  ubicacion              text,
  tipologia              text,
  fase                   text DEFAULT 'planeación'
                           CHECK (fase IN ('planeación','ejecución','pausa','finalizado')),
  proyecto_id            text,
  factor_indirectos      numeric DEFAULT 12,
  factor_administrativos numeric DEFAULT 8,
  factor_imprevistos     numeric DEFAULT 5,
  factor_utilidad        numeric DEFAULT 15,
  lineas                 jsonb DEFAULT '[]'::jsonb,
  avance_fisico          numeric DEFAULT 0 CHECK (avance_fisico >= 0 AND avance_fisico <= 100),
  avance_financiero      numeric DEFAULT 0 CHECK (avance_financiero >= 0 AND avance_financiero <= 100),
  ingresos               numeric DEFAULT 0,
  gastos                 numeric DEFAULT 0,
  pendiente_aportar      numeric DEFAULT 0,
  total                  numeric DEFAULT 0,
  costo_directo          numeric DEFAULT 0,
  fecha_inicio           date,
  fecha_fin              date,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 5: TABLA transacciones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transacciones (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo           text NOT NULL CHECK (tipo IN ('ingreso','gasto')),
  descripcion    text,
  cantidad       numeric DEFAULT 1,
  unidad         text,
  categoria      text CHECK (categoria IN (
                   'materiales','mano-obra','herramienta','sub-contrato',
                   'administrativo','personal','transporte','fijos',
                   'hogar','aporte','trabajos-extra'
                 )),
  costo_unitario numeric DEFAULT 0,
  costo_total    numeric DEFAULT 0,
  fecha          date DEFAULT CURRENT_DATE,
  proyecto_id    text,
  created_at     timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 6: TABLA actividades
-- ============================================================
CREATE TABLE IF NOT EXISTS public.actividades (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo         text NOT NULL,
  fecha          date NOT NULL,
  hora           text,
  descripcion    text,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 7: TABLA equipos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.equipos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      text NOT NULL,
  descripcion text,
  estado      text DEFAULT 'activo' CHECK (estado IN ('activo','inactivo')),
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 8: TABLA equipo_miembros
-- ============================================================
CREATE TABLE IF NOT EXISTS public.equipo_miembros (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipo_id  uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol        text DEFAULT 'miembro' CHECK (rol IN ('admin','miembro','visor')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 9: TABLA renglones (catálogo de renglones/APU)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.renglones (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo            text NOT NULL,
  descripcion       text NOT NULL,
  tipo_renglon      text CHECK (tipo_renglon IN ('material','mano_obra','herramienta','transporte','otro')),
  unidad            text,
  rendimiento       numeric DEFAULT 1,
  costo_material    numeric DEFAULT 0,
  costo_mano_obra   numeric DEFAULT 0,
  costo_herramienta numeric DEFAULT 0,
  subrenglones      jsonb DEFAULT '[]'::jsonb,
  materiales        jsonb DEFAULT '[]'::jsonb,
  categoria         text,
  etiquetas         jsonb DEFAULT '[]'::jsonb,
  tipologia         text,
  estimacion_tiempo numeric,
  dificultad        text CHECK (dificultad IN ('baja','media','alta')),
  equipo_requerido  jsonb DEFAULT '[]'::jsonb,
  notas             text,
  favorito          boolean DEFAULT false,
  frecuencia_uso    numeric DEFAULT 0,
  ultimo_uso        timestamptz,
  activo            boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 9b: TABLA renglon_usage (historial de uso de renglones)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.renglon_usage (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  renglon_id      uuid REFERENCES public.renglones(id) ON DELETE CASCADE,
  presupuesto_id  uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 9c: TABLA renglon_precios_historial
-- ============================================================
CREATE TABLE IF NOT EXISTS public.renglon_precios_historial (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  renglon_id uuid REFERENCES public.renglones(id) ON DELETE CASCADE,
  fecha      timestamptz DEFAULT now(),
  costo      numeric NOT NULL,
  variacion  numeric DEFAULT 0
);

-- ============================================================
-- PASO 9d: TABLA cambios_presupuesto (control de cambios / change orders)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cambios_presupuesto (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id  uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  version         int NOT NULL DEFAULT 1,
  cambios         jsonb NOT NULL DEFAULT '[]'::jsonb,
  motivo          text NOT NULL DEFAULT '',
  aprobado_por    uuid REFERENCES auth.users(id),
  estado          text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 9e: TABLA materiales_proyecto
-- ============================================================
CREATE TABLE IF NOT EXISTS public.materiales_proyecto (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id    uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  nombre            text NOT NULL,
  codigo            text,
  unidad            text DEFAULT 'unidad',
  cantidad_estimada numeric(12,2) DEFAULT 0,
  cantidad_utilizada numeric(12,2) DEFAULT 0,
  costo_unitario    numeric(12,2) DEFAULT 0,
  proveedor         text,
  created_at        timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 9f: TABLA movimientos_materiales
-- ============================================================
CREATE TABLE IF NOT EXISTS public.movimientos_materiales (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id  uuid REFERENCES public.materiales_proyecto(id) ON DELETE CASCADE,
  tipo         text NOT NULL CHECK (tipo IN ('entrada','salida','devolucion')),
  cantidad     numeric(12,2) NOT NULL,
  ubicacion    text,
  referencia   text,
  user_id      uuid REFERENCES auth.users(id),
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 9g: TABLA conciliaciones (bancarias)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conciliaciones (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  banco         text NOT NULL,
  periodo       date NOT NULL,
  saldo_libros  numeric(12,2) DEFAULT 0,
  saldo_banco   numeric(12,2) DEFAULT 0,
  diferencia    numeric(12,2) GENERATED ALWAYS AS (saldo_banco - saldo_libros) STORED,
  conciliado    boolean DEFAULT false,
  notas         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 9h: TABLA partidas_conciliacion
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partidas_conciliacion (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conciliacion_id  uuid REFERENCES public.conciliaciones(id) ON DELETE CASCADE,
  tipo             text NOT NULL CHECK (tipo IN ('pendiente_libros','pendiente_banco','ajuste')),
  monto            numeric(12,2) NOT NULL,
  descripcion      text,
  fecha            date,
  aplicado         boolean DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 9i: TABLA checklist_items (calidad por fase)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id  uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  fase            text NOT NULL CHECK (fase IN ('planeación','ejecución','pausa','finalizado')),
  item            text NOT NULL,
  completado      boolean DEFAULT false,
  foto_url        text,
  completado_por  uuid REFERENCES auth.users(id),
  completado_en   timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 9j: TABLA notificaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo       text NOT NULL CHECK (tipo IN ('info','alerta','exito','warning')),
  titulo     text NOT NULL,
  mensaje    text,
  leido      boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PASO 9k: COLUMNAS FALTANTES (ALTER seguro con IF NOT EXISTS)
-- ============================================================
ALTER TABLE public.actividades
  ADD COLUMN IF NOT EXISTS presupuesto_id uuid
    REFERENCES public.presupuestos(id) ON DELETE SET NULL;

ALTER TABLE public.equipos
  ADD COLUMN IF NOT EXISTS descripcion text;

ALTER TABLE public.equipos
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'activo'
    CHECK (estado IN ('activo','inactivo'));

ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS costo_directo numeric DEFAULT 0;

ALTER TABLE public.conciliaciones
  ADD COLUMN IF NOT EXISTS proyecto_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conciliaciones_proyecto_id ON public.conciliaciones(proyecto_id);

-- ============================================================
-- PASO 10: TRIGGER updated_at en presupuestos
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_presupuestos_updated_at ON public.presupuestos;
CREATE TRIGGER trg_presupuestos_updated_at
  BEFORE UPDATE ON public.presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- PASO 11: HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================
ALTER TABLE public.clientes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo_miembros        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renglones              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renglon_usage          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renglon_precios_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cambios_presupuesto    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales_proyecto    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliaciones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas_conciliacion  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 12: LIMPIAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================================

-- clientes
DROP POLICY IF EXISTS "clientes_owner"                    ON public.clientes;
DROP POLICY IF EXISTS "Permitir CRUD de clientes propios" ON public.clientes;
DROP POLICY IF EXISTS "clientes_select"                   ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert"                   ON public.clientes;
DROP POLICY IF EXISTS "clientes_update"                   ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete"                   ON public.clientes;

-- proyectos
DROP POLICY IF EXISTS "proyectos_owner"                    ON public.proyectos;
DROP POLICY IF EXISTS "Permitir CRUD de proyectos propios" ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_select"                   ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_insert"                   ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_update"                   ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_delete"                   ON public.proyectos;

-- presupuestos
DROP POLICY IF EXISTS "presupuestos_owner"                    ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_select_team"              ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_select_team_v3"           ON public.presupuestos;
DROP POLICY IF EXISTS "Permitir CRUD de presupuestos propios" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_select"                   ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_insert"                   ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_update"                   ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_delete"                   ON public.presupuestos;

-- transacciones
DROP POLICY IF EXISTS "transacciones_owner"                    ON public.transacciones;
DROP POLICY IF EXISTS "Permitir CRUD de transacciones propias" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_select"                   ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_insert"                   ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_update"                   ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_delete"                   ON public.transacciones;

-- actividades
DROP POLICY IF EXISTS "actividades_owner"                    ON public.actividades;
DROP POLICY IF EXISTS "Permitir CRUD de actividades propias" ON public.actividades;
DROP POLICY IF EXISTS "actividades_select"                   ON public.actividades;
DROP POLICY IF EXISTS "actividades_insert"                   ON public.actividades;
DROP POLICY IF EXISTS "actividades_update"                   ON public.actividades;
DROP POLICY IF EXISTS "actividades_delete"                   ON public.actividades;

-- equipos — todos los nombres posibles
DROP POLICY IF EXISTS "equipos_owner"              ON public.equipos;
DROP POLICY IF EXISTS "Acceso propietario equipos" ON public.equipos;
DROP POLICY IF EXISTS "equipos_select"             ON public.equipos;
DROP POLICY IF EXISTS "equipos_select_v2"          ON public.equipos;
DROP POLICY IF EXISTS "equipos_write"              ON public.equipos;
DROP POLICY IF EXISTS "equipos_insert"             ON public.equipos;
DROP POLICY IF EXISTS "equipos_update"             ON public.equipos;
DROP POLICY IF EXISTS "equipos_delete"             ON public.equipos;

-- equipo_miembros — todos los nombres posibles
DROP POLICY IF EXISTS "equipo_miembros_owner"              ON public.equipo_miembros;
DROP POLICY IF EXISTS "Acceso propietario equipo_miembros" ON public.equipo_miembros;
DROP POLICY IF EXISTS "Acceso a equipos como miembro"      ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_select"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_insert"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_update"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_delete"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_select"                    ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_select_own"                ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_team_select"               ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_insert"                    ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_delete"                    ON public.equipo_miembros;

-- renglones
DROP POLICY IF EXISTS "renglones_owner"  ON public.renglones;
DROP POLICY IF EXISTS "renglones_select" ON public.renglones;
DROP POLICY IF EXISTS "renglones_insert" ON public.renglones;
DROP POLICY IF EXISTS "renglones_update" ON public.renglones;
DROP POLICY IF EXISTS "renglones_delete" ON public.renglones;

-- renglon_usage
DROP POLICY IF EXISTS "renglon_usage_owner"  ON public.renglon_usage;
DROP POLICY IF EXISTS "renglon_usage_select" ON public.renglon_usage;
DROP POLICY IF EXISTS "renglon_usage_insert" ON public.renglon_usage;
DROP POLICY IF EXISTS "renglon_usage_update" ON public.renglon_usage;
DROP POLICY IF EXISTS "renglon_usage_delete" ON public.renglon_usage;

-- renglon_precios_historial
DROP POLICY IF EXISTS "renglon_precios_historial_owner"  ON public.renglon_precios_historial;
DROP POLICY IF EXISTS "renglon_precios_historial_select" ON public.renglon_precios_historial;
DROP POLICY IF EXISTS "renglon_precios_historial_insert" ON public.renglon_precios_historial;
DROP POLICY IF EXISTS "renglon_precios_historial_update" ON public.renglon_precios_historial;
DROP POLICY IF EXISTS "renglon_precios_historial_delete" ON public.renglon_precios_historial;

-- cambios_presupuesto
DROP POLICY IF EXISTS "cambios_select" ON public.cambios_presupuesto;
DROP POLICY IF EXISTS "cambios_insert" ON public.cambios_presupuesto;
DROP POLICY IF EXISTS "cambios_update" ON public.cambios_presupuesto;

-- materiales_proyecto
DROP POLICY IF EXISTS "mat_select" ON public.materiales_proyecto;
DROP POLICY IF EXISTS "mat_insert" ON public.materiales_proyecto;
DROP POLICY IF EXISTS "mat_update" ON public.materiales_proyecto;
DROP POLICY IF EXISTS "mat_delete" ON public.materiales_proyecto;

-- movimientos_materiales
DROP POLICY IF EXISTS "mov_select" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_insert" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_update" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "mov_delete" ON public.movimientos_materiales;

-- conciliaciones
DROP POLICY IF EXISTS "conc_select" ON public.conciliaciones;
DROP POLICY IF EXISTS "conc_insert" ON public.conciliaciones;
DROP POLICY IF EXISTS "conc_update" ON public.conciliaciones;
DROP POLICY IF EXISTS "conc_delete" ON public.conciliaciones;

-- partidas_conciliacion
DROP POLICY IF EXISTS "part_select" ON public.partidas_conciliacion;
DROP POLICY IF EXISTS "part_insert" ON public.partidas_conciliacion;
DROP POLICY IF EXISTS "part_update" ON public.partidas_conciliacion;
DROP POLICY IF EXISTS "part_delete" ON public.partidas_conciliacion;

-- checklist_items
DROP POLICY IF EXISTS "checklist_select" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_insert" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_update" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_delete" ON public.checklist_items;

-- notificaciones
DROP POLICY IF EXISTS "notif_select" ON public.notificaciones;
DROP POLICY IF EXISTS "notif_insert" ON public.notificaciones;
DROP POLICY IF EXISTS "notif_update" ON public.notificaciones;
DROP POLICY IF EXISTS "notif_delete" ON public.notificaciones;

-- ============================================================
-- PASO 13: POLÍTICAS RLS — clientes
-- ============================================================
CREATE POLICY "clientes_owner" ON public.clientes
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 14: POLÍTICAS RLS — proyectos
-- ============================================================
CREATE POLICY "proyectos_owner" ON public.proyectos
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 15: POLÍTICAS RLS — presupuestos
-- ============================================================
CREATE POLICY "presupuestos_owner" ON public.presupuestos
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 16: POLÍTICAS RLS — transacciones
-- ============================================================
CREATE POLICY "transacciones_owner" ON public.transacciones
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 17: POLÍTICAS RLS — actividades
-- ============================================================
CREATE POLICY "actividades_owner" ON public.actividades
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 18: POLÍTICAS RLS — equipos (SIN recursión)
-- SELECT: solo el dueño (los miembros acceden via equipo_miembros)
-- ============================================================
CREATE POLICY "equipos_select" ON public.equipos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "equipos_insert" ON public.equipos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "equipos_update" ON public.equipos
  FOR UPDATE TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "equipos_delete" ON public.equipos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- PASO 19: POLÍTICAS RLS — equipo_miembros (SIN recursión)
-- Usa función SECURITY DEFINER user_owns_equipo()
-- ============================================================
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
-- PASO 20: POLÍTICAS RLS — renglones
-- ============================================================
CREATE POLICY "renglones_owner" ON public.renglones
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 21: POLÍTICAS RLS — renglon_usage
-- ============================================================
CREATE POLICY "renglon_usage_owner" ON public.renglon_usage
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 22: POLÍTICAS RLS — renglon_precios_historial
-- ============================================================
CREATE POLICY "renglon_precios_historial_select" ON public.renglon_precios_historial
  FOR SELECT TO authenticated
  USING (renglon_id IN (SELECT id FROM public.renglones WHERE user_id = auth.uid()));

CREATE POLICY "renglon_precios_historial_insert" ON public.renglon_precios_historial
  FOR INSERT TO authenticated
  WITH CHECK (renglon_id IN (SELECT id FROM public.renglones WHERE user_id = auth.uid()));

CREATE POLICY "renglon_precios_historial_update" ON public.renglon_precios_historial
  FOR UPDATE TO authenticated
  USING (renglon_id IN (SELECT id FROM public.renglones WHERE user_id = auth.uid()));

CREATE POLICY "renglon_precios_historial_delete" ON public.renglon_precios_historial
  FOR DELETE TO authenticated
  USING (renglon_id IN (SELECT id FROM public.renglones WHERE user_id = auth.uid()));

-- ============================================================
-- PASO 23: POLÍTICAS RLS — cambios_presupuesto
-- ============================================================
CREATE POLICY "cambios_select" ON public.cambios_presupuesto
  FOR SELECT TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "cambios_insert" ON public.cambios_presupuesto
  FOR INSERT TO authenticated
  WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "cambios_update" ON public.cambios_presupuesto
  FOR UPDATE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

-- ============================================================
-- PASO 24: POLÍTICAS RLS — materiales_proyecto
-- ============================================================
CREATE POLICY "mat_select" ON public.materiales_proyecto
  FOR SELECT TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mat_insert" ON public.materiales_proyecto
  FOR INSERT TO authenticated
  WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mat_update" ON public.materiales_proyecto
  FOR UPDATE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mat_delete" ON public.materiales_proyecto
  FOR DELETE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

-- ============================================================
-- PASO 25: POLÍTICAS RLS — movimientos_materiales
-- ============================================================
CREATE POLICY "mov_select" ON public.movimientos_materiales
  FOR SELECT TO authenticated
  USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));
CREATE POLICY "mov_insert" ON public.movimientos_materiales
  FOR INSERT TO authenticated
  WITH CHECK (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));
CREATE POLICY "mov_update" ON public.movimientos_materiales
  FOR UPDATE TO authenticated
  USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));
CREATE POLICY "mov_delete" ON public.movimientos_materiales
  FOR DELETE TO authenticated
  USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())));

-- ============================================================
-- PASO 26: POLÍTICAS RLS — conciliaciones
-- ============================================================
CREATE POLICY "conc_select" ON public.conciliaciones
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "conc_insert" ON public.conciliaciones
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "conc_update" ON public.conciliaciones
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "conc_delete" ON public.conciliaciones
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- PASO 27: POLÍTICAS RLS — partidas_conciliacion
-- ============================================================
CREATE POLICY "part_select" ON public.partidas_conciliacion
  FOR SELECT TO authenticated
  USING (conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid()));
CREATE POLICY "part_insert" ON public.partidas_conciliacion
  FOR INSERT TO authenticated
  WITH CHECK (conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid()));
CREATE POLICY "part_update" ON public.partidas_conciliacion
  FOR UPDATE TO authenticated
  USING (conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid()));
CREATE POLICY "part_delete" ON public.partidas_conciliacion
  FOR DELETE TO authenticated
  USING (conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid()));

-- ============================================================
-- PASO 28: POLÍTICAS RLS — checklist_items
-- ============================================================
CREATE POLICY "checklist_select" ON public.checklist_items
  FOR SELECT TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "checklist_insert" ON public.checklist_items
  FOR INSERT TO authenticated
  WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "checklist_update" ON public.checklist_items
  FOR UPDATE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "checklist_delete" ON public.checklist_items
  FOR DELETE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

-- ============================================================
-- PASO 29: POLÍTICAS RLS — notificaciones
-- ============================================================
CREATE POLICY "notif_select" ON public.notificaciones
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notif_insert" ON public.notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_update" ON public.notificaciones
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notif_delete" ON public.notificaciones
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- PASO 30: ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clientes_user_id            ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_user_id           ON public.proyectos(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_user_id        ON public.presupuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_fase           ON public.presupuestos(fase);
CREATE INDEX IF NOT EXISTS idx_transacciones_user_id       ON public.transacciones(user_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha         ON public.transacciones(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_proyecto_id   ON public.transacciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_actividades_user_id         ON public.actividades(user_id);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha           ON public.actividades(fecha);
CREATE INDEX IF NOT EXISTS idx_actividades_presupuesto_id  ON public.actividades(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_equipos_user_id             ON public.equipos(user_id);
CREATE INDEX IF NOT EXISTS idx_equipo_miembros_equipo_id   ON public.equipo_miembros(equipo_id);
CREATE INDEX IF NOT EXISTS idx_equipo_miembros_user_id     ON public.equipo_miembros(user_id);

-- renglones
CREATE INDEX IF NOT EXISTS idx_renglones_user_id           ON public.renglones(user_id);
CREATE INDEX IF NOT EXISTS idx_renglones_codigo            ON public.renglones(codigo);
CREATE INDEX IF NOT EXISTS idx_renglones_categoria         ON public.renglones(categoria);
CREATE INDEX IF NOT EXISTS idx_renglones_tipo_renglon      ON public.renglones(tipo_renglon);
CREATE INDEX IF NOT EXISTS idx_renglones_activo            ON public.renglones(activo);
CREATE INDEX IF NOT EXISTS idx_renglones_favorito          ON public.renglones(favorito);

-- renglon_usage
CREATE INDEX IF NOT EXISTS idx_renglon_usage_renglon_id    ON public.renglon_usage(renglon_id);
CREATE INDEX IF NOT EXISTS idx_renglon_usage_user_id       ON public.renglon_usage(user_id);

-- renglon_precios_historial
CREATE INDEX IF NOT EXISTS idx_rph_renglon_id              ON public.renglon_precios_historial(renglon_id);
CREATE INDEX IF NOT EXISTS idx_rph_fecha                   ON public.renglon_precios_historial(fecha DESC);

-- cambios_presupuesto
CREATE INDEX IF NOT EXISTS idx_cambios_presupuesto_id      ON public.cambios_presupuesto(presupuesto_id);

-- materiales_proyecto
CREATE INDEX IF NOT EXISTS idx_mat_proy_presupuesto_id     ON public.materiales_proyecto(presupuesto_id);

-- movimientos_materiales
CREATE INDEX IF NOT EXISTS idx_mov_mat_material_id         ON public.movimientos_materiales(material_id);

-- conciliaciones
CREATE INDEX IF NOT EXISTS idx_conciliaciones_user_id      ON public.conciliaciones(user_id);

-- partidas_conciliacion
CREATE INDEX IF NOT EXISTS idx_part_conc_conciliacion_id   ON public.partidas_conciliacion(conciliacion_id);

-- checklist_items
CREATE INDEX IF NOT EXISTS idx_checklist_presupuesto_id    ON public.checklist_items(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_checklist_fase              ON public.checklist_items(fase);

-- notificaciones
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id      ON public.notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido        ON public.notificaciones(leido);

-- ============================================================
-- PASO 31: VERIFICACIÓN FINAL
-- ============================================================

-- 31a. RLS en las 17 tablas
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes','proyectos','presupuestos','transacciones',
    'actividades','equipos','equipo_miembros',
    'renglones','renglon_usage','renglon_precios_historial',
    'cambios_presupuesto','materiales_proyecto','movimientos_materiales',
    'conciliaciones','partidas_conciliacion','checklist_items',
    'notificaciones'
  )
ORDER BY tablename;

-- 31b. Políticas activas (verificar que NO haya recursión)
SELECT
  tablename,
  policyname,
  cmd AS operacion,
  CASE WHEN qual LIKE '%equipo_miembros%' OR qual LIKE '%equipos%' THEN '⚠️ RECURSIVA' ELSE '✅ OK' END AS riesgo
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('equipos','equipo_miembros','presupuestos')
ORDER BY tablename, policyname;

-- 31c. Columnas clave
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'actividades'  AND column_name = 'presupuesto_id') OR
    (table_name = 'equipos'      AND column_name IN ('descripcion','estado')) OR
    (table_name = 'presupuestos' AND column_name IN ('fase','updated_at','lineas','total','costo_directo'))
  )
ORDER BY table_name, column_name;

-- 31d. Conteo
SELECT COUNT(*) AS tablas_sincronizadas
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes','proyectos','presupuestos','transacciones',
    'actividades','equipos','equipo_miembros',
    'renglones','renglon_usage','renglon_precios_historial',
    'cambios_presupuesto','materiales_proyecto','movimientos_materiales',
    'conciliaciones','partidas_conciliacion','checklist_items',
    'notificaciones'
  );

-- =====================================================================
-- FIN — Verificar que NO haya ⚠️ RECURSIVA en el paso 31b
-- Si todas son ✅ OK, la app está estable
-- =====================================================================
