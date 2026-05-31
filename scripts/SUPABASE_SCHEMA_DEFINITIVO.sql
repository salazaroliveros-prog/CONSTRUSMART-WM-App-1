
-- =====================================================================
-- SUPABASE_SCHEMA_DEFINITIVO.sql
-- CONSTRUSMART WM - Esquema Unificado y Definitivo
--
-- Este archivo reemplaza TODOS los esquemas anteriores/adicionales.
-- Copiar y ejecutar COMPLETO en el SQL Editor de Supabase.
--
-- Alineado con:
--   - src/types/supabase.ts (fuente de verdad de tipos)
--   - Lógica de servicios en src/services/
--   - Políticas RLS y triggers del SUPABASE_MASTER_SCHEMA_v2.sql
--   - Tablas adicionales de ERP_SCHEMA_FINAL (caja, conciliaciones)
--
-- Orden de ejecución: ejecutar COMPLETO de una sola vez
-- =====================================================================

-- =====================================================================
-- FASE 0: LIMPIEZA SEGURA (IDEMPOTENTE)
-- =====================================================================

DROP TRIGGER IF EXISTS trg_auto_movimiento_recepcion ON public.recepcion_oc_items;
DROP TRIGGER IF EXISTS trg_ordenes_compra_updated_at ON public.ordenes_compra;
DROP TRIGGER IF EXISTS trg_notificaciones_updated_at ON public.notificaciones;
DROP TRIGGER IF EXISTS trg_transacciones_recurrentes_updated_at ON public.transacciones_recurrentes;
DROP TRIGGER IF EXISTS trg_movimientos_caja_updated_at ON public.movimientos_caja;
DROP TRIGGER IF EXISTS trg_caja_proyecto_updated_at ON public.caja_proyecto;
DROP TRIGGER IF EXISTS trg_conciliaciones_updated_at ON public.conciliaciones;
DROP TRIGGER IF EXISTS trg_actividades_updated_at ON public.actividades;
DROP TRIGGER IF EXISTS trg_cambios_presupuesto_updated_at ON public.cambios_presupuesto;
DROP TRIGGER IF EXISTS trg_presupuestos_updated_at ON public.presupuestos;
DROP TRIGGER IF EXISTS trg_materiales_proyecto_updated_at ON public.materiales_proyecto;
DROP TRIGGER IF EXISTS trg_subrenglones_updated_at ON public.subrenglones;
DROP TRIGGER IF EXISTS trg_renglones_updated_at ON public.renglones;
DROP TRIGGER IF EXISTS trg_proveedores_updated_at ON public.proveedores;
DROP TRIGGER IF EXISTS trg_empleados_updated_at ON public.empleados;
DROP TRIGGER IF EXISTS trg_equipos_updated_at ON public.equipos;
DROP TRIGGER IF EXISTS trg_transacciones_updated_at ON public.transacciones;

