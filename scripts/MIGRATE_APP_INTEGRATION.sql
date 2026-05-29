-- =====================================================================
-- MIGRATE_APP_INTEGRATION.sql
-- Script de integración de conexiones bidireccionales
-- Ejecutar después de ERP_SCHEMA_FINAL.sql para completar la configuración
-- =====================================================================

-- 1. Agregar columnas faltantes (si no existen)
ALTER TABLE IF EXISTS public.transacciones ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Asegurar RLS en tablas nuevas
ALTER TABLE IF EXISTS public.movimientos_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ocr_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.caja_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transacciones_recurrentes ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes (para idempotencia)
DROP POLICY IF EXISTS "sr_select" ON public.subrenglones;
DROP POLICY IF EXISTS "sr_insert" ON public.subrenglones;
DROP POLICY IF EXISTS "sr_update" ON public.subrenglones;
DROP POLICY IF EXISTS "sr_delete" ON public.subrenglones;

-- 4. Recrear políticas RLS para subrenglones (con sintaxis corregida)
CREATE POLICY "sr_select" ON public.subrenglones
  FOR SELECT TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "sr_insert" ON public.subrenglones
  FOR INSERT TO authenticated
  WITH CHECK (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "sr_update" ON public.subrenglones
  FOR UPDATE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

CREATE POLICY "sr_delete" ON public.subrenglones
  FOR DELETE TO authenticated
  USING (presupuesto_id IN (SELECT id FROM public.presupuestos WHERE user_id = auth.uid()));

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_transacciones_user_id ON public.transacciones(user_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_proyecto_id ON public.transacciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON public.transacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_materiales_material_id ON public.movimientos_materiales(material_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_materiales_user_id ON public.movimientos_materiales(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_documentos_user_id ON public.ocr_documentos(user_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_user_id ON public.ordenes_compra(user_id);
CREATE INDEX IF NOT EXISTS idx_orden_compra_items_orden_compra_id ON public.orden_compra_items(orden_compra_id);

-- 6. Política para ocr_documentos si no existe
DROP POLICY IF EXISTS "ocr_owner" ON public.ocr_documentos;
CREATE POLICY "ocr_owner" ON public.ocr_documentos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ocr_insert" ON public.ocr_documentos;
CREATE POLICY "ocr_insert" ON public.ocr_documentos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ocr_update" ON public.ocr_documentos;
CREATE POLICY "ocr_update" ON public.ocr_documentos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Políticas para device_tokens
DROP POLICY IF EXISTS "tokens_owner" ON public.device_tokens;
CREATE POLICY "tokens_owner" ON public.device_tokens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. Políticas para caja_proyecto
DROP POLICY IF EXISTS "caja_proyecto_owner" ON public.caja_proyecto;
CREATE POLICY "caja_proyecto_owner" ON public.caja_proyecto
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 9. Políticas para movimientos_caja
DROP POLICY IF EXISTS "movimientos_caja_owner" ON public.movimientos_caja;
CREATE POLICY "movimientos_caja_owner" ON public.movimientos_caja
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 10. Políticas para transacciones_recurrentes
DROP POLICY IF EXISTS "tr_owner" ON public.transacciones_recurrentes;
CREATE POLICY "tr_owner" ON public.transacciones_recurrentes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 11. Función de trigger para audit_log automático (opcional)
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (user_id, tabla, registro_id, accion, valor_nuevo, created_at)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), now());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, tabla, registro_id, accion, valor_anterior, valor_nuevo, created_at)
    VALUES (auth.uid(), TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), now());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, tabla, registro_id, accion, valor_anterior, created_at)
    VALUES (auth.uid(), TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), now());
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- VERIFICACIÓN FINAL
-- =====================================================================
-- Ejecutar para verificar que las políticas están aplicadas:
-- SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('transacciones', 'movimientos_materiales', 'subrenglones', 'ocr_documentos') ORDER BY tablename;