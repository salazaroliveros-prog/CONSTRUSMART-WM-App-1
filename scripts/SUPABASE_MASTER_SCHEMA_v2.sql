-- =====================================================================
-- SUPABASE_MASTER_SCHEMA_v2.sql
-- Esquema Completo y Correctivo - CONSTRUSMART WM
-- 
-- ARCHIVO MAESTRO ÚNICO - Reemplaza todos los scripts anteriores
-- 
-- Orden de ejecución:
--   1. Ejecutar COMPLETAMENTE este script
--   2. Generar tipos TypeScript: supabase gen types typescript --local
--   3. Actualizar AppContext y servicios
-- 
-- Última actualización: 28 de Mayo de 2026
-- Versión: 2.0
-- =====================================================================

-- =====================================================================
-- FASE 0: LIMPIEZA SEGURA (DROP con IF EXISTS)
-- =====================================================================

-- Eliminar triggers primero (requieren la función)
DROP TRIGGER IF EXISTS trg_auto_movimiento_recepcion ON public.recepcion_oc_items;
DROP TRIGGER IF EXISTS trg_presupuestos_updated_at ON public.presupuestos;
DROP TRIGGER IF EXISTS trg_proveedores_updated_at ON public.proveedores;
DROP TRIGGER IF EXISTS trg_ordenes_compra_updated_at ON public.ordenes_compra;

-- Eliminar funciones
DROP FUNCTION IF EXISTS public.fn_auto_movimiento_recepcion();
DROP FUNCTION IF EXISTS public.fn_set_updated_at();
DROP FUNCTION IF EXISTS public.user_owns_equipo(uuid);

-- Eliminar políticas RLS
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;

DROP POLICY IF EXISTS "proyectos_select" ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_insert" ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_update" ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_delete" ON public.proyectos;

DROP POLICY IF EXISTS "presupuestos_select" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_insert" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_update" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_delete" ON public.presupuestos;

DROP POLICY IF EXISTS "transacciones_select" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_insert" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_delete" ON public.transacciones;

DROP POLICY IF EXISTS "equipos_select" ON public.equipos;
DROP POLICY IF EXISTS "equipos_insert" ON public.equipos;
DROP POLICY IF EXISTS "equipos_update" ON public.equipos;
DROP POLICY IF EXISTS "equipos_delete" ON public.equipos;

DROP POLICY IF EXISTS "equipo_miembros_select" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_insert" ON public.equipo_miembros;
DROP POLICY IF EXISTS "equipo_miembros_delete" ON public.equipo_miembros;

DROP POLICY IF EXISTS "empleados_select" ON public.empleados;
DROP POLICY IF EXISTS "empleados_insert" ON public.empleados;
DROP POLICY IF EXISTS "empleados_update" ON public.empleados;
DROP POLICY IF EXISTS "empleados_delete" ON public.empleados;

DROP POLICY IF EXISTS "materiales_proyecto_select" ON public.materiales_proyecto;
DROP POLICY IF EXISTS "materiales_proyecto_insert" ON public.materiales_proyecto;
DROP POLICY IF EXISTS "materiales_proyecto_update" ON public.materiales_proyecto;

DROP POLICY IF EXISTS "movimientos_materiales_select" ON public.movimientos_materiales;
DROP POLICY IF EXISTS "movimientos_materiales_insert" ON public.movimientos_materiales;

DROP POLICY IF EXISTS "ordenes_compra_select" ON public.ordenes_compra;
DROP POLICY IF EXISTS "ordenes_compra_insert" ON public.ordenes_compra;
DROP POLICY IF EXISTS "ordenes_compra_update" ON public.ordenes_compra;
DROP POLICY IF EXISTS "ordenes_compra_delete" ON public.ordenes_compra;

DROP POLICY IF EXISTS "proveedores_select" ON public.proveedores;
DROP POLICY IF EXISTS "proveedores_insert" ON public.proveedores;
DROP POLICY IF EXISTS "proveedores_update" ON public.proveedores;
DROP POLICY IF EXISTS "proveedores_delete" ON public.proveedores;

DROP POLICY IF EXISTS "bitacora_avance_select" ON public.bitacora_avance;
DROP POLICY IF EXISTS "bitacora_avance_insert" ON public.bitacora_avance;

DROP POLICY IF EXISTS "actividades_select" ON public.actividades;
DROP POLICY IF EXISTS "actividades_insert" ON public.actividades;
DROP POLICY IF EXISTS "actividades_delete" ON public.actividades;

