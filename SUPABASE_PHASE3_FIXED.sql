/**
 * SUPABASE PHASE 3 - CORRECCIÓN COMPLETA CON SOPORTE DE TABLAS BASE
 * 
 * Este script crea las tablas faltantes en el orden correcto:
 * 1. Tablas de soporte (presupuestos, presupuesto_lineas)
 * 2. Tablas dependientes (cambios_presupuesto, consumo_materiales)
 * 
 * Errores corregidos:
 * - "solicitado_por" does not exist → Removida referencia a auth.users
 * - "presupuesto_lineas" does not exist → Tabla creada
 * 
 * @date 2026-05-25
 */

-- ============================================================================
-- SECCIÓN 0: ENUMERACIONES (ENUM TYPES)
-- ============================================================================

CREATE TYPE IF NOT EXISTS cambio_estado AS ENUM ('pendiente', 'aprobada', 'rechazada', 'cancelada');
CREATE TYPE IF NOT EXISTS movimiento_subtipo AS ENUM ('retiro', 'deposito', 'gasto', 'ingreso', 'ajuste');

-- ============================================================================
-- SECCIÓN 1: TABLAS BASE - PRESUPUESTOS Y LÍNEAS
-- ============================================================================

-- Tabla principal de presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  
  -- Información del presupuesto
  numero_presupuesto TEXT NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'borrador',
  version INT DEFAULT 1,
  
  -- Montos
  total_presupuestado NUMERIC(15,2) DEFAULT 0,
  total_estimado NUMERIC(15,2) DEFAULT 0,
  total_avance NUMERIC(15,2) DEFAULT 0,
  porcentaje_avance NUMERIC(5,2) DEFAULT 0,
  
  -- Fechas
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  fecha_aprobacion TIMESTAMPTZ,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT presupuesto_unico UNIQUE(proyecto_id, numero_presupuesto)
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto ON presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado);

-- Tabla de líneas de presupuesto
CREATE TABLE IF NOT EXISTS presupuesto_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  
  -- Identificación
  numero_renglon INT NOT NULL,
  codigo TEXT,
  descripcion TEXT NOT NULL,
  unidad_medida VARCHAR(20) DEFAULT 'und',
  
  -- Cantidades y costos
  cantidad NUMERIC(15,4) NOT NULL DEFAULT 1,
  costo_unitario NUMERIC(15,4) NOT NULL DEFAULT 0,
  costo_total NUMERIC(15,2) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
  
  -- Avance
  cantidad_ejecutada NUMERIC(15,4) DEFAULT 0,
  costo_ejecutado NUMERIC(15,2) DEFAULT 0,
  porcentaje_avance NUMERIC(5,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT renglon_unico UNIQUE(presupuesto_id, numero_renglon),
  CONSTRAINT cantidad_positiva CHECK (cantidad > 0)
);

CREATE INDEX IF NOT EXISTS idx_presupuesto_lineas_presupuesto ON presupuesto_lineas(presupuesto_id);

-- ============================================================================
-- SECCIÓN 2: TABLA - ÓRDENES DE CAMBIO (CHANGE ORDERS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cambios_presupuesto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  numero_orden INT NOT NULL,
  
  -- Datos del cambio
  descripcion TEXT NOT NULL,
  motivo TEXT,
  cambios JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Impacto financiero
  impacto_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  porcentaje_impacto NUMERIC(5,2) NOT NULL DEFAULT 0,
  requiere_aprobacion_especial BOOLEAN DEFAULT FALSE,
  
  -- Estado y auditoría (sin referencias a auth.users)
  estado cambio_estado DEFAULT 'pendiente',
  solicitado_fecha TIMESTAMPTZ DEFAULT now(),
  aprobado_fecha TIMESTAMPTZ,
  aprobacion_comentarios TEXT,
  rechazado_fecha TIMESTAMPTZ,
  razon_rechazo TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT numero_unico_por_presupuesto UNIQUE(presupuesto_id, numero_orden),
  CONSTRAINT estado_valido CHECK (
    (estado = 'pendiente') OR
    (estado = 'aprobada' AND aprobado_fecha IS NOT NULL) OR
    (estado = 'rechazada' AND rechazado_fecha IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_cambios_presupuesto ON cambios_presupuesto(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_cambios_estado ON cambios_presupuesto(estado);

-- ============================================================================
-- SECCIÓN 3: TABLA - CONSUMO Y TRAZABILIDAD DE MATERIALES
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
  
  -- Desperdicio - SINTAXIS CORREGIDA (sin CASE WHEN)
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

-- ============================================================================
-- SECCIÓN 4: HABILITAR ROW-LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cambios_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumo_materiales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS basadas en proyecto
CREATE POLICY "Permitir CRUD de presupuestos del proyecto" ON presupuestos
    FOR ALL
    TO authenticated
    USING (project_id IN (SELECT id FROM proyectos WHERE user_id = auth.uid()))
    WITH CHECK (project_id IN (SELECT id FROM proyectos WHERE user_id = auth.uid()));

CREATE POLICY "Permitir CRUD de líneas de presupuesto" ON presupuesto_lineas
    FOR ALL
    TO authenticated
    USING (presupuesto_id IN (SELECT id FROM presupuestos WHERE proyecto_id IN (SELECT id FROM proyectos WHERE user_id = auth.uid())))
    WITH CHECK (presupuesto_id IN (SELECT id FROM presupuestos WHERE proyecto_id IN (SELECT id FROM proyectos WHERE user_id = auth.uid())));

CREATE POLICY "Permitir CRUD de cambios de presupuesto" ON cambios_presupuesto
    FOR ALL
    TO authenticated
    USING (presupuesto_id IN (SELECT id FROM presupuestos WHERE proyecto_id IN (SELECT id FROM proyectos WHERE user_id = auth.uid())))
    WITH CHECK (presupuesto_id IN (SELECT id FROM presupuestos WHERE proyecto_id IN (SELECT id FROM proyectos WHERE user_id = auth.uid())));

CREATE POLICY "Permitir CRUD de consumo de materiales" ON consumo_materiales
    FOR ALL
    TO authenticated
    USING (presupuesto_id IN (SELECT id FROM presupuestos WHERE proyecto_id IN (SELECT id FROM proyectos WHERE user_id = auth.uid())))
    WITH CHECK (presupuesto_id IN (SELECT id FROM presupuestos WHERE proyecto_id IN (SELECT id FROM proyectos WHERE user_id = auth.uid())));

-- ============================================================================
-- CONFIRMACIÓN
-- ============================================================================

-- Verificar que todas las tablas se crearon
SELECT 
  'presupuestos' as tabla, count(*) as registros FROM presupuestos
UNION ALL
SELECT 'presupuesto_lineas', count(*) FROM presupuesto_lineas
UNION ALL
SELECT 'cambios_presupuesto', count(*) FROM cambios_presupuesto
UNION ALL
SELECT 'consumo_materiales', count(*) FROM consumo_materiales;
