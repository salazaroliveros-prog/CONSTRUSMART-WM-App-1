-- =====================================================================
-- MIGRACIÓN DE TABLAS FALTANTES
-- Ejecutar este archivo en el SQL Editor de Supabase
-- Proyecto: eypwnpcaxcxvptsfcqvy
-- =====================================================================

-- Las siguientes tablas faltan en la base de datos actual
-- Este script crea solo las tablas faltantes y sus políticas RLS

-- =====================================================================
-- TABLAS FALTANTES
-- =====================================================================

-- 1. renglon_usage
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

-- 2. renglon_precios_historial
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

-- 3. subrenglones
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

CREATE TRIGGER IF NOT EXISTS trg_subrenglones_updated_at BEFORE UPDATE ON public.subrenglones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_subrenglones_presupuesto_id ON public.subrenglones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_subrenglones_renglon_id ON public.subrenglones(renglon_id);

-- 4. subrenglon_materiales
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

-- 5. subrenglon_mano_obra
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

-- 6. subrenglon_equipos
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

-- 7. movimientos_materiales
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

-- 8. ordenes_compra
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

CREATE TRIGGER IF NOT EXISTS trg_ordenes_compra_updated_at BEFORE UPDATE ON public.ordenes_compra FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ordenes_compra_user_id ON public.ordenes_compra(user_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proyecto_id ON public.ordenes_compra(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor_id ON public.ordenes_compra(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estatus ON public.ordenes_compra(estatus);

-- 9. orden_compra_items
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

-- 10. recepcion_oc
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

-- 11. recepcion_oc_items
CREATE TABLE IF NOT EXISTS public.recepcion_oc_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recepcion_id uuid NOT NULL REFERENCES public.recepcion_oc(id) ON DELETE CASCADE,
  orden_compra_item_id uuid NOT NULL REFERENCES public.orden_compra_items(id) ON DELETE CASCADE,
  cantidad_recibida numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TRIGGER IF NOT EXISTS trg_auto_movimiento_recepcion AFTER INSERT ON public.recepcion_oc_items FOR EACH ROW EXECUTE FUNCTION public.fn_auto_movimiento_recepcion();

-- 12. cambios_presupuesto
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

CREATE TRIGGER IF NOT EXISTS trg_cambios_presupuesto_updated_at BEFORE UPDATE ON public.cambios_presupuesto FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_cambios_presupuesto_presupuesto_id ON public.cambios_presupuesto(presupuesto_id);

-- 13. bitacora_avance
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

-- 14. checklist_items
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

-- 15. conciliaciones
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

CREATE TRIGGER IF NOT EXISTS trg_conciliaciones_updated_at BEFORE UPDATE ON public.conciliaciones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_conciliaciones_user_id ON public.conciliaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_proyecto_id ON public.conciliaciones(proyecto_id);

-- 16. partidas_conciliacion
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

-- 17. caja_proyecto
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

CREATE TRIGGER IF NOT EXISTS trg_caja_proyecto_updated_at BEFORE UPDATE ON public.caja_proyecto FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_caja_proyecto_proyecto_id ON public.caja_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_caja_proyecto_user_id ON public.caja_proyecto(user_id);

-- 18. movimientos_caja
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

CREATE TRIGGER IF NOT EXISTS trg_movimientos_caja_updated_at BEFORE UPDATE ON public.movimientos_caja FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_movimientos_caja_caja_id ON public.movimientos_caja(caja_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_user_id ON public.movimientos_caja(user_id);

-- 19. transacciones_recurrentes
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

CREATE TRIGGER IF NOT EXISTS trg_transacciones_recurrentes_updated_at BEFORE UPDATE ON public.transacciones_recurrentes FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tr_recurrentes_presupuesto ON public.transacciones_recurrentes(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_tr_recurrentes_user_id ON public.transacciones_recurrentes(user_id);

-- 20. ocr_documentos
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

-- 21. device_tokens
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);

-- 22. audit_log
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
-- HABILITAR RLS EN TABLAS NUEVAS
-- =====================================================================

ALTER TABLE public.renglon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renglon_precios_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglon_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglon_mano_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subrenglon_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recepcion_oc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recepcion_oc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cambios_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_avance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas_conciliacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_recurrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- POLITICAS RLS PARA TABLAS NUEVAS
-- =====================================================================

-- renglon_usage
CREATE POLICY "renglon_usage_select" ON public.renglon_usage FOR SELECT USING (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);
CREATE POLICY "renglon_usage_insert" ON public.renglon_usage FOR INSERT WITH CHECK (
  presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid())
);

-- renglon_precios_historial
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

-- subrenglones
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

-- subrenglon_materiales
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

-- subrenglon_mano_obra
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

-- subrenglon_equipos
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

-- movimientos_materiales
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

-- ordenes_compra
CREATE POLICY "oc_select" ON public.ordenes_compra FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "oc_insert" ON public.ordenes_compra FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oc_update" ON public.ordenes_compra FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "oc_delete" ON public.ordenes_compra FOR DELETE USING (auth.uid() = user_id);

-- orden_compra_items
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

-- recepcion_oc
CREATE POLICY "rec_select" ON public.recepcion_oc FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rec_insert" ON public.recepcion_oc FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rec_update" ON public.recepcion_oc FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rec_delete" ON public.recepcion_oc FOR DELETE USING (auth.uid() = user_id);

-- recepcion_oc_items
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

-- cambios_presupuesto
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

-- bitacora_avance
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

-- checklist_items
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

-- conciliaciones
CREATE POLICY "conciliaciones_select" ON public.conciliaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conciliaciones_insert" ON public.conciliaciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conciliaciones_update" ON public.conciliaciones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "conciliaciones_delete" ON public.conciliaciones FOR DELETE USING (auth.uid() = user_id);

-- partidas_conciliacion
CREATE POLICY "partidas_select" ON public.partidas_conciliacion FOR SELECT USING (
  conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid())
);
CREATE POLICY "partidas_insert" ON public.partidas_conciliacion FOR INSERT WITH CHECK (
  conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid())
);
CREATE POLICY "partidas_update" ON public.partidas_conciliacion FOR UPDATE USING (
  conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid())
);
CREATE POLICY "partidas_delete" ON public.partidas_conciliacion FOR DELETE USING (
  conciliacion_id IN (SELECT id FROM public.conciliaciones WHERE user_id = auth.uid())
);