DROP POLICY IF EXISTS "cambios_presupuesto_select" ON public.cambios_presupuesto;
DROP POLICY IF EXISTS "cambios_presupuesto_insert" ON public.cambios_presupuesto;

DROP POLICY IF EXISTS "notificaciones_select" ON public.notificaciones;
DROP POLICY IF EXISTS "notificaciones_delete" ON public.notificaciones;

DROP POLICY IF EXISTS "device_tokens_select" ON public.device_tokens;
DROP POLICY IF EXISTS "device_tokens_insert" ON public.device_tokens;

DROP POLICY IF EXISTS "ocr_documentos_select" ON public.ocr_documentos;
DROP POLICY IF EXISTS "ocr_documentos_insert" ON public.ocr_documentos;

DROP POLICY IF EXISTS "audit_log_select" ON public.audit_log;

-- Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proyectos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.presupuestos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transacciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipo_miembros DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.materiales_proyecto DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movimientos_materiales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ordenes_compra DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bitacora_avance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.actividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cambios_presupuesto DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.device_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ocr_documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_log DISABLE ROW LEVEL SECURITY;

-- =====================================================================
-- FASE 1: EXTENSIONES
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- FASE 2: FUNCIONES BASE
-- =====================================================================

-- Función trigger para updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar propiedad de equipo (SECURITY DEFINER para recursividad)
CREATE OR REPLACE FUNCTION public.user_owns_equipo(equipo_id uuid)
RETURNS boolean
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.equipos WHERE id = equipo_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- FASE 3: CREACIÓN DE TABLAS (Orden respetando dependencias)
-- =====================================================================

-- 3.1. clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre         text NOT NULL,
  telefono       text,
  email          text,
  direccion      text,
  tipo_proyecto  text DEFAULT 'Residencial',
  estado         text DEFAULT 'Potencial',
  notas          text,
  fecha          date DEFAULT CURRENT_DATE,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- 3.2. proyectos
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
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 3.3. presupuestos
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id           uuid REFERENCES public.proyectos(id) ON DELETE CASCADE,
  proyecto              text NOT NULL,
  cliente               text,
  ubicacion             text,
  tipologia             text,
  fase                  text,
  factor_indirectos     numeric,
  factor_administrativos numeric,
  factor_imprevistos    numeric,
  factor_utilidad       numeric,
  lineas                jsonb,
  avance_fisico         numeric,
  avance_financiero     numeric,
  ingresos              numeric,
  gastos                numeric,
  pendiente_aportar     numeric,
  total                 numeric,
  costo_directo         numeric,
  area_construccion     numeric DEFAULT 0,
  nivel_calidad         text DEFAULT 'basico',
  fecha_inicio          date,
  fecha_fin             date,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TRIGGER trg_presupuestos_updated_at
  BEFORE UPDATE ON public.presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.4. renglones (catálogo base)
CREATE TABLE IF NOT EXISTS public.renglones (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo          text NOT NULL UNIQUE,
  descripcion     text NOT NULL,
  unidad          text,
  rendimiento     numeric DEFAULT 1,
  costoMaterial   numeric DEFAULT 0,
  costoManoObra   numeric DEFAULT 0,
  costoHerramienta numeric DEFAULT 0,
  tipologia       text DEFAULT 'general',
  created_at      timestamptz DEFAULT now()
);

-- 3.5. renglon_usage (registro de uso de renglones)
CREATE TABLE IF NOT EXISTS public.renglon_usage (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id  uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  renglon_id      uuid NOT NULL REFERENCES public.renglones(id) ON DELETE CASCADE,
  cantidad        numeric,
  created_at      timestamptz DEFAULT now()
);

-- 3.6. renglon_precios_historial
CREATE TABLE IF NOT EXISTS public.renglon_precios_historial (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  renglon_id      uuid NOT NULL REFERENCES public.renglones(id) ON DELETE CASCADE,
  costo_anterior  numeric,
  costo_nuevo     numeric,
  fecha_cambio    timestamptz DEFAULT now()
);

