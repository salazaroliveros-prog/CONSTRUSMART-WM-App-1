-- =====================================================================
-- RESET_DATABASE.sql
-- Script completo: LIMPIA y RECREA toda la base de datos
-- =====================================================================

-- PASO 1: Eliminar políticas existentes
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- PASO 2: Eliminar funciones y triggers
DROP TRIGGER IF EXISTS trg_presupuestos_updated_at ON public.presupuestos;
DROP TRIGGER IF EXISTS trg_subrenglones_updated_at ON public.subrenglones;
DROP FUNCTION IF EXISTS public.fn_set_updated_at();
DROP FUNCTION IF EXISTS public.user_owns_equipo(uuid);
DROP FUNCTION IF EXISTS public.user_owns_presupuesto(uuid);

-- PASO 3: Eliminar tablas
DROP TABLE IF EXISTS public.subrenglon_equipos CASCADE;
DROP TABLE IF EXISTS public.subrenglon_mano_obra CASCADE;
DROP TABLE IF EXISTS public.subrenglon_materiales CASCADE;
DROP TABLE IF EXISTS public.subrenglones CASCADE;
DROP TABLE IF EXISTS public.renglon_usage CASCADE;
DROP TABLE IF EXISTS public.renglon_precios_historial CASCADE;
DROP TABLE IF EXISTS public.renglones CASCADE;
DROP TABLE IF EXISTS public.orden_compra_items CASCADE;
DROP TABLE IF EXISTS public.recepcion_oc_items CASCADE;
DROP TABLE IF EXISTS public.recepcion_oc CASCADE;
DROP TABLE IF EXISTS public.ordenes_compra CASCADE;
DROP TABLE IF EXISTS public.proveedores CASCADE;
DROP TABLE IF EXISTS public.checklist_items CASCADE;
DROP TABLE IF EXISTS public.notificaciones CASCADE;
DROP TABLE IF EXISTS public.partidas_conciliacion CASCADE;
DROP TABLE IF EXISTS public.conciliaciones CASCADE;
DROP TABLE IF EXISTS public.movimientos_caja CASCADE;
DROP TABLE IF EXISTS public.caja_proyecto CASCADE;
DROP TABLE IF EXISTS public.ocr_documentos CASCADE;
DROP TABLE IF EXISTS public.device_tokens CASCADE;
DROP TABLE IF EXISTS public.materiales_proyecto CASCADE;
DROP TABLE IF EXISTS public.movimientos_materiales CASCADE;
DROP TABLE IF EXISTS public.cambios_presupuesto CASCADE;
DROP TABLE IF EXISTS public.equipo_miembros CASCADE;
DROP TABLE IF EXISTS public.equipos CASCADE;
DROP TABLE IF EXISTS public.actividades CASCADE;
DROP TABLE IF EXISTS public.bitacora_avance CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.empleados CASCADE;
DROP TABLE IF EXISTS public.transacciones CASCADE;
DROP TABLE IF EXISTS public.presupuestos CASCADE;
DROP TABLE IF EXISTS public.proyectos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;

-- PASO 4: Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PASO 5: Función trigger
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.user_owns_equipo(p_equipo_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
SELECT EXISTS (SELECT 1 FROM public.equipos WHERE id = p_equipo_id AND user_id = auth.uid());
$$ SET search_path = 'public, auth';

CREATE OR REPLACE FUNCTION public.user_owns_presupuesto(p_presupuesto_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
SELECT EXISTS (SELECT 1 FROM public.presupuestos WHERE id = p_presupuesto_id AND user_id = auth.uid());
$$ SET search_path = 'public, auth';

-- PASO 6: Tablas principales
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL, telefono text, email text, direccion text,
  tipo_proyecto text DEFAULT 'Residencial', estado text DEFAULT 'Potencial',
  fecha date DEFAULT CURRENT_DATE, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL, cliente text, tipo text, estado text DEFAULT 'Planeación',
  presupuesto_total numeric DEFAULT 0, avance_fisico numeric DEFAULT 0,
  avance_financiero numeric DEFAULT 0, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.presupuestos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto text NOT NULL, cliente text, ubicacion text, tipologia text, fase text,
  factor_indirectos numeric, factor_administrativos numeric, 
  factor_imprevistos numeric, factor_utilidad numeric, lineas jsonb,
  avance_fisico numeric, avance_financiero numeric, total numeric,
  fecha_inicio date, fecha_fin date, created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.transacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL, descripcion text, cantidad numeric DEFAULT 1,
  categoria text, costo_total numeric DEFAULT 0, fecha date DEFAULT CURRENT_DATE,
  proyecto_id text, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL, puesto text NOT NULL DEFAULT 'Operario',
  salario_diario numeric(10,2) DEFAULT 0, activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.bitacora_avance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  fecha date DEFAULT CURRENT_DATE, avance numeric NOT NULL DEFAULT 0,
  notas text, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.actividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL, fecha date NOT NULL, descripcion text,
  presupuesto_id uuid REFERENCES public.presupuestos(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL, descripcion text, estado text DEFAULT 'activo',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.equipo_miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text DEFAULT 'miembro', created_at timestamptz DEFAULT now(),
  UNIQUE(equipo_id, user_id)
);

CREATE TABLE public.renglones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo text NOT NULL, descripcion text NOT NULL, unidad text, rendimiento numeric DEFAULT 1,
  costo_material numeric DEFAULT 0, costo_mano_obra numeric DEFAULT 0, 
  costo_herramienta numeric DEFAULT 0, subrenglones jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.subrenglones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  renglon_id uuid REFERENCES public.renglones(id), codigo text, 
  descripcion text NOT NULL, cantidad numeric(14,4) DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.subrenglon_materiales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subrenglon_id uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  nombre text NOT NULL, unidad text, cantidad numeric(18,4) DEFAULT 0, subtotal numeric(18,4) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.subrenglon_mano_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subrenglon_id uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  descripcion text NOT NULL, cantidad_personas numeric(10,4) DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.subrenglon_equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subrenglon_id uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  descripcion text NOT NULL, cantidad numeric(14,4) DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.materiales_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  nombre text NOT NULL, codigo text, unidad text, 
  cantidad_estimada numeric(12,2) DEFAULT 0, costo_unitario numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.movimientos_materiales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materiales_proyecto(id),
  tipo text NOT NULL, cantidad numeric(12,2) NOT NULL,
  user_id uuid REFERENCES auth.users(id), created_at timestamptz DEFAULT now()
);

CREATE TABLE public.proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL, activo boolean DEFAULT true, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.ordenes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folio text NOT NULL, proveedor_id uuid REFERENCES public.proveedores(id),
  estatus text DEFAULT 'pendiente', total numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.orden_compra_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id uuid NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  descripcion text NOT NULL, cantidad numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL, titulo text NOT NULL, leido boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL
);

