-- =====================================================================
-- ERP_SCHEMA_CLEAN.sql
-- Schema COMPLETO - Solo para Supabase (elimina todo y crea limpio)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION fn_set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_owns_equipo(p_equipo_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
SELECT EXISTS (SELECT 1 FROM public.equipos WHERE id = p_equipo_id AND user_id = auth.uid());
$$ SET search_path = 'public, auth';

CREATE OR REPLACE FUNCTION user_owns_presupuesto(p_presupuesto_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
SELECT EXISTS (SELECT 1 FROM public.presupuestos WHERE id = p_presupuesto_id AND user_id = auth.uid());
$$ SET search_path = 'public, auth';

CREATE TABLE clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono text, email text, direccion text,
  tipo_proyecto text DEFAULT 'Residencial',
  estado text DEFAULT 'Potencial',
  fecha date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  cliente text, tipo text,
  estado text DEFAULT 'Planeación',
  presupuesto_total numeric DEFAULT 0,
  avance_fisico numeric DEFAULT 0,
  avance_financiero numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE presupuestos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto text NOT NULL,
  cliente text, ubicacion text, tipologia text, fase text,
  factor_indirectos numeric, factor_administrativos numeric, factor_imprevistos numeric, factor_utilidad numeric,
  lineas jsonb, avance_fisico numeric, avance_financiero numeric, total numeric,
  fecha_inicio date, fecha_fin date,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE transacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL, descripcion text, cantidad numeric DEFAULT 1,
  categoria text, costo_total numeric DEFAULT 0, fecha date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL, puesto text NOT NULL DEFAULT 'Operario',
  salario_diario numeric(10,2) DEFAULT 0, activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bitacora_avance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  fecha date DEFAULT CURRENT_DATE, avance numeric NOT NULL DEFAULT 0,
  notas text, created_at timestamptz DEFAULT now()
);

CREATE TABLE actividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL, fecha date NOT NULL, descripcion text,
  presupuesto_id uuid REFERENCES public.presupuestos(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL, descripcion text,
  estado text DEFAULT 'activo', created_at timestamptz DEFAULT now()
);

CREATE TABLE equipo_miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text DEFAULT 'miembro', created_at timestamptz DEFAULT now(),
  UNIQUE(equipo_id, user_id)
);

CREATE TABLE renglones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo text NOT NULL, descripcion text NOT NULL, unidad text, rendimiento numeric DEFAULT 1,
  costo_material numeric DEFAULT 0, costo_mano_obra numeric DEFAULT 0, costo_herramienta numeric DEFAULT 0,
  subrenglones jsonb DEFAULT '[]'::jsonb, created_at timestamptz DEFAULT now()
);

CREATE TABLE subrenglones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  renglon_id uuid REFERENCES public.renglones(id), codigo text, descripcion text NOT NULL,
  cantidad numeric(14,4) DEFAULT 1, created_at timestamptz DEFAULT now()
);

CREATE TABLE subrenglon_materiales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subrenglon_id uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  nombre text NOT NULL, unidad text, cantidad numeric(18,4) DEFAULT 0, subtotal numeric(18,4) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE subrenglon_mano_obra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subrenglon_id uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  descripcion text NOT NULL, cantidad_personas numeric(10,4) DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE subrenglon_equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subrenglon_id uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  descripcion text NOT NULL, cantidad numeric(14,4) DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE materiales_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  nombre text NOT NULL, codigo text, unidad text, cantidad_estimada numeric(12,2) DEFAULT 0,
  costo_unitario numeric(12,2) DEFAULT 0, created_at timestamptz DEFAULT now()
);

CREATE TABLE movimientos_materiales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materiales_proyecto(id),
  tipo text NOT NULL, cantidad numeric(12,2) NOT NULL,
  user_id uuid REFERENCES auth.users(id), created_at timestamptz DEFAULT now()
);

CREATE TABLE proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL, activo boolean DEFAULT true, created_at timestamptz DEFAULT now()
);

CREATE TABLE ordenes_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folio text NOT NULL, proveedor_id uuid REFERENCES public.proveedores(id),
  estatus text DEFAULT 'pendiente', total numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE orden_compra_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id uuid NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  descripcion text NOT NULL, cantidad numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL, titulo text NOT NULL, leido boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL
);

CREATE TABLE ocr_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL, estado text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitacora_avance ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipo_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE subrenglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE subrenglon_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE subrenglon_mano_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE subrenglon_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiales_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_documentos ENABLE ROW LEVEL SECURITY;

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

SELECT 'Schema completo instalado' as status;