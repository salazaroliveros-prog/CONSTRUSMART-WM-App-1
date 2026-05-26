-- =====================================================================
-- SYNC_SUPABASE_FINAL.sql  v2
-- CONSTRUCTORA WM/M&S — Script único de sincronización total
-- 100% idempotente: elimina TODAS las políticas posibles antes de crearlas
-- Pega TODO y ejecuta de una sola vez en Supabase SQL Editor
-- =====================================================================

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
-- PASO 9: COLUMNAS FALTANTES (ALTER seguro con IF NOT EXISTS)
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
ALTER TABLE public.clientes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo_miembros ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 12: LIMPIAR TODAS LAS POLÍTICAS EXISTENTES
-- Elimina cualquier nombre que haya podido existir en ejecuciones previas
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

-- equipos — todos los nombres posibles de ejecuciones anteriores
DROP POLICY IF EXISTS "equipos_owner"              ON public.equipos;
DROP POLICY IF EXISTS "Acceso propietario equipos" ON public.equipos;
DROP POLICY IF EXISTS "equipos_select"             ON public.equipos;
DROP POLICY IF EXISTS "equipos_write"              ON public.equipos;
DROP POLICY IF EXISTS "equipos_insert"             ON public.equipos;
DROP POLICY IF EXISTS "equipos_update"             ON public.equipos;
DROP POLICY IF EXISTS "equipos_delete"             ON public.equipos;

-- equipo_miembros — todos los nombres posibles
DROP POLICY IF EXISTS "equipo_miembros_owner"              ON public.equipo_miembros;
DROP POLICY IF EXISTS "Acceso propietario equipo_miembros" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_select"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_insert"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_update"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_delete"             ON public.equipo_miembros;

-- ============================================================
-- PASO 13: CREAR POLÍTICAS RLS — clientes
-- ============================================================
CREATE POLICY "clientes_owner" ON public.clientes
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 14: CREAR POLÍTICAS RLS — proyectos
-- ============================================================
CREATE POLICY "proyectos_owner" ON public.proyectos
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 15: CREAR POLÍTICAS RLS — presupuestos
-- ============================================================
CREATE POLICY "presupuestos_owner" ON public.presupuestos
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 16: CREAR POLÍTICAS RLS — transacciones
-- ============================================================
CREATE POLICY "transacciones_owner" ON public.transacciones
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 17: CREAR POLÍTICAS RLS — actividades
-- ============================================================
CREATE POLICY "actividades_owner" ON public.actividades
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASO 18: CREAR POLÍTICAS RLS — equipos
-- SELECT: dueño + miembros del equipo
-- INSERT/UPDATE/DELETE: solo el dueño
-- ============================================================
CREATE POLICY "equipos_select" ON public.equipos
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    id IN (SELECT equipo_id FROM public.equipo_miembros WHERE user_id = auth.uid())
  );

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
-- PASO 19: CREAR POLÍTICAS RLS — equipo_miembros
-- SELECT: propio registro + dueño del equipo
-- INSERT: solo el dueño del equipo agrega miembros
-- UPDATE/DELETE: dueño del equipo o el propio miembro
-- ============================================================
CREATE POLICY "equipo_miembros_select" ON public.equipo_miembros
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    equipo_id IN (SELECT id FROM public.equipos WHERE user_id = auth.uid())
  );

CREATE POLICY "equipo_miembros_insert" ON public.equipo_miembros
  FOR INSERT TO authenticated
  WITH CHECK (
    equipo_id IN (SELECT id FROM public.equipos WHERE user_id = auth.uid())
  );

CREATE POLICY "equipo_miembros_update" ON public.equipo_miembros
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR
    equipo_id IN (SELECT id FROM public.equipos WHERE user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    equipo_id IN (SELECT id FROM public.equipos WHERE user_id = auth.uid())
  );

CREATE POLICY "equipo_miembros_delete" ON public.equipo_miembros
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR
    equipo_id IN (SELECT id FROM public.equipos WHERE user_id = auth.uid())
  );

-- ============================================================
-- PASO 20: ÍNDICES DE PERFORMANCE
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

-- ============================================================
-- PASO 21: VERIFICACIÓN FINAL
-- ============================================================

-- 21a. RLS en las 7 tablas
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes','proyectos','presupuestos','transacciones',
    'actividades','equipos','equipo_miembros'
  )
ORDER BY tablename;

-- 21b. Políticas activas
SELECT
  tablename,
  policyname,
  cmd AS operacion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes','proyectos','presupuestos','transacciones',
    'actividades','equipos','equipo_miembros'
  )
ORDER BY tablename, policyname;

-- 21c. Columnas clave
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'actividades'  AND column_name = 'presupuesto_id') OR
    (table_name = 'equipos'      AND column_name IN ('descripcion','estado')) OR
    (table_name = 'presupuestos' AND column_name IN ('fase','updated_at','lineas','total'))
  )
ORDER BY table_name, column_name;

-- =====================================================================
-- FIN — 21a debe mostrar ✅ RLS ON en las 7 tablas
-- =====================================================================
