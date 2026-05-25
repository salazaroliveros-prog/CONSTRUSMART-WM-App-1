/**
 * SUPABASE PHASE 3 - CORRECCIÓN RÁPIDA
 * 
 * Este script contiene SOLO las tablas que pueden fallar.
 * Ejecuta SOLO el bloque de consumo_materiales con la sintaxis corregida.
 * 
 * ERROR ORIGINAL (línea 85):
 * CASE WHEN cantidad_comprada > 0 THEN ... END STORED
 * 
 * SOLUCIÓN:
 * Usar COALESCE + NULLIF en lugar de CASE
 * 
 * @date 2026-05-25
 */

-- ============================================================================
-- SECCIÓN 3: TABLA - CONSUMO Y TRAZABILIDAD DE MATERIALES (CORREGIDA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS consumo_materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  renglon_id UUID REFERENCES presupuesto_lineas(id) ON DELETE SET NULL,
  
  -- Identificación
  codigo_material TEXT NOT NULL,
  descripcion TEXT,
  unidad_medida VARCHAR(20) DEFAULT 'und',
  
  -- Cantidades
  cantidad_presupuestada NUMERIC(15,4) NOT NULL,
  cantidad_comprada NUMERIC(15,4) DEFAULT 0,
  cantidad_consumida NUMERIC(15,4) DEFAULT 0,
  cantidad_devuelta NUMERIC(15,4) DEFAULT 0,
  
  -- Costos
  costo_unitario_presupuestado NUMERIC(15,4) NOT NULL,
  costo_unitario_real_compra NUMERIC(15,4),
  costo_total_presupuestado NUMERIC(15,2) GENERATED ALWAYS AS 
    (cantidad_presupuestada * costo_unitario_presupuestado) STORED,
  costo_total_comprado NUMERIC(15,2) GENERATED ALWAYS AS 
    (cantidad_comprada * COALESCE(costo_unitario_real_compra, costo_unitario_presupuestado)) STORED,
  variacion_costo_porcentaje NUMERIC(6,2) DEFAULT 0,
  
  -- Desperdicio - SINTAXIS CORREGIDA
  cantidad_desperdicio NUMERIC(15,4) GENERATED ALWAYS AS 
    (cantidad_comprada - cantidad_consumida) STORED,
  porcentaje_desperdicio NUMERIC(5,2) GENERATED ALWAYS AS 
    (COALESCE(ROUND(((cantidad_comprada - cantidad_consumida)::numeric / NULLIF(cantidad_comprada, 0) * 100), 2), 0)) STORED,
  
  -- Alertas
  estado VARCHAR(20) DEFAULT 'activo',
  alerta_desperdicio BOOLEAN DEFAULT FALSE,
  alerta_costo BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT cantidad_valida CHECK (
    cantidad_presupuestada > 0 AND
    cantidad_comprada >= 0 AND
    cantidad_consumida >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_consumo_presupuesto ON consumo_materiales(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_consumo_renglon ON consumo_materiales(renglon_id);
CREATE INDEX IF NOT EXISTS idx_consumo_alerta ON consumo_materiales(alerta_desperdicio, alerta_costo);

-- COMENTARIO: Tabla consumo_materiales creada exitosamente