-- caja_proyecto
CREATE POLICY "caja_select" ON public.caja_proyecto FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "caja_insert" ON public.caja_proyecto FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "caja_update" ON public.caja_proyecto FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "caja_delete" ON public.caja_proyecto FOR DELETE USING (auth.uid() = user_id);

-- movimientos_caja
CREATE POLICY "movimientos_caja_select" ON public.movimientos_caja FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "movimientos_caja_insert" ON public.movimientos_caja FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "movimientos_caja_update" ON public.movimientos_caja FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "movimientos_caja_delete" ON public.movimientos_caja FOR DELETE USING (auth.uid() = user_id);

-- transacciones_recurrentes
CREATE POLICY "tr_select" ON public.transacciones_recurrentes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tr_insert" ON public.transacciones_recurrentes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tr_update" ON public.transacciones_recurrentes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tr_delete" ON public.transacciones_recurrentes FOR DELETE USING (auth.uid() = user_id);

-- ocr_documentos
CREATE POLICY "ocr_select" ON public.ocr_documentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ocr_insert" ON public.ocr_documentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ocr_update" ON public.ocr_documentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ocr_delete" ON public.ocr_documentos FOR DELETE USING (auth.uid() = user_id);

-- device_tokens
CREATE POLICY "device_tokens_select" ON public.device_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "device_tokens_insert" ON public.device_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "device_tokens_delete" ON public.device_tokens FOR DELETE USING (auth.uid() = user_id);

-- audit_log
CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "audit_log_insert" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- FINALIZADO
-- =====================================================================