-- 3.7. subrenglones (desglose de presupuesto)
CREATE TABLE IF NOT EXISTS public.subrenglones (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id     uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  numero_linea       integer,
  codigo             text,
  descripcion        text,
  unidad             text,
  rendimiento        numeric,
  cantidad           numeric,
  costoMaterial      numeric DEFAULT 0,
  costoManoObra      numeric DEFAULT 0,
  costoHerramienta   numeric DEFAULT 0,
  subtotal           numeric DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

-- 3.8. subrenglon_materiales
CREATE TABLE IF NOT EXISTS public.subrenglon_materiales (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subrenglon_id       uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  nombre              text,
  unidad              text,
  cantidad            numeric,
  costo_unitario      numeric,
  desperdicio         numeric DEFAULT 0,
  subtotal            numeric,
  created_at          timestamptz DEFAULT now()
);

-- 3.9. subrenglon_mano_obra
CREATE TABLE IF NOT EXISTS public.subrenglon_mano_obra (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subrenglon_id        uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  descripcion          text,
  cantidad_personas    numeric,
  jornal               numeric,
  rendimiento_especifico numeric,
  costo_por_dia        numeric,
  costo_por_unidad     numeric,
  created_at           timestamptz DEFAULT now()
);

-- 3.10. subrenglon_equipos (⭐ CORREGIDA: ahora tiene equipo_id)
CREATE TABLE IF NOT EXISTS public.subrenglon_equipos (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subrenglon_id       uuid NOT NULL REFERENCES public.subrenglones(id) ON DELETE CASCADE,
  equipo_id           uuid REFERENCES public.equipos(id) ON DELETE SET NULL,
  descripcion         text,
  cantidad            numeric,
  costo_hora          numeric,
  horas_uso           numeric,
  subtotal            numeric,
  created_at          timestamptz DEFAULT now()
);

-- 3.11. equipos (⭐ CORREGIDO: ahora tiene proyecto_id)
CREATE TABLE IF NOT EXISTS public.equipos (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id       uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  nombre            text NOT NULL,
  descripcion       text,
  miembros_count    integer DEFAULT 0,
  estado            text DEFAULT 'activo',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 3.12. equipo_miembros
CREATE TABLE IF NOT EXISTS public.equipo_miembros (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipo_id      uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol            text,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(equipo_id, user_id)
);

-- 3.13. empleados
CREATE TABLE IF NOT EXISTS public.empleados (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre         text NOT NULL,
  documento      text,
  correo         text,
  telefono       text,
  cargo          text,
  salario_diario numeric,
  estado         text DEFAULT 'activo',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- 3.14. transacciones (⭐ CORREGIDA: ahora tiene presupuesto_id)
CREATE TABLE IF NOT EXISTS public.transacciones (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id   uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL,
  empleado_id      uuid REFERENCES public.empleados(id) ON DELETE SET NULL,
  tipo             text NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  categoria        text,
  descripcion      text,
  cantidad         numeric DEFAULT 1,
  unidad           text,
  valor_unitario   numeric,
  total            numeric,
  fecha            date DEFAULT CURRENT_DATE,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 3.15. materiales_proyecto
CREATE TABLE IF NOT EXISTS public.materiales_proyecto (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id      uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  descripcion      text,
  unidad           text,
  cantidad         numeric DEFAULT 0,
  costo_unitario   numeric DEFAULT 0,
  proveedor_id     uuid,
  estado           text DEFAULT 'disponible',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 3.16. movimientos_materiales
CREATE TABLE IF NOT EXISTS public.movimientos_materiales (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id      uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  material_id      uuid NOT NULL REFERENCES public.materiales_proyecto(id) ON DELETE CASCADE,
  subrenglon_id    uuid REFERENCES public.subrenglones(id) ON DELETE SET NULL,
  tipo             text CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad         numeric NOT NULL,
  usuario_id       uuid REFERENCES auth.users(id),
  observaciones    text,
  created_at       timestamptz DEFAULT now()
);

-- 3.17. cambios_presupuesto (Change Orders)
CREATE TABLE IF NOT EXISTS public.cambios_presupuesto (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id   uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  usuario_id       uuid NOT NULL REFERENCES auth.users(id),
  tipo             text,
  descripcion      text,
  monto            numeric,
  justificacion    text,
  estado           text DEFAULT 'pendiente',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 3.18. bitacora_avance
CREATE TABLE IF NOT EXISTS public.bitacora_avance (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id   uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  proyecto_id      uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  usuario_id       uuid REFERENCES auth.users(id),
  fase             text,
  descripcion      text,
  avance_porcentaje numeric,
  foto_url         text,
  created_at       timestamptz DEFAULT now()
);

-- 3.19. actividades
CREATE TABLE IF NOT EXISTS public.actividades (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id   uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  usuario_id       uuid REFERENCES auth.users(id),
  titulo           text,
  descripcion      text,
  estado           text DEFAULT 'pendiente',
  prioridad        text DEFAULT 'media',
  fecha_vencimiento date,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 3.20. checklist_items
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id   uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  fase             text NOT NULL CHECK (fase IN ('planeación','ejecución','pausa','finalizado')),
  item             text NOT NULL,
  completado       boolean DEFAULT false,
  foto_url         text,
  completado_por   uuid REFERENCES auth.users(id),
  completado_en    timestamptz,
  created_at       timestamptz DEFAULT now()
);

-- 3.21. presupuesto_conciliaciones
CREATE TABLE IF NOT EXISTS public.presupuesto_conciliaciones (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id   uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  usuario_id       uuid NOT NULL REFERENCES auth.users(id),
  fecha            date DEFAULT CURRENT_DATE,
  descripcion      text,
  created_at       timestamptz DEFAULT now()
);

-- 3.22. partidas_conciliacion
CREATE TABLE IF NOT EXISTS public.partidas_conciliacion (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conciliacion_id  uuid NOT NULL REFERENCES public.presupuesto_conciliaciones(id) ON DELETE CASCADE,
  concepto         text,
  valor            numeric,
  created_at       timestamptz DEFAULT now()
);

-- 3.23. notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo             text NOT NULL CHECK (tipo IN ('info', 'alerta', 'exito', 'warning')),
  titulo           text NOT NULL,
  mensaje          text,
  leido            boolean DEFAULT false,
  accion_url       text,
  created_at       timestamptz DEFAULT now()
);

-- 3.24. proveedores
CREATE TABLE IF NOT EXISTS public.proveedores (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  contacto         text,
  telefono         text,
  email            text,
  direccion        text,
  rfc              text,
  notas            text,
  activo           boolean DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 3.25. ordenes_compra
CREATE TABLE IF NOT EXISTS public.ordenes_compra (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folio            text NOT NULL UNIQUE,
  proveedor_id     uuid NOT NULL REFERENCES public.proveedores(id) ON DELETE RESTRICT,
  proyecto_id      uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  fecha_emision    date DEFAULT CURRENT_DATE,
  fecha_entrega    date,
  estatus          text DEFAULT 'pendiente' CHECK (estatus IN ('pendiente', 'aprobada', 'recibida_parcial', 'recibida', 'cancelada')),
  subtotal         numeric(12,2) DEFAULT 0,
  iva              numeric(12,2) DEFAULT 0,
  total            numeric(12,2) DEFAULT 0,
  notas            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TRIGGER trg_ordenes_compra_updated_at
  BEFORE UPDATE ON public.ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.26. orden_compra_items
CREATE TABLE IF NOT EXISTS public.orden_compra_items (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_compra_id  uuid NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  material_id      uuid REFERENCES public.materiales_proyecto(id) ON DELETE SET NULL,
  descripcion      text NOT NULL,
  cantidad         numeric(12,2) NOT NULL,
  unidad           text DEFAULT 'pza',
  precio_unitario  numeric(12,2) DEFAULT 0,
  importe          numeric(12,2) DEFAULT 0,
  cantidad_recibida numeric(12,2) DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- 3.27. recepcion_oc
CREATE TABLE IF NOT EXISTS public.recepcion_oc (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_compra_id  uuid NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha_recepcion  date DEFAULT CURRENT_DATE,
  observaciones    text,
  created_at       timestamptz DEFAULT now()
);

-- 3.28. recepcion_oc_items
CREATE TABLE IF NOT EXISTS public.recepcion_oc_items (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recepcion_id          uuid NOT NULL REFERENCES public.recepcion_oc(id) ON DELETE CASCADE,
  orden_compra_item_id  uuid NOT NULL REFERENCES public.orden_compra_items(id) ON DELETE CASCADE,
  cantidad_recibida     numeric(12,2) NOT NULL,
  created_at            timestamptz DEFAULT now()
);

-- 3.29. device_tokens (Push Notifications)
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token            text NOT NULL UNIQUE,
  created_at       timestamptz DEFAULT now()
);

-- 3.30. ocr_documentos (OCR Facturas)
CREATE TABLE IF NOT EXISTS public.ocr_documentos (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_archivo   text,
  url_documento    text,
  texto_extraido   text,
  datos_json       jsonb,
  estado           text DEFAULT 'procesando',
  created_at       timestamptz DEFAULT now()
);

-- 3.31. audit_log (Auditoría del sistema)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tabla            text,
  operacion        text CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id      uuid,
  valores_anteriores jsonb,
  valores_nuevos   jsonb,
  timestamp        timestamptz DEFAULT now()
);

-- =====================================================================
-- FASE 4: ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_user_id ON public.proyectos(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_user_id ON public.presupuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto_id ON public.presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_subrenglones_presupuesto_id ON public.subrenglones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_renglon_usage_presupuesto_id ON public.renglon_usage(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_user_id ON public.transacciones(user_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_presupuesto_id ON public.transacciones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_equipos_user_id ON public.equipos(user_id);
CREATE INDEX IF NOT EXISTS idx_equipos_proyecto_id ON public.equipos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_equipo_miembros_equipo_id ON public.equipo_miembros(equipo_id);
CREATE INDEX IF NOT EXISTS idx_empleados_user_id ON public.empleados(user_id);
CREATE INDEX IF NOT EXISTS idx_materiales_proyecto_id ON public.materiales_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_materiales_proyecto_id ON public.movimientos_materiales(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_materiales_material_id ON public.movimientos_materiales(material_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_user_id ON public.ordenes_compra(user_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proyecto_id ON public.ordenes_compra(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor_id ON public.ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_orden_compra_items_orden_compra_id ON public.orden_compra_items(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_recepcion_oc_orden_compra_id ON public.recepcion_oc(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_user_id ON public.proveedores(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON public.notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_documentos_user_id ON public.ocr_documentos(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabla ON public.audit_log(tabla);

-- =====================================================================
-- FASE 5: TRIGGERS AVANZADOS
-- =====================================================================

-- Trigger: Auto-crear movimiento de material al recibir OC
CREATE OR REPLACE FUNCTION public.fn_auto_movimiento_recepcion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.movimientos_materiales (
    proyecto_id, 
    material_id, 
    tipo, 
    cantidad, 
    usuario_id, 
    observaciones
  )
  SELECT 
    oc.proyecto_id,
    oci.material_id,
    'entrada' :: text,
    NEW.cantidad_recibida,
    NEW.user_id,
    'Recepción automática de OC: ' || oc.folio
  FROM public.recepcion_oc_items roi
  JOIN public.orden_compra_items oci ON roi.orden_compra_item_id = oci.id
  JOIN public.ordenes_compra oc ON oci.orden_compra_id = oc.id
  WHERE roi.id = NEW.id
    AND oc.proyecto_id IS NOT NULL
    AND oci.material_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_movimiento_recepcion
  AFTER INSERT ON public.recepcion_oc_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_movimiento_recepcion();

-- =====================================================================
-- FASE 6: POLÍTICAS RLS (Row-Level Security)
-- =====================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_avance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cambios_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: clientes
CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "clientes_insert" ON public.clientes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clientes_update" ON public.clientes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "clientes_delete" ON public.clientes
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: proyectos
CREATE POLICY "proyectos_select" ON public.proyectos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "proyectos_insert" ON public.proyectos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "proyectos_update" ON public.proyectos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "proyectos_delete" ON public.proyectos
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: presupuestos
CREATE POLICY "presupuestos_select" ON public.presupuestos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "presupuestos_insert" ON public.presupuestos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "presupuestos_update" ON public.presupuestos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "presupuestos_delete" ON public.presupuestos
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: transacciones
CREATE POLICY "transacciones_select" ON public.transacciones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transacciones_insert" ON public.transacciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transacciones_delete" ON public.transacciones
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: equipos
CREATE POLICY "equipos_select" ON public.equipos
  FOR SELECT USING (auth.uid() = user_id OR public.user_owns_equipo(id));

CREATE POLICY "equipos_insert" ON public.equipos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "equipos_update" ON public.equipos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "equipos_delete" ON public.equipos
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: equipo_miembros
CREATE POLICY "equipo_miembros_select" ON public.equipo_miembros
  FOR SELECT USING (auth.uid() = user_id OR public.user_owns_equipo(equipo_id));

CREATE POLICY "equipo_miembros_insert" ON public.equipo_miembros
  FOR INSERT WITH CHECK (public.user_owns_equipo(equipo_id));

CREATE POLICY "equipo_miembros_delete" ON public.equipo_miembros
  FOR DELETE USING (public.user_owns_equipo(equipo_id));

-- POLÍTICAS: empleados
CREATE POLICY "empleados_select" ON public.empleados
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "empleados_insert" ON public.empleados
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "empleados_update" ON public.empleados
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "empleados_delete" ON public.empleados
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: materiales_proyecto
CREATE POLICY "materiales_proyecto_select" ON public.materiales_proyecto
  FOR SELECT USING (
    proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
  );

CREATE POLICY "materiales_proyecto_insert" ON public.materiales_proyecto
  FOR INSERT WITH CHECK (
    proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
  );

CREATE POLICY "materiales_proyecto_update" ON public.materiales_proyecto
  FOR UPDATE USING (
    proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
  );

-- POLÍTICAS: movimientos_materiales
CREATE POLICY "movimientos_materiales_select" ON public.movimientos_materiales
  FOR SELECT USING (
    proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
  );

CREATE POLICY "movimientos_materiales_insert" ON public.movimientos_materiales
  FOR INSERT WITH CHECK (
    proyecto_id IN (SELECT id FROM public.proyectos WHERE user_id = auth.uid())
  );

-- POLÍTICAS: ordenes_compra
CREATE POLICY "ordenes_compra_select" ON public.ordenes_compra
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ordenes_compra_insert" ON public.ordenes_compra
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ordenes_compra_update" ON public.ordenes_compra
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ordenes_compra_delete" ON public.ordenes_compra
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: proveedores
CREATE POLICY "proveedores_select" ON public.proveedores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "proveedores_insert" ON public.proveedores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "proveedores_update" ON public.proveedores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "proveedores_delete" ON public.proveedores
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: bitacora_avance
CREATE POLICY "bitacora_avance_select" ON public.bitacora_avance
  FOR SELECT USING (
    presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
  );

CREATE POLICY "bitacora_avance_insert" ON public.bitacora_avance
  FOR INSERT WITH CHECK (
    presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
  );

-- POLÍTICAS: actividades
CREATE POLICY "actividades_select" ON public.actividades
  FOR SELECT USING (
    presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
  );

CREATE POLICY "actividades_insert" ON public.actividades
  FOR INSERT WITH CHECK (
    presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
  );

CREATE POLICY "actividades_delete" ON public.actividades
  FOR DELETE USING (
    presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
  );

-- POLÍTICAS: cambios_presupuesto
CREATE POLICY "cambios_presupuesto_select" ON public.cambios_presupuesto
  FOR SELECT USING (
    presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
  );

CREATE POLICY "cambios_presupuesto_insert" ON public.cambios_presupuesto
  FOR INSERT WITH CHECK (
    presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
      AND usuario_id = auth.uid()
  );

-- POLÍTICAS: notificaciones
CREATE POLICY "notificaciones_select" ON public.notificaciones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notificaciones_delete" ON public.notificaciones
  FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS: device_tokens
CREATE POLICY "device_tokens_select" ON public.device_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "device_tokens_insert" ON public.device_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS: ocr_documentos
CREATE POLICY "ocr_documentos_select" ON public.ocr_documentos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ocr_documentos_insert" ON public.ocr_documentos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS: audit_log
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================================
-- FASE 7: VALIDACIÓN FINAL
-- =====================================================================

-- Verificar que no existan registros orfandos (ejecutar después de migración)
-- SELECT 'presupuestos sin proyecto' as inconsistencia FROM public.presupuestos WHERE proyecto_id IS NULL LIMIT 1;
-- SELECT 'equipos sin proyecto' as inconsistencia FROM public.equipos WHERE proyecto_id IS NULL LIMIT 1;
-- SELECT 'transacciones sin presupuesto' as inconsistencia FROM public.transacciones WHERE presupuesto_id IS NULL LIMIT 1;

-- =====================================================================
-- FIN DEL SCRIPT
-- =====================================================================

-- PRÓXIMOS PASOS DESPUÉS DE EJECUTAR:
-- 1. Generar tipos TypeScript:
--    supabase gen types typescript --local > src/types/supabase.ts
--
-- 2. Actualizar AppContext y servicios según DATABASE_SCHEMA_ANALYSIS.md
--
-- 3. Ejecutar tests:
--    npm run typecheck
--    npm run test -- --run
--    npm run build
--
-- 4. Desplegar:
--    git add -A && git commit -m "feat: Unified master schema v2" && git push

