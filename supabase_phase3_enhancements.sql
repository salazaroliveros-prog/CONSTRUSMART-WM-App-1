-- =========================================================
-- FASE 3: ENHANCEMENTS - Change Orders + Trazabilidad
-- =========================================================

-- M6: CHANGE ORDERS - Sistema de Versionado
CREATE TABLE IF NOT EXISTS cambios_presupuesto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  version int NOT NULL,
  cambios jsonb NOT NULL, -- { "renglon_id": { "anterior": X, "nuevo": Y, "motivo": "..." } }
  descripcion_cambios text,
  aprobado_por uuid REFERENCES auth.users(id),
  usuario_creador uuid NOT NULL REFERENCES auth.users(id),
  estado varchar(20) DEFAULT 'pendiente', -- pendiente, aprobado, rechazado
  impacto_presupuesto numeric, -- Diferencia total
  porcentaje_impacto numeric, -- % cambio respecto al original
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  CONSTRAINT version_unica UNIQUE(presupuesto_id, version)
);

CREATE INDEX idx_cambios_presupuesto_id ON cambios_presupuesto(presupuesto_id);
CREATE INDEX idx_cambios_estado ON cambios_presupuesto(estado);

-- M9: TRAZABILIDAD DE MATERIALES
CREATE TABLE IF NOT EXISTS consumo_materiales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  renglon_codigo text NOT NULL,
  descripcion_material text,
  unidad varchar(50),
  cantidad_presupuestada numeric NOT NULL,
  cantidad_comprada numeric DEFAULT 0,
  cantidad_consumida numeric DEFAULT 0,
  costo_unitario_presupuestado numeric,
  costo_total_presupuestado numeric,
  costo_total_comprado numeric DEFAULT 0,
  desperdicio_porcentaje numeric, -- (comprado - consumido) / presupuestado
  desperdicio_alerta boolean DEFAULT false, -- true si desperdicio > 10%
  proveedor text,
  fecha_compra date,
  fecha_consumo date,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_consumo_presupuesto_id ON consumo_materiales(presupuesto_id);
CREATE INDEX idx_consumo_renglon_codigo ON consumo_materiales(renglon_codigo);
CREATE INDEX idx_consumo_alerta ON consumo_materiales(desperdicio_alerta);

-- Trigger para calcular desperdicio automáticamente
CREATE OR REPLACE FUNCTION calcular_desperdicio_materiales()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cantidad_comprada > 0 AND NEW.cantidad_presupuestada > 0 THEN
    NEW.desperdicio_porcentaje := ROUND(
      ((NEW.cantidad_comprada - NEW.cantidad_consumida) / NEW.cantidad_presupuestada) * 100, 2
    );
    NEW.desperdicio_alerta := NEW.desperdicio_porcentaje > 10;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_desperdicio
BEFORE INSERT OR UPDATE ON consumo_materiales
FOR EACH ROW
EXECUTE FUNCTION calcular_desperdicio_materiales();

-- RLS POLICIES

-- Change Orders RLS
CREATE POLICY "users_can_view_cambios" ON cambios_presupuesto
  FOR SELECT USING (true);

CREATE POLICY "users_can_create_cambios" ON cambios_presupuesto
  FOR INSERT WITH CHECK (auth.uid() = usuario_creador);

CREATE POLICY "users_can_update_cambios" ON cambios_presupuesto
  FOR UPDATE USING (auth.uid() = usuario_creador OR auth.uid() = aprobado_por);

-- Consumo Materiales RLS
CREATE POLICY "users_can_view_consumo" ON consumo_materiales
  FOR SELECT USING (true);

CREATE POLICY "users_can_manage_consumo" ON consumo_materiales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_can_update_consumo" ON consumo_materiales
  FOR UPDATE USING (true);

-- Enable RLS
ALTER TABLE cambios_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumo_materiales ENABLE ROW LEVEL SECURITY;