DROP FUNCTION IF EXISTS public.fn_auto_movimiento_recepcion() CASCADE;
DROP FUNCTION IF EXISTS public.user_owns_equipo(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.fn_set_updated_at() CASCADE;

DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.device_tokens CASCADE;
DROP TABLE IF EXISTS public.ocr_documentos CASCADE;
DROP TABLE IF EXISTS public.notificaciones CASCADE;
DROP TABLE IF EXISTS public.transacciones_recurrentes CASCADE;
DROP TABLE IF EXISTS public.movimientos_caja CASCADE;
DROP TABLE IF EXISTS public.caja_proyecto CASCADE;
DROP TABLE IF EXISTS public.partidas_conciliacion CASCADE;
DROP TABLE IF EXISTS public.conciliaciones CASCADE;
DROP TABLE IF EXISTS public.checklist_items CASCADE;
DROP TABLE IF EXISTS public.actividades CASCADE;
DROP TABLE IF EXISTS public.bitacora_avance CASCADE;
DROP TABLE IF EXISTS public.cambios_presupuesto CASCADE;
DROP TABLE IF EXISTS public.transacciones CASCADE;
DROP TABLE IF EXISTS public.recepcion_oc_items CASCADE;
DROP TABLE IF EXISTS public.recepcion_oc CASCADE;
DROP TABLE IF EXISTS public.orden_compra_items CASCADE;
DROP TABLE IF EXISTS public.ordenes_compra CASCADE;
DROP TABLE IF EXISTS public.movimientos_materiales CASCADE;
DROP TABLE IF EXISTS public.subrenglon_equipos CASCADE;
DROP TABLE IF EXISTS public.subrenglon_mano_obra CASCADE;
DROP TABLE IF EXISTS public.subrenglon_materiales CASCADE;
DROP TABLE IF EXISTS public.subrenglones CASCADE;
DROP TABLE IF EXISTS public.renglon_precios_historial CASCADE;
DROP TABLE IF EXISTS public.renglon_usage CASCADE;
DROP TABLE IF EXISTS public.materiales_proyecto CASCADE;
DROP TABLE IF EXISTS public.equipo_miembros CASCADE;
DROP TABLE IF EXISTS public.equipos CASCADE;
DROP TABLE IF EXISTS public.empleados CASCADE;
DROP TABLE IF EXISTS public.proveedores CASCADE;
DROP TABLE IF EXISTS public.presupuestos CASCADE;
DROP TABLE IF EXISTS public.renglones CASCADE;
DROP TABLE IF EXISTS public.proyectos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;

-- =====================================================================
-- FASE 1: EXTENSIONES
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- FASE 2: FUNCIONES BASE
-- =====================================================================

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.fn_auto_movimiento_recepcion()
RETURNS TRIGGER AS $$
DECLARE
  v_proyecto_id uuid;
  v_material_id  uuid;
BEGIN
  SELECT oc.proyecto_id, oci.material_id INTO v_proyecto_id, v_material_id
  FROM public.recepcion_oc ro
  JOIN public.ordenes_compra oc ON ro.orden_compra_id = oc.id
  JOIN public.orden_compra_items oci ON oc.id = oci.orden_compra_id
  WHERE ro.id = NEW.recepcion_id AND oci.id = NEW.orden_compra_item_id;

  IF v_proyecto_id IS NOT NULL AND v_material_id IS NOT NULL THEN
    INSERT INTO public.movimientos_materiales (
      proyecto_id, material_id, tipo, cantidad, usuario_id, observaciones
    ) VALUES (
      v_proyecto_id, v_material_id, 'entrada', NEW.cantidad_recibida, NULL,
      'Recepción automática de OC'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.user_owns_equipo(equipo_id uuid)
RETURNS boolean SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.equipos WHERE id = equipo_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- FASE 3: TABLAS (orden respetando dependencias FK estrictas)
-- =====================================================================

-- 3.1. clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono text,
  email text,
  direccion text,
  tipo_proyecto text DEFAULT 'Residencial',
  estado text DEFAULT 'Potencial',
  notas text,
  fecha date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.2. proyectos
CREATE TABLE IF NOT EXISTS public.proyectos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  cliente text,
  tipo text,
  estado text DEFAULT 'Planeación',
  presupuesto_total numeric DEFAULT 0,
  avance_fisico numeric DEFAULT 0,
  avance_financiero numeric DEFAULT 0,
  ingresos numeric DEFAULT 0,
  gastos numeric DEFAULT 0,
  pendiente_aportar numeric DEFAULT 0,
  fecha_inicio date,
  fecha_fin date,
  fase text,
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_proyectos_updated_at BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.3. proveedores
CREATE TABLE IF NOT EXISTS public.proveedores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  contacto text,
  telefono text,
  email text,
  direccion text,
  rfc text,
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_proveedores_updated_at BEFORE UPDATE ON public.proveedores FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.4. empleados
CREATE TABLE IF NOT EXISTS public.empleados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  documento text,
  telefono text,
  correo text,
  cargo text,
  salario_diario numeric,
  estado text DEFAULT 'activo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_empleados_updated_at BEFORE UPDATE ON public.empleados FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.5. renglones
CREATE TABLE IF NOT EXISTS public.renglones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo text NOT NULL UNIQUE,
  descripcion text NOT NULL,
  tipo_renglon text CHECK (tipo_renglon IN ('material','mano_obra','herramienta','transporte','otro')),
  unidad text,
  rendimiento numeric DEFAULT 1,
  costo_material numeric DEFAULT 0,
  costo_mano_obra numeric DEFAULT 0,
  costo_herramienta numeric DEFAULT 0,
  subrenglones jsonb DEFAULT '[]'::jsonb,
  materiales jsonb DEFAULT '[]'::jsonb,
  mano_obra jsonb DEFAULT '[]'::jsonb,
  equipos jsonb DEFAULT '[]'::jsonb,
  categoria text,
  etiquetas jsonb DEFAULT '[]'::jsonb,
  tipologia text,
  estimacion_tiempo numeric,
  dificultad text CHECK (dificultad IN ('baja','media','alta')),
  equipo_requerido jsonb DEFAULT '[]'::jsonb,
  notas text,
  favorito boolean DEFAULT false,
  frecuencia_uso numeric DEFAULT 0,
  ultimo_uso timestamptz,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_renglones_updated_at BEFORE UPDATE ON public.renglones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.6. presupuestos
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE CASCADE,
  proyecto text NOT NULL,
  cliente text,
  ubicacion text,
  tipologia text,
  fase text,
  factor_indirectos numeric,
  factor_administrativos numeric,
  factor_imprevistos numeric,
  factor_utilidad numeric,
  lineas jsonb,
  avance_fisico numeric,
  avance_financiero numeric,
  ingresos numeric,
  gastos numeric,
  pendiente_aportar numeric,
  total numeric,
  costo_directo numeric,
  area_construccion numeric DEFAULT 0,
  nivel_calidad text DEFAULT 'basico',
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_presupuestos_updated_at BEFORE UPDATE ON public.presupuestos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.7. equipos
CREATE TABLE IF NOT EXISTS public.equipos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  descripcion text,
  miembros_count integer DEFAULT 0,
  estado text DEFAULT 'activo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_equipos_updated_at BEFORE UPDATE ON public.equipos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.8. equipo_miembros
CREATE TABLE IF NOT EXISTS public.equipo_miembros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipo_id uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text DEFAULT 'miembro',
  created_at timestamptz DEFAULT now(),
  UNIQUE(equipo_id, user_id)
);

-- 3.9. materiales_proyecto
CREATE TABLE IF NOT EXISTS public.materiales_proyecto (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  unidad text,
  cantidad numeric DEFAULT 0,
  costo_unitario numeric DEFAULT 0,
  proveedor_id uuid,
  estado text DEFAULT 'disponible',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_materiales_proyecto_updated_at BEFORE UPDATE ON public.materiales_proyecto FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.10. renglon_usage
CREATE TABLE IF NOT EXISTS public.renglon_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  renglon_id uuid NOT NULL REFERENCES public.renglones(id) ON DELETE CASCADE,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_renglon_usage_renglon_id ON public.renglon_usage(renglon_id);
CREATE INDEX IF NOT EXISTS idx_renglon_usage_presupuesto_id ON public.renglon_usage(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_renglon_usage_user_id ON public.renglon_usage(user_id);

-- 3.11. renglon_precios_historial
CREATE TABLE IF NOT EXISTS public.renglon_precios_historial (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  renglon_id uuid NOT NULL REFERENCES public.renglones(id) ON DELETE CASCADE,
  costo_material numeric DEFAULT 0,
  costo_mano_obra numeric DEFAULT 0,
  costo_herramienta numeric DEFAULT 0,
  costo_anterior numeric,
  costo_nuevo numeric,
  variacion numeric DEFAULT 0,
  fecha_cambio timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rph_renglon_id ON public.renglon_precios_historial(renglon_id);

-- 3.12. subrenglones
CREATE TABLE IF NOT EXISTS public.subrenglones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  renglon_id uuid REFERENCES public.renglones(id) ON DELETE SET NULL,
  numero_linea integer,
  codigo text,
  renglon_codigo text,
  descripcion text NOT NULL,
  unidad text,
  rendimiento numeric,
  cantidad numeric,
  costo_material numeric DEFAULT 0,
  costo_mano_obra numeric DEFAULT 0,
  costo_herramienta numeric DEFAULT 0,
  costo_equipos numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_subrenglones_updated_at BEFORE UPDATE ON public.subrenglones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_subrenglones_presupuesto_id ON public.subrenglones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_subrenglones_renglon_id ON public.subrenglones(renglon_id);

-- 3.13. subrenglon_materiales
CREATE TABLE IF NOT EXISTS public.subrenglon_materiales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subrenglon_id uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materiales_proyecto(id) ON DELETE SET NULL,
  nombre text,
  unidad text DEFAULT 'unidad',
  cantidad numeric DEFAULT 0,
  costo_unitario numeric DEFAULT 0,
  desperdicio numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_srm_subrenglon_id ON public.subrenglon_materiales(subrenglon_id);
CREATE INDEX IF NOT EXISTS idx_srm_material_id ON public.subrenglon_materiales(material_id);

-- 3.14. subrenglon_mano_obra
CREATE TABLE IF NOT EXISTS public.subrenglon_mano_obra (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subrenglon_id uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  cantidad_personas numeric DEFAULT 1,
  jornal numeric DEFAULT 0,
  rendimiento_especifico numeric,
  costo_por_dia numeric DEFAULT 0,
  costo_por_unidad numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smo_subrenglon_id ON public.subrenglon_mano_obra(subrenglon_id);

-- 3.15. subrenglon_equipos
CREATE TABLE IF NOT EXISTS public.subrenglon_equipos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subrenglon_id uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  equipo_id uuid REFERENCES public.equipos(id) ON DELETE SET NULL,
  descripcion text NOT NULL,
  cantidad numeric DEFAULT 1,
  costo_hora numeric DEFAULT 0,
  horas_uso numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sre_subrenglon_id ON public.subrenglon_equipos(subrenglon_id);

-- 3.16. movimientos_materiales
CREATE TABLE IF NOT EXISTS public.movimientos_materiales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materiales_proyecto(id) ON DELETE CASCADE,
  subrenglon_id uuid REFERENCES public.subrenglones(id) ON DELETE SET NULL,
  tipo text CHECK (tipo IN ('entrada','salida','ajuste')),
  cantidad numeric NOT NULL,
  usuario_id uuid REFERENCES auth.users(id),
  observaciones text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_materiales_proyecto_id ON public.movimientos_materiales(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_materiales_presupuesto_id ON public.movimientos_materiales(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_materiales_material_id ON public.movimientos_materiales(material_id);

-- 3.17. ordenes_compra
CREATE TABLE IF NOT EXISTS public.ordenes_compra (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folio text NOT NULL UNIQUE,
  proveedor_id uuid NOT NULL REFERENCES public.proveedores(id) ON DELETE RESTRICT,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  fecha_emision date DEFAULT CURRENT_DATE,
  fecha_entrega date,
  estatus text DEFAULT 'pendiente' CHECK (estatus IN ('pendiente','aprobada','recibida_parcial','recibida','cancelada')),
  subtotal numeric(12,2) DEFAULT 0,
  iva numeric(12,2) DEFAULT 0,
  total numeric(12,2) DEFAULT 0,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_ordenes_compra_updated_at BEFORE UPDATE ON public.ordenes_compra FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ordenes_compra_user_id ON public.ordenes_compra(user_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proyecto_id ON public.ordenes_compra(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor_id ON public.ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estatus ON public.ordenes_compra(estatus);

-- 3.18. orden_compra_items
CREATE TABLE IF NOT EXISTS public.orden_compra_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_compra_id uuid NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materiales_proyecto(id) ON DELETE SET NULL,
  descripcion text NOT NULL,
  cantidad numeric(12,2) NOT NULL,
  unidad text DEFAULT 'pza',
  precio_unitario numeric(12,2) DEFAULT 0,
  importe numeric(12,2) DEFAULT 0,
  cantidad_recibida numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orden_compra_items_orden_compra_id ON public.orden_compra_items(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_orden_compra_items_material_id ON public.orden_compra_items(material_id);

-- 3.19. recepcion_oc
CREATE TABLE IF NOT EXISTS public.recepcion_oc (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_compra_id uuid NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha_recepcion date DEFAULT CURRENT_DATE,
  observaciones text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recepcion_oc_orden_compra_id ON public.recepcion_oc(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_recepcion_oc_user_id ON public.recepcion_oc(user_id);

-- 3.20. recepcion_oc_items
CREATE TABLE IF NOT EXISTS public.recepcion_oc_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recepcion_id uuid NOT NULL REFERENCES public.recepcion_oc(id) ON DELETE CASCADE,
  orden_compra_item_id uuid NOT NULL REFERENCES public.orden_compra_items(id) ON DELETE CASCADE,
  cantidad_recibida numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_auto_movimiento_recepcion AFTER INSERT ON public.recepcion_oc_items FOR EACH ROW EXECUTE FUNCTION public.fn_auto_movimiento_recepcion();

-- 3.21. transacciones
CREATE TABLE IF NOT EXISTS public.transacciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL,
  empleado_id uuid REFERENCES public.empleados(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('ingreso','gasto')),
  categoria text,
  descripcion text,
  cantidad numeric DEFAULT 1,
  unidad text,
  costo_unitario numeric DEFAULT 0,
  costo_total numeric DEFAULT 0,
  fecha date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_transacciones_updated_at BEFORE UPDATE ON public.transacciones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_transacciones_user_id ON public.transacciones(user_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_proyecto_id ON public.transacciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_presupuesto_id ON public.transacciones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON public.transacciones(fecha DESC);

-- 3.22. cambios_presupuesto
CREATE TABLE IF NOT EXISTS public.cambios_presupuesto (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id),
  version integer NOT NULL DEFAULT 1,
  descripcion text,
  cambios jsonb DEFAULT '[]'::jsonb,
  motivo text DEFAULT '',
  aprobado_por uuid REFERENCES auth.users(id),
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_cambios_presupuesto_updated_at BEFORE UPDATE ON public.cambios_presupuesto FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_cambios_presupuesto_presupuesto_id ON public.cambios_presupuesto(presupuesto_id);

-- 3.23. bitacora_avance
CREATE TABLE IF NOT EXISTS public.bitacora_avance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  usuario_id uuid REFERENCES auth.users(id),
  fase text,
  descripcion text,
  avance_porcentaje numeric,
  foto_url text,
  recursos_usados jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bitacora_presupuesto_id ON public.bitacora_avance(presupuesto_id);

-- 3.24. actividades
CREATE TABLE IF NOT EXISTS public.actividades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  usuario_id uuid REFERENCES auth.users(id),
  titulo text NOT NULL,
  descripcion text,
  estado text DEFAULT 'pendiente',
  prioridad text DEFAULT 'media',
  fecha_vencimiento date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_actividades_updated_at BEFORE UPDATE ON public.actividades FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_actividades_presupuesto_id ON public.actividades(presupuesto_id);

-- 3.25. checklist_items
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  fase text NOT NULL CHECK (fase IN ('planeación','ejecución','pausa','finalizado')),
  item text NOT NULL,
  completado boolean DEFAULT false,
  foto_url text,
  completado_por uuid REFERENCES auth.users(id),
  completado_en timestamptz,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_presupuesto_id ON public.checklist_items(presupuesto_id);

-- 3.26. conciliaciones
CREATE TABLE IF NOT EXISTS public.conciliaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banco text NOT NULL,
  periodo text,
  saldo_libros numeric DEFAULT 0,
  saldo_banco numeric DEFAULT 0,
  diferencia numeric DEFAULT 0,
  conciliado boolean DEFAULT false,
  notas text,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_conciliaciones_updated_at BEFORE UPDATE ON public.conciliaciones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_conciliaciones_user_id ON public.conciliaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_proyecto_id ON public.conciliaciones(proyecto_id);

-- 3.27. partidas_conciliacion
CREATE TABLE IF NOT EXISTS public.partidas_conciliacion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  conciliacion_id uuid NOT NULL REFERENCES public.conciliaciones(id) ON DELETE CASCADE,
  tipo text CHECK (tipo IN ('pendiente_libros','pendiente_banco','ajuste')),
  monto numeric NOT NULL,
  descripcion text,
  fecha date,
  aplicado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partidas_conciliacion_conciliacion_id ON public.partidas_conciliacion(conciliacion_id);

-- 3.28. caja_proyecto
CREATE TABLE IF NOT EXISTS public.caja_proyecto (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id uuid UNIQUE NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saldo_inicial numeric DEFAULT 0,
  saldo_sistema_actual numeric DEFAULT 0,
  saldo_real_actual numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_caja_proyecto_updated_at BEFORE UPDATE ON public.caja_proyecto FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_caja_proyecto_proyecto_id ON public.caja_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_caja_proyecto_user_id ON public.caja_proyecto(user_id);

-- 3.29. movimientos_caja
CREATE TABLE IF NOT EXISTS public.movimientos_caja (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caja_id uuid NOT NULL REFERENCES public.caja_proyecto(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  descripcion text NOT NULL,
  subtipo text NOT NULL,
  concepto text,
  monto numeric NOT NULL,
  saldo_sistema_antes numeric NOT NULL,
  saldo_sistema_despues numeric NOT NULL,
  saldo_real_confirmado numeric,
  diferencia numeric,
  conciliado_fecha timestamptz,
  motivo_diferencia text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_movimientos_caja_updated_at BEFORE UPDATE ON public.movimientos_caja FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_movimientos_caja_caja_id ON public.movimientos_caja(caja_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_user_id ON public.movimientos_caja(user_id);

-- 3.30. transacciones_recurrentes
CREATE TABLE IF NOT EXISTS public.transacciones_recurrentes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  tipo text NOT NULL,
  monto numeric NOT NULL,
  frecuencia text NOT NULL,
  activa boolean DEFAULT true,
  proxima_fecha date,
  ultima_fecha date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_transacciones_recurrentes_updated_at BEFORE UPDATE ON public.transacciones_recurrentes FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tr_recurrentes_presupuesto ON public.transacciones_recurrentes(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_tr_recurrentes_user_id ON public.transacciones_recurrentes(user_id);

-- 3.31. notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('info','alerta','exito','warning')),
  titulo text NOT NULL,
  mensaje text,
  leido boolean DEFAULT false,
  accion_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_notificaciones_updated_at BEFORE UPDATE ON public.notificaciones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON public.notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido ON public.notificaciones(leido);

-- 3.32. ocr_documentos
CREATE TABLE IF NOT EXISTS public.ocr_documentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text,
  ocr_data jsonb,
  status text DEFAULT 'pending',
  nombre_archivo text,
  url_documento text,
  texto_extraido text,
  datos_json jsonb,
  estado text DEFAULT 'pendiente',
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  proveedor text,
  monto numeric(12,2),
  fecha_factura date,
  notas text,
  revisado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ocr_documentos_user_id ON public.ocr_documentos(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_documentos_proyecto_id ON public.ocr_documentos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ocr_status ON public.ocr_documentos(status);

-- 3.33. device_tokens
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);

-- 3.34. audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tabla text,
  operacion text CHECK (operacion IN ('INSERT','UPDATE','DELETE')),
  registro_id uuid,
  valores_anteriores jsonb,
  valores_nuevos jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_registro_id ON public.audit_log(registro_id);

-- =====================================================================
-- FASE 4: INDICES RESTANTES
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_renglones_codigo ON public.renglones(codigo);
CREATE INDEX IF NOT EXISTS idx_renglones_categoria ON public.renglones(categoria);
CREATE INDEX IF NOT EXISTS idx_renglones_user_id ON public.renglones(user_id);
CREATE INDEX IF NOT EXISTS idx_materiales_proyecto_proyecto_id ON public.materiales_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_materiales_proyecto_presupuesto_id ON public.materiales_proyecto(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_equipos_user_id ON public.equipos(user_id);
CREATE INDEX IF NOT EXISTS idx_equipos_proyecto_id ON public.equipos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_equipo_miembros_equipo_id ON public.equipo_miembros(equipo_id);
CREATE INDEX IF NOT EXISTS idx_equipo_miembros_user_id ON public.equipo_miembros(user_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_user_id ON public.proveedores(user_id);
CREATE INDEX IF NOT EXISTS idx_empleados_user_id ON public.empleados(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_user_id ON public.proyectos(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_user_id ON public.presupuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto_id ON public.presupuestos(proyecto_id);

-- =====================================================================
-- FASE 5: HABILITAR RLS
-- =====================================================================

ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.renglon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.renglon_precios_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subrenglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subrenglon_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subrenglon_mano_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subrenglon_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.materiales_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movimientos_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orden_compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recepcion_oc ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recepcion_oc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cambios_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bitacora_avance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conciliaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partidas_conciliacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.caja_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transacciones_recurrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipo_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ocr_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- FASE 6: POLITICAS RLS
-- =====================================================================

-- 6.1. CLIENTES
CREATE POLICY "clientes_select" ON public.clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clientes_insert" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clientes_update" ON public.clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clientes_delete" ON public.clientes FOR DELETE USING (auth.uid() = user_id);

-- 6.2. PROYECTOS
CREATE POLICY "proyectos_select" ON public.proyectos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "proyectos_insert" ON public.proyectos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proyectos_update" ON public.proyectos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "proyectos_delete" ON public.proyectos FOR DELETE USING (auth.uid() = user_id);

-- 6.3. PRESUPUESTOS
CREATE POLICY "presupuestos_select" ON public.presupuestos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "presupuestos_insert" ON public.presupuestos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "presupuestos_update" ON public.presupuestos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "presupuestos_delete" ON public.presupuestos FOR DELETE USING (auth.uid() = user_id);

-- 6.4. RENGLONES
CREATE POLICY "renglones_select" ON public.renglones FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "renglones_insert" ON public.renglones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "renglones_update" ON public.renglones FOR UPDATE USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "renglones_delete" ON public.renglones FOR DELETE USING (user_id IS NULL OR auth.uid() = user_id);

-- 6.5. RENGLON_USAGE
CREATE POLICY "renglon_usage_select" ON public.renglon_usage FOR SELECT USING (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "renglon_usage_insert" ON public.renglon_usage FOR INSERT WITH CHECK (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);

-- 6.6. RENGLON_PRECIOS_HISTORIAL
CREATE POLICY "rph_select" ON public.renglon_precios_historial FOR SELECT USING (
  renglon_id IN (SELECT id FROM public.renglones WHERE user_id IS NULL OR user_id = auth.uid())
);
CREATE POLICY "rph_insert" ON public.renglon_precios_historial FOR INSERT WITH CHECK (
  renglon_id IN (SELECT id FROM public.renglones WHERE user_id IS NULL OR user_id = auth.uid())
);
CREATE POLICY "rph_update" ON public.renglon_precios_historial FOR UPDATE USING (
  renglon_id IN (SELECT id FROM public.renglones WHERE user_id IS NULL OR user_id = auth.uid())
);
CREATE POLICY "rph_delete" ON public.renglon_precios_historial FOR DELETE USING (
  renglon_id IN (SELECT id FROM public.renglones WHERE user_id IS NULL OR user_id = auth.uid())
);

-- 6.7. SUBRENGLONES
CREATE POLICY "sr_select" ON public.subrenglones FOR SELECT USING (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "sr_insert" ON public.subrenglones FOR INSERT WITH CHECK (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "sr_update" ON public.subrenglones FOR UPDATE USING (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "sr_delete" ON public.subrenglones FOR DELETE USING (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);

-- 6.8. SUBRENGLON_MATERIALES
CREATE POLICY "srm_select" ON public.subrenglon_materiales FOR SELECT USING (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "srm_insert" ON public.subrenglon_materiales FOR INSERT WITH CHECK (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "srm_update" ON public.subrenglon_materiales FOR UPDATE USING (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "srm_delete" ON public.subrenglon_materiales FOR DELETE USING (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);

-- 6.9. SUBRENGLON_MANO_OBRA
CREATE POLICY "smo_select" ON public.subrenglon_mano_obra FOR SELECT USING (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "smo_insert" ON public.subrenglon_mano_obra FOR INSERT WITH CHECK (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "smo_update" ON public.subrenglon_mano_obra FOR UPDATE USING (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "smo_delete" ON public.subrenglon_mano_obra FOR DELETE USING (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);

-- 6.10. SUBRENGLON_EQUIPOS
CREATE POLICY "sre_select" ON public.subrenglon_equipos FOR SELECT USING (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "sre_insert" ON public.subrenglon_equipos FOR INSERT WITH CHECK (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "sre_update" ON public.subrenglon_equipos FOR UPDATE USING (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "sre_delete" ON public.subrenglon_equipos FOR DELETE USING (
  subrenglon_id IN (SELECT id FROM public.subrenglones WHERE presupuesto_id IN (
    SELECT id FROM public.presupuestos WHERE user_id = auth.uid()
  ))
);

-- 6.11. MATERIALES_PROYECTO
CREATE POLICY "materiales_select" ON public.materiales_proyecto FOR SELECT USING (
  auth.uid() = user_id OR
  proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid()) OR
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "materiales_insert" ON public.materiales_proyecto FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid()) OR
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "materiales_update" ON public.materiales_proyecto FOR UPDATE USING (
  auth.uid() = user_id OR
  proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid()) OR
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);

-- 6.12. MOVIMIENTOS_MATERIALES
CREATE POLICY "movimientos_select" ON public.movimientos_materiales FOR SELECT USING (
  proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
);
CREATE POLICY "movimientos_insert" ON public.movimientos_materiales FOR INSERT WITH CHECK (
  proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
);
CREATE POLICY "movimientos_update" ON public.movimientos_materiales FOR UPDATE USING (
  proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
);
CREATE POLICY "movimientos_delete" ON public.movimientos_materiales FOR DELETE USING (
  proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
);

-- 6.13. ORDENES_COMPRA
CREATE POLICY "oc_select" ON public.ordenes_compra FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "oc_insert" ON public.ordenes_compra FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oc_update" ON public.ordenes_compra FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "oc_delete" ON public.ordenes_compra FOR DELETE USING (auth.uid() = user_id);

-- 6.14. ORDEN_COMPRA_ITEMS
CREATE POLICY "oci_select" ON public.orden_compra_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_compra_id AND oc.user_id = auth.uid())
);
CREATE POLICY "oci_insert" ON public.orden_compra_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_compra_id AND oc.user_id = auth.uid())
);
CREATE POLICY "oci_update" ON public.orden_compra_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_compra_id AND oc.user_id = auth.uid())
);
CREATE POLICY "oci_delete" ON public.orden_compra_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.ordenes_compra oc WHERE oc.id = orden_compra_id AND oc.user_id = auth.uid())
);

-- 6.15. RECEPCION_OC
CREATE POLICY "rec_select" ON public.recepcion_oc FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rec_insert" ON public.recepcion_oc FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rec_update" ON public.recepcion_oc FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rec_delete" ON public.recepcion_oc FOR DELETE USING (auth.uid() = user_id);

-- 6.16. RECEPCION_OC_ITEMS
CREATE POLICY "reci_select" ON public.recepcion_oc_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.recepcion_oc r WHERE r.id = recepcion_id AND r.user_id = auth.uid())
);
CREATE POLICY "reci_insert" ON public.recepcion_oc_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.recepcion_oc r WHERE r.id = recepcion_id AND r.user_id = auth.uid())
);
CREATE POLICY "reci_update" ON public.recepcion_oc_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.recepcion_oc r WHERE r.id = recepcion_id AND r.user_id = auth.uid())
);
CREATE POLICY "reci_delete" ON public.recepcion_oc_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.recepcion_oc r WHERE r.id = recepcion_id AND r.user_id = auth.uid())
);

-- 6.17. TRANSACCIONES
CREATE POLICY "transacciones_select" ON public.transacciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transacciones_insert" ON public.transacciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transacciones_delete" ON public.transacciones FOR DELETE USING (auth.uid() = user_id);

-- 6.18. CAMBIOS_PRESUPUESTO
CREATE POLICY "cambios_select" ON public.cambios_presupuesto FOR SELECT USING (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "cambios_insert" ON public.cambios_presupuesto FOR INSERT WITH CHECK (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()) AND
  usuario_id = auth.uid()
);
CREATE POLICY "cambios_update" ON public.cambios_presupuesto FOR UPDATE USING (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);

-- 6.19. BITACORA_AVANCE
CREATE POLICY "bitacora_select" ON public.bitacora_avance FOR SELECT USING (
  auth.uid() = user_id OR
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()) OR
  proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
);
CREATE POLICY "bitacora_insert" ON public.bitacora_avance FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()) OR
  proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
);

-- 6.20. ACTIVIDADES
CREATE POLICY "actividades_select" ON public.actividades FOR SELECT USING (
  auth.uid() = user_id OR
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "actividades_insert" ON public.actividades FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "actividades_update" ON public.actividades FOR UPDATE USING (
  auth.uid() = user_id OR
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "actividades_delete" ON public.actividades FOR DELETE USING (
  auth.uid() = user_id OR
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);

-- 6.21. CHECKLIST_ITEMS
CREATE POLICY "checklist_select" ON public.checklist_items FOR SELECT USING (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "checklist_insert" ON public.checklist_items FOR INSERT WITH CHECK (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "checklist_update" ON public.checklist_items FOR UPDATE USING (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "checklist_delete" ON public.checklist_items FOR DELETE USING (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);

-- 6.22. CONCILIACIONES
CREATE POLICY "conc_select" ON public.conciliaciones FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "conc_insert" ON public.conciliaciones FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "conc_update" ON public.conciliaciones FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "conc_delete" ON public.conciliaciones FOR DELETE USING (user_id = auth.uid());

-- 6.23. PARTIDAS_CONCILIACION
CREATE POLICY "part_select" ON public.partidas_conciliacion FOR SELECT USING (
  conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid())
);
CREATE POLICY "part_insert" ON public.partidas_conciliacion FOR INSERT WITH CHECK (
  conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid())
);
CREATE POLICY "part_update" ON public.partidas_conciliacion FOR UPDATE USING (
  conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid())
);
CREATE POLICY "part_delete" ON public.partidas_conciliacion FOR DELETE USING (
  conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid())
);

-- 6.24. CAJA_PROYECTO
CREATE POLICY "caja_select" ON public.caja_proyecto FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "caja_insert" ON public.caja_proyecto FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "caja_update" ON public.caja_proyecto FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "caja_delete" ON public.caja_proyecto FOR DELETE USING (user_id = auth.uid());

-- 6.25. MOVIMIENTOS_CAJA
CREATE POLICY "mc_select" ON public.movimientos_caja FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "mc_insert" ON public.movimientos_caja FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "mc_update" ON public.movimientos_caja FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "mc_delete" ON public.movimientos_caja FOR DELETE USING (user_id = auth.uid());

-- 6.26. TRANSACCIONES_RECURRENTES
CREATE POLICY "tr_select" ON public.transacciones_recurrentes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tr_insert" ON public.transacciones_recurrentes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tr_update" ON public.transacciones_recurrentes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "tr_delete" ON public.transacciones_recurrentes FOR DELETE USING (user_id = auth.uid());

-- 6.27. EQUIPOS
CREATE POLICY "equipos_select" ON public.equipos FOR SELECT USING (
  auth.uid() = user_id OR public.user_owns_equipo(id)
);
CREATE POLICY "equipos_insert" ON public.equipos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "equipos_update" ON public.equipos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "equipos_delete" ON public.equipos FOR DELETE USING (auth.uid() = user_id);

-- 6.28. EQUIPO_MIEMBROS
CREATE POLICY "em_select" ON public.equipo_miembros FOR SELECT USING (
  auth.uid() = user_id OR public.user_owns_equipo(equipo_id)
);
CREATE POLICY "em_insert" ON public.equipo_miembros FOR INSERT WITH CHECK (public.user_owns_equipo(equipo_id));
CREATE POLICY "em_delete" ON public.equipo_miembros FOR DELETE USING (public.user_owns_equipo(equipo_id));
CREATE POLICY "em_update" ON public.equipo_miembros FOR UPDATE USING (public.user_owns_equipo(equipo_id));

-- 6.29. PROVEEDORES
CREATE POLICY "proveedores_select" ON public.proveedores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "proveedores_insert" ON public.proveedores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proveedores_update" ON public.proveedores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "proveedores_delete" ON public.proveedores FOR DELETE USING (auth.uid() = user_id);

-- 6.30. EMPLEADOS
CREATE POLICY "empleados_select" ON public.empleados FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "empleados_insert" ON public.empleados FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "empleados_update" ON public.empleados FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "empleados_delete" ON public.empleados FOR DELETE USING (auth.uid() = user_id);

-- 6.31. NOTIFICACIONES
CREATE POLICY "notif_select" ON public.notificaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON public.notificaciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_update" ON public.notificaciones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_delete" ON public.notificaciones FOR DELETE USING (auth.uid() = user_id);

-- 6.32. DEVICE_TOKENS
CREATE POLICY "dt_select" ON public.device_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dt_insert" ON public.device_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dt_delete" ON public.device_tokens FOR DELETE USING (auth.uid() = user_id);

-- 6.33. OCR_DOCUMENTOS
CREATE POLICY "ocr_select" ON public.ocr_documentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ocr_insert" ON public.ocr_documentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ocr_update" ON public.ocr_documentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ocr_delete" ON public.ocr_documentos FOR DELETE USING (auth.uid() = user_id);

-- 6.34. AUDIT_LOG
CREATE POLICY "al_select" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);

-- =====================================================================
-- FIN
-- =====================================================================
