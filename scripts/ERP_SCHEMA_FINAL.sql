-- =====================================================================
-- ERP_SCHEMA_FINAL.sql
-- Esquema completo de la aplicación CONSTRUSMART WM
-- Incluye: 19 tablas, RLS, funciones SECURITY DEFINER, triggers, índices
-- Copiar y ejecutar COMPLETO en el SQL Editor de Supabase
-- =====================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNCIÓN TRIGGER updated_at (no depende de tablas)
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABLAS DEL SISTEMA (orden de creación respeta dependencias)

-- 4.1. clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre        text NOT NULL,
  telefono      text,
  email         text,
  direccion     text,
  tipo_proyecto text DEFAULT 'Residencial',
  estado        text DEFAULT 'Potencial',
  notas         text,
  fecha         date DEFAULT CURRENT_DATE,
  created_at    timestamptz DEFAULT now()
);

-- 4.2. proyectos
CREATE TABLE IF NOT EXISTS public.proyectos (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre            text NOT NULL,
  cliente           text,
  tipo              text,
  estado            text DEFAULT 'Planeación',
  presupuesto_total numeric DEFAULT 0,
  avance_fisico     numeric DEFAULT 0,
  avance_financiero numeric DEFAULT 0,
  ingresos          numeric DEFAULT 0,
  gastos            numeric DEFAULT 0,
  pendiente_aportar numeric DEFAULT 0,
  fecha_inicio      date,
  fecha_fin         date,
  created_at        timestamptz DEFAULT now()
);

-- 4.3. presupuestos (núcleo del sistema)
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto               text NOT NULL,
  cliente                text,
  ubicacion              text,
  tipologia              text,
  fase                   text DEFAULT 'planeación',
  proyecto_id            text,
  factor_indirectos      numeric DEFAULT 12,
  factor_administrativos numeric DEFAULT 8,
  factor_imprevistos     numeric DEFAULT 5,
  factor_utilidad        numeric DEFAULT 15,
  lineas                 jsonb DEFAULT '[]'::jsonb,
  avance_fisico          numeric DEFAULT 0,
  avance_financiero      numeric DEFAULT 0,
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

-- TRIGGER updated_at para presupuestos
DROP TRIGGER IF EXISTS trg_presupuestos_updated_at ON public.presupuestos;
CREATE TRIGGER trg_presupuestos_updated_at
  BEFORE UPDATE ON public.presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 4.4. transacciones (ingresos/gastos)
CREATE TABLE IF NOT EXISTS public.transacciones (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo           text NOT NULL,
  descripcion    text,
  cantidad       numeric DEFAULT 1,
  unidad         text,
  categoria      text,
  costo_unitario numeric DEFAULT 0,
  costo_total    numeric DEFAULT 0,
  fecha          date DEFAULT CURRENT_DATE,
  proyecto_id    text,
  empleado_id    text,
  created_at     timestamptz DEFAULT now()
);

-- 4.5. audit_log (auditoría de cambios)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tabla          text NOT NULL,
  registro_id    uuid NOT NULL,
  accion         text NOT NULL,
  valor_anterior jsonb,
  valor_nuevo    jsonb,
  created_at     timestamptz DEFAULT now()
);

-- 4.6. bitacora_avance (seguimiento de avance por presupuesto)
CREATE TABLE IF NOT EXISTS public.bitacora_avance (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id  uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  fecha           date DEFAULT CURRENT_DATE,
  avance          numeric NOT NULL DEFAULT 0,
  notas           text,
  recursos_usados jsonb DEFAULT '[]'::jsonb,
  created_at      timestamptz DEFAULT now()
);

-- 4.7. actividades (tareas/eventos)
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

-- 4.8. equipos (gestión de equipos de trabajo multi-usuario)
CREATE TABLE IF NOT EXISTS public.equipos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      text NOT NULL,
  descripcion text,
  estado      text DEFAULT 'activo' CHECK (estado IN ('activo','inactivo')),
  created_at  timestamptz DEFAULT now()
);

-- 4.9. equipo_miembros (miembros de cada equipo)
CREATE TABLE IF NOT EXISTS public.equipo_miembros (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipo_id  uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol        text DEFAULT 'miembro' CHECK (rol IN ('admin','miembro','visor')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(equipo_id, user_id)
);

-- 4.10. FUNCIÓN DE SEGURIDAD (depende de public.equipos)
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

-- 4.11. renglones (catálogo de APU — análisis de precios unitarios)
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
  mano_obra         jsonb DEFAULT '[]'::jsonb,
  equipos           jsonb DEFAULT '[]'::jsonb,
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

-- 4.12. renglon_usage (historial de uso de renglones en presupuestos)
CREATE TABLE IF NOT EXISTS public.renglon_usage (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  renglon_id      uuid REFERENCES public.renglones(id) ON DELETE CASCADE,
  presupuesto_id  uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now()
);

-- 4.13. renglon_precios_historial (historial de precios de renglones)
CREATE TABLE IF NOT EXISTS public.renglon_precios_historial (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  renglon_id uuid REFERENCES public.renglones(id) ON DELETE CASCADE,
  fecha      timestamptz DEFAULT now(),
  costo      numeric NOT NULL,
  variacion  numeric DEFAULT 0
);

-- 4.14. cambios_presupuesto (control de cambios / change orders)
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

-- 4.15. materiales_proyecto (materiales asignados a cada presupuesto)
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

-- 4.16. movimientos_materiales (entradas/salidas de materiales)
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

-- 4.17. conciliaciones (conciliaciones bancarias)
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
  proyecto_id   text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 4.18. partidas_conciliacion (partidas individuales de conciliación)
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

-- 4.19. checklist_items (checklist de calidad por fase)
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

-- 4.20. notificaciones (notificaciones del sistema)
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo       text NOT NULL CHECK (tipo IN ('info','alerta','exito','warning')),
  titulo     text NOT NULL,
  mensaje    text,
  leido      boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 5. HABILITAR ROW LEVEL SECURITY EN TODAS LAS TABLAS
ALTER TABLE public.clientes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_avance        ENABLE ROW LEVEL SECURITY;
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

-- 6. ELIMINAR POLÍTICAS EXISTENTES (para reinicio idempotente)
-- clientes
DROP POLICY IF EXISTS "clientes_owner"                    ON public.clientes;
DROP POLICY IF EXISTS "Permitir CRUD de clientes propios" ON public.clientes;
DROP POLICY IF EXISTS "clientes_select"                   ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert"                   ON public.clientes;
DROP POLICY IF EXISTS "clientes_update"                   ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete"                   ON public.clientes;
DROP POLICY IF EXISTS "owner_only"                        ON public.clientes;

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
DROP POLICY IF EXISTS "presupuestos_select_team"              ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_select_team_v3"           ON public.presupuestos;
DROP POLICY IF EXISTS "owner_only_presupuestos"               ON public.presupuestos;

-- transacciones
DROP POLICY IF EXISTS "transacciones_owner"                    ON public.transacciones;
DROP POLICY IF EXISTS "Permitir CRUD de transacciones propias" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_select"                   ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_insert"                   ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_update"                   ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_delete"                   ON public.transacciones;
DROP POLICY IF EXISTS "owner_only_transacciones"               ON public.transacciones;

-- audit_log
DROP POLICY IF EXISTS "audit_log_owner"  ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_select" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;

-- bitacora_avance
DROP POLICY IF EXISTS "owner_bitacora"              ON public.bitacora_avance;
DROP POLICY IF EXISTS "bitacora_owner"              ON public.bitacora_avance;
DROP POLICY IF EXISTS "bitacora_select"             ON public.bitacora_avance;
DROP POLICY IF EXISTS "bitacora_insert"             ON public.bitacora_avance;
DROP POLICY IF EXISTS "bitacora_update"             ON public.bitacora_avance;
DROP POLICY IF EXISTS "bitacora_delete"             ON public.bitacora_avance;

-- actividades
DROP POLICY IF EXISTS "actividades_owner"                    ON public.actividades;
DROP POLICY IF EXISTS "Permitir CRUD de actividades propias" ON public.actividades;
DROP POLICY IF EXISTS "actividades_select"                   ON public.actividades;
DROP POLICY IF EXISTS "actividades_insert"                   ON public.actividades;
DROP POLICY IF EXISTS "actividades_update"                   ON public.actividades;
DROP POLICY IF EXISTS "actividades_delete"                   ON public.actividades;

-- equipos (todos los nombres posibles de ejecuciones anteriores)
DROP POLICY IF EXISTS "equipos_owner"              ON public.equipos;
DROP POLICY IF EXISTS "Acceso propietario equipos" ON public.equipos;
DROP POLICY IF EXISTS "equipos_select"             ON public.equipos;
DROP POLICY IF EXISTS "equipos_select_v2"          ON public.equipos;
DROP POLICY IF EXISTS "equipos_write"              ON public.equipos;
DROP POLICY IF EXISTS "equipos_insert"             ON public.equipos;
DROP POLICY IF EXISTS "equipos_update"             ON public.equipos;
DROP POLICY IF EXISTS "equipos_delete"             ON public.equipos;

-- equipo_miembros (todos los nombres posibles)
DROP POLICY IF EXISTS "equipo_miembros_owner"              ON public.equipo_miembros;
DROP POLICY IF EXISTS "Acceso propietario equipo_miembros" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_select"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_insert"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_update"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_delete"             ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_select"                    ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_select_own"                ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_team_select"               ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_insert"                    ON public.equipo_miembros;
DROP POLICY IF EXISTS "miembros_delete"                    ON public.equipo_miembros;
DROP POLICY IF EXISTS "Acceso a equipos como miembro"      ON public.equipo_miembros;

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

-- 7. POLÍTICAS RLS

-- 7.1. clientes
CREATE POLICY "clientes_owner" ON public.clientes
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7.2. proyectos
CREATE POLICY "proyectos_owner" ON public.proyectos
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7.3. presupuestos (solo propietario)
CREATE POLICY "presupuestos_owner" ON public.presupuestos
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7.4. transacciones
CREATE POLICY "transacciones_owner" ON public.transacciones
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7.5. audit_log (solo select e insert para el propio usuario)
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7.6. bitacora_avance (acceso vía presupuesto)
CREATE POLICY "bitacora_select" ON public.bitacora_avance
  FOR SELECT TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "bitacora_insert" ON public.bitacora_avance
  FOR INSERT TO authenticated
  WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "bitacora_update" ON public.bitacora_avance
  FOR UPDATE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "bitacora_delete" ON public.bitacora_avance
  FOR DELETE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

-- 7.7. actividades
CREATE POLICY "actividades_owner" ON public.actividades
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7.8. equipos (SELECT: dueño + miembros; INSERT/UPDATE/DELETE: solo dueño)
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

-- 7.9. equipo_miembros (SELECT: propio registro + dueño del equipo; INSERT: dueño; UPDATE/DELETE: dueño)
CREATE POLICY "equipo_miembros_select" ON public.equipo_miembros
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    public.user_owns_equipo(equipo_id)
  );

CREATE POLICY "equipo_miembros_insert" ON public.equipo_miembros
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_owns_equipo(equipo_id)
  );

CREATE POLICY "equipo_miembros_update" ON public.equipo_miembros
  FOR UPDATE TO authenticated
  USING (public.user_owns_equipo(equipo_id))
  WITH CHECK (public.user_owns_equipo(equipo_id));

CREATE POLICY "equipo_miembros_delete" ON public.equipo_miembros
  FOR DELETE TO authenticated
  USING (public.user_owns_equipo(equipo_id));

-- 7.10. renglones
CREATE POLICY "renglones_owner" ON public.renglones
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7.11. renglon_usage
CREATE POLICY "renglon_usage_owner" ON public.renglon_usage
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7.12. renglon_precios_historial (autorización vía renglones)
CREATE POLICY "rph_select" ON public.renglon_precios_historial
  FOR SELECT TO authenticated
  USING (renglon_id IN (SELECT id FROM public.renglones WHERE user_id = auth.uid()));

CREATE POLICY "rph_insert" ON public.renglon_precios_historial
  FOR INSERT TO authenticated
  WITH CHECK (renglon_id IN (SELECT id FROM public.renglones WHERE user_id = auth.uid()));

CREATE POLICY "rph_update" ON public.renglon_precios_historial
  FOR UPDATE TO authenticated
  USING (renglon_id IN (SELECT id FROM public.renglones WHERE user_id = auth.uid()));

CREATE POLICY "rph_delete" ON public.renglon_precios_historial
  FOR DELETE TO authenticated
  USING (renglon_id IN (SELECT id FROM public.renglones WHERE user_id = auth.uid()));

-- 7.13. cambios_presupuesto
CREATE POLICY "cambios_select" ON public.cambios_presupuesto
  FOR SELECT TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "cambios_insert" ON public.cambios_presupuesto
  FOR INSERT TO authenticated
  WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "cambios_update" ON public.cambios_presupuesto
  FOR UPDATE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

-- 7.14. materiales_proyecto
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

-- 7.15. movimientos_materiales
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

-- 7.16. conciliaciones
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

-- 7.17. partidas_conciliacion
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

-- 7.18. checklist_items
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

-- 7.19. notificaciones
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

-- 8. ÍNDICES DE PERFORMANCE
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
CREATE INDEX IF NOT EXISTS idx_renglones_user_id           ON public.renglones(user_id);
CREATE INDEX IF NOT EXISTS idx_renglones_codigo            ON public.renglones(codigo);
CREATE INDEX IF NOT EXISTS idx_renglones_categoria         ON public.renglones(categoria);
CREATE INDEX IF NOT EXISTS idx_renglones_tipo_renglon      ON public.renglones(tipo_renglon);
CREATE INDEX IF NOT EXISTS idx_renglones_activo            ON public.renglones(activo);
CREATE INDEX IF NOT EXISTS idx_renglones_favorito          ON public.renglones(favorito);
CREATE INDEX IF NOT EXISTS idx_renglon_usage_renglon_id    ON public.renglon_usage(renglon_id);
CREATE INDEX IF NOT EXISTS idx_renglon_usage_user_id       ON public.renglon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_rph_renglon_id              ON public.renglon_precios_historial(renglon_id);
CREATE INDEX IF NOT EXISTS idx_rph_fecha                   ON public.renglon_precios_historial(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_cambios_presupuesto_id      ON public.cambios_presupuesto(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_mat_proy_presupuesto_id     ON public.materiales_proyecto(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_mov_mat_material_id         ON public.movimientos_materiales(material_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_user_id      ON public.conciliaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_proyecto_id  ON public.conciliaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_part_conc_conciliacion_id   ON public.partidas_conciliacion(conciliacion_id);
CREATE INDEX IF NOT EXISTS idx_checklist_presupuesto_id    ON public.checklist_items(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_checklist_fase              ON public.checklist_items(fase);
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id      ON public.notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido        ON public.notificaciones(leido);
CREATE INDEX IF NOT EXISTS idx_audit_log_user              ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_registro          ON public.audit_log(registro_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_presupuesto_id     ON public.bitacora_avance(presupuesto_id);

-- 9. VERIFICACIÓN FINAL
-- 9a. RLS activo en las 19 tablas
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes','proyectos','presupuestos','transacciones',
    'audit_log','bitacora_avance',
    'actividades','equipos','equipo_miembros',
    'renglones','renglon_usage','renglon_precios_historial',
    'cambios_presupuesto','materiales_proyecto','movimientos_materiales',
    'conciliaciones','partidas_conciliacion','checklist_items',
    'notificaciones'
  )
ORDER BY tablename;

-- 9b. Políticas activas
SELECT tablename, policyname, cmd AS operacion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'clientes','proyectos','presupuestos','transacciones',
    'audit_log','bitacora_avance',
    'actividades','equipos','equipo_miembros',
    'renglones','renglon_usage','renglon_precios_historial',
    'cambios_presupuesto','materiales_proyecto','movimientos_materiales',
    'conciliaciones','partidas_conciliacion','checklist_items',
    'notificaciones'
  )
ORDER BY tablename, policyname;

-- =====================================================================
-- FIN — Todas las tablas deben mostrar ✅ RLS ON
-- =====================================================================