CREATE TABLE public.ocr_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL, estado text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now()
);

-- PASO 7: Habilitar RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_avance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglon_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglon_mano_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglon_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_documentos ENABLE ROW LEVEL SECURITY;

-- PASO 8: Políticas RLS
CREATE POLICY "clientes_owner" ON public.clientes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proyectos_owner" ON public.proyectos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "presupuestos_owner" ON public.presupuestos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transacciones_owner" ON public.transacciones FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "empleados_owner" ON public.empleados FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bitacora_select" ON public.bitacora_avance FOR SELECT USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "bitacora_insert" ON public.bitacora_avance FOR INSERT WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "bitacora_update" ON public.bitacora_avance FOR UPDATE USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "bitacora_delete" ON public.bitacora_avance FOR DELETE USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "actividades_owner" ON public.actividades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "equipos_select" ON public.equipos FOR SELECT USING (auth.uid() = user_id OR id IN (SELECT equipo_id FROM public.equipo_miembros WHERE user_id = auth.uid()));
CREATE POLICY "equipos_insert" ON public.equipos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "equipos_update" ON public.equipos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "equipos_delete" ON public.equipos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "equipo_miembros_select" ON public.equipo_miembros FOR SELECT USING (auth.uid() = user_id OR public.user_owns_equipo(equipo_id));
CREATE POLICY "equipo_miembros_insert" ON public.equipo_miembros FOR INSERT WITH CHECK (public.user_owns_equipo(equipo_id));
CREATE POLICY "equipo_miembros_update" ON public.equipo_miembros FOR UPDATE USING (public.user_owns_equipo(equipo_id)) WITH CHECK (public.user_owns_equipo(equipo_id));
CREATE POLICY "equipo_miembros_delete" ON public.equipo_miembros FOR DELETE USING (public.user_owns_equipo(equipo_id));

CREATE POLICY "renglones_owner" ON public.renglones FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sr_select" ON public.subrenglones FOR SELECT USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sr_insert" ON public.subrenglones FOR INSERT WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sr_update" ON public.subrenglones FOR UPDATE USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sr_delete" ON public.subrenglones FOR DELETE USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "srm_select" ON public.subrenglon_materiales FOR SELECT USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "srm_insert" ON public.subrenglon_materiales FOR INSERT WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "srm_update" ON public.subrenglon_materiales FOR UPDATE USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "srm_delete" ON public.subrenglon_materiales FOR DELETE USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "smo_select" ON public.subrenglon_mano_obra FOR SELECT USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "smo_insert" ON public.subrenglon_mano_obra FOR INSERT WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "smo_update" ON public.subrenglon_mano_obra FOR UPDATE USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "smo_delete" ON public.subrenglon_mano_obra FOR DELETE USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "sre_select" ON public.subrenglon_equipos FOR SELECT USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sre_insert" ON public.subrenglon_equipos FOR INSERT WITH CHECK (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sre_update" ON public.subrenglon_equipos FOR UPDATE USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "sre_delete" ON public.subrenglon_equipos FOR DELETE USING (subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "mat_select" ON public.materiales_proyecto FOR SELECT USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mat_insert" ON public.materiales_proyecto FOR INSERT WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mat_update" ON public.materiales_proyecto FOR UPDATE USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "mov_select" ON public.movimientos_materiales FOR SELECT USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mov_insert" ON public.movimientos_materiales FOR INSERT WITH CHECK (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mov_update" ON public.movimientos_materiales FOR UPDATE USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));
CREATE POLICY "mov_delete" ON public.movimientos_materiales FOR DELETE USING (material_id IN (SELECT id FROM public.materiales_proyecto WHERE presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "proveedores_owner" ON public.proveedores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oc_owner" ON public.ordenes_compra FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oci_owner" ON public.orden_compra_items FOR ALL USING (EXISTS (SELECT 1 FROM public.ordenes_compra WHERE id = orden_compra_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.ordenes_compra WHERE id = orden_compra_id AND user_id = auth.uid()));

CREATE POLICY "notif_select" ON public.notificaciones FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_insert" ON public.notificaciones FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tokens_owner" ON public.device_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ocr_owner" ON public.ocr_documentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

SELECT 'Base de datos limpia y configurada' as status;