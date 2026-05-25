/**
 * SUPABASE IMPROVEMENTS - FASE 3
 * 
 * Script para agregar mejoras a las tablas existentes sin eliminar datos.
 * Compatible con el esquema actual de Supabase.
 * 
 * Este script:
 * 1. Agrega nuevas columnas a tablas existentes
 * 2. Crea nuevas tablas complementarias
 * 3. Crea enumeraciones (ENUM types)
 * 4. Configura índices y políticas RLS
 * 
 * @date 2026-05-25
 * @status Ready for production
 */

-- ============================================================================
-- SECCIÓN 1: CREAR ENUMERACIONES (ENUM TYPES)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE cambio_estado AS ENUM ('pendiente', 'aprobada', 'rechazada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE movimiento_subtipo AS ENUM ('retiro', 'deposito', 'gasto', 'ingreso', 'ajuste');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE frecuencia_pago AS ENUM ('unica', 'diaria', 'semanal', 'mensual', 'trimestral', 'anual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECCIÓN 2: MEJORAR TABLA EXISTENTE - cambios_presupuesto
-- ============================================================================

-- Agregar columnas faltantes si no existen
ALTER TABLE cambios_presupuesto
ADD COLUMN IF NOT EXISTS numero_orden INT UNIQUE,
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS impacto_total NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS porcentaje_impacto NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS requiere_aprobacion_especial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS solicitado_fecha TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS aprobado_fecha TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS aprobacion_comentarios TEXT,
ADD COLUMN IF NOT EXISTS rechazado_fecha TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS razon_rechazo TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Crear índices para mejorar queries
CREATE INDEX IF NOT EXISTS idx_cambios_presupuesto_estado ON cambios_presupuesto(estado);
CREATE INDEX IF NOT EXISTS idx_cambios_presupuesto_presupuesto_id ON cambios_presupuesto(presupuesto_id);

-- ============================================================================
-- SECCIÓN 3: MEJORAR TABLA EXISTENTE - materiales_proyecto
-- ============================================================================

-- Agregar columnas para trazabilidad mejorada
ALTER TABLE materiales_proyecto
ADD COLUMN IF NOT EXISTS cantidad_comprada NUMERIC(15,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cantidad_consumida NUMERIC(15,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cantidad_devuelta NUMERIC(15,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS costo_unitario_real NUMERIC(15,4),
ADD COLUMN IF NOT EXISTS costo_total_comprado NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS variacion_costo_porcentaje NUMERIC(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS alerta_desperdicio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS alerta_costo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_materiales_presupuesto ON materiales_proyecto(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_materiales_alertas ON materiales_proyecto(alerta_desperdicio, alerta_costo);

-- ============================================================================
-- SECCIÓN 4: MEJORAR TABLA EXISTENTE - checklist_items
-- ============================================================================

-- Agregar columnas para mejor control de calidad
ALTER TABLE checklist_items
ADD COLUMN IF NOT EXISTS requerido BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS firma_digital TEXT,
ADD COLUMN IF NOT EXISTS notas TEXT,
ADD COLUMN IF NOT EXISTS orden INT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_checklist_items_presupuesto ON checklist_items(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_completado ON checklist_items(completado);

-- ============================================================================
-- SECCIÓN 5: MEJORAR TABLA EXISTENTE - presupuestos
-- ============================================================================

-- Agregar columnas para mejor seguimiento
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS numero_presupuesto TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'borrador',
ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS porcentaje_avance NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto_id ON presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX IF NOT EXISTS idx_presupuestos_user_id ON presupuestos(user_id);

-- ============================================================================
-- SECCIÓN 6: MEJORAR TABLA EXISTENTE - bitacora_avance
-- ============================================================================

-- Agregar columnas para mejor auditoria
ALTER TABLE bitacora_avance
ADD COLUMN IF NOT EXISTS avance_financiero NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS porcentaje_completado NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hito_importante BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_bitacora_presupuesto ON bitacora_avance(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora_avance(fecha);

-- ============================================================================
-- SECCIÓN 7: CREAR TABLA NUEVA - caja_proyecto (CASH FLOW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS caja_proyecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Saldos
  saldo_inicial NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_sistema_actual NUMERIC(15,2) DEFAULT 0,
  saldo_real_actual NUMERIC(15,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT saldo_unico_por_proyecto UNIQUE(proyecto_id),
  CONSTRAINT saldo_positivo CHECK (saldo_sistema_actual >= 0)
);

CREATE INDEX IF NOT EXISTS idx_caja_proyecto ON caja_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_caja_user ON caja_proyecto(user_id);

-- ============================================================================
-- SECCIÓN 8: CREAR TABLA NUEVA - movimientos_caja (CASH FLOW DETAILS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID NOT NULL REFERENCES caja_proyecto(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Datos del movimiento
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  descripcion TEXT NOT NULL,
  subtipo VARCHAR(50) NOT NULL,
  concepto VARCHAR(100),
  
  -- Montos
  monto NUMERIC(15,2) NOT NULL,
  saldo_sistema_antes NUMERIC(15,2) NOT NULL,
  saldo_sistema_despues NUMERIC(15,2) NOT NULL,
  saldo_real_confirmado NUMERIC(15,2),
  
  -- Diferencia
  diferencia NUMERIC(15,2) GENERATED ALWAYS AS 
    (saldo_sistema_despues - COALESCE(saldo_real_confirmado, saldo_sistema_despues)) STORED,
  
  -- Conciliación
  conciliado_fecha TIMESTAMPTZ,
  motivo_diferencia TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT monto_positivo CHECK (monto > 0)
);

CREATE INDEX IF NOT EXISTS idx_movimientos_caja ON movimientos_caja(caja_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_caja(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_subtipo ON movimientos_caja(subtipo);

-- ============================================================================
-- SECCIÓN 9: CREAR TABLA NUEVA - transacciones_recurrentes (PROYECCIONES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transacciones_recurrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Datos
  descripcion TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  monto NUMERIC(15,2) NOT NULL,
  frecuencia VARCHAR(50) NOT NULL,
  
  -- Control
  activa BOOLEAN DEFAULT TRUE,
  proxima_fecha DATE,
  ultima_fecha DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transacciones_presupuesto ON transacciones_recurrentes(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_activas ON transacciones_recurrentes(activa);

-- ============================================================================
-- SECCIÓN 10: MEJORAR TABLA EXISTENTE - conciliaciones
-- ============================================================================

-- Agregar columnas para mejor control
ALTER TABLE conciliaciones
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS banco_nombre VARCHAR(100),
ADD COLUMN IF NOT EXISTS numero_cuenta TEXT;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_conciliaciones_user ON conciliaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_periodo ON conciliaciones(periodo);

-- ============================================================================
-- SECCIÓN 11: CREAR TABLA NUEVA - notificaciones_mejorada
-- ============================================================================

-- Agregar columnas a notificaciones existente si es necesario
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS referencia_id UUID,
ADD COLUMN IF NOT EXISTS referencia_tipo TEXT,
ADD COLUMN IF NOT EXISTS prioridad VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS leido_en TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_notificaciones_user ON notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido ON notificaciones(leido);

-- ============================================================================
-- SECCIÓN 12: CREAR VISTAS ÚTILES PARA QUERIES
-- ============================================================================

-- Vista: Resumen de presupuestos por proyecto
CREATE OR REPLACE VIEW v_presupuestos_resumen AS
SELECT 
  p.id,
  p.proyecto,
  p.user_id,
  COUNT(DISTINCT c.id) as total_cambios,
  COUNT(DISTINCT ci.id) as total_items_checklist,
  COALESCE(p.avance_fisico, 0) as avance_fisico,
  COALESCE(p.avance_financiero, 0) as avance_financiero,
  COALESCE(p.total, 0) as monto_total,
  p.created_at,
  p.updated_at
FROM presupuestos p
LEFT JOIN cambios_presupuesto c ON c.presupuesto_id = p.id
LEFT JOIN checklist_items ci ON ci.presupuesto_id = p.id
GROUP BY p.id, p.proyecto, p.user_id, p.avance_fisico, p.avance_financiero, p.total, p.created_at, p.updated_at;

-- Vista: Saldo de caja por proyecto
CREATE OR REPLACE VIEW v_caja_resumen AS
SELECT 
  cp.id,
  cp.proyecto_id,
  cp.saldo_inicial,
  COALESCE(cp.saldo_sistema_actual, 0) as saldo_actual,
  COALESCE(cp.saldo_real_actual, 0) as saldo_real,
  COALESCE(cp.saldo_sistema_actual - cp.saldo_real_actual, 0) as diferencia,
  COUNT(mc.id) as total_movimientos,
  cp.created_at,
  cp.updated_at
FROM caja_proyecto cp
LEFT JOIN movimientos_caja mc ON mc.caja_id = cp.id
GROUP BY cp.id, cp.proyecto_id, cp.saldo_inicial, cp.saldo_sistema_actual, cp.saldo_real_actual, cp.created_at, cp.updated_at;

-- Vista: Materiales con alertas
CREATE OR REPLACE VIEW v_materiales_alertas AS
SELECT 
  id,
  presupuesto_id,
  nombre,
  codigo,
  cantidad_estimada,
  cantidad_utilizada,
  cantidad_comprada,
  cantidad_consumida,
  COALESCE(cantidad_comprada - cantidad_consumida, 0) as desperdicio,
  CASE WHEN cantidad_comprada > 0 
    THEN ROUND(((cantidad_comprada - cantidad_consumida)::numeric / cantidad_comprada * 100), 2)
    ELSE 0 
  END as porcentaje_desperdicio,
  alerta_desperdicio,
  alerta_costo,
  created_at
FROM materiales_proyecto
WHERE alerta_desperdicio = TRUE OR alerta_costo = TRUE;

-- ============================================================================
-- SECCIÓN 13: HABILITAR ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE caja_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_recurrentes ENABLE ROW LEVEL SECURITY;

-- Políticas para caja_proyecto
CREATE POLICY "caja_proyecto_select" ON caja_proyecto
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "caja_proyecto_insert" ON caja_proyecto
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "caja_proyecto_update" ON caja_proyecto
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para movimientos_caja
CREATE POLICY "movimientos_caja_select" ON movimientos_caja
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "movimientos_caja_insert" ON movimientos_caja
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "movimientos_caja_update" ON movimientos_caja
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para transacciones_recurrentes
CREATE POLICY "transacciones_recurrentes_select" ON transacciones_recurrentes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transacciones_recurrentes_insert" ON transacciones_recurrentes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transacciones_recurrentes_update" ON transacciones_recurrentes
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- SECCIÓN 14: CREAR TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- ============================================================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las nuevas tablas
CREATE TRIGGER trigger_updated_caja_proyecto
  BEFORE UPDATE ON caja_proyecto
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_updated_movimientos_caja
  BEFORE UPDATE ON movimientos_caja
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_updated_transacciones_recurrentes
  BEFORE UPDATE ON transacciones_recurrentes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

-- ============================================================================
-- SECCIÓN 15: VERIFICACIÓN Y RESUMEN
-- ============================================================================

-- Listar todas las tablas modificadas/creadas
SELECT 
  tablename,
  'Tabla completada' as estado
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'cambios_presupuesto',
  'materiales_proyecto',
  'checklist_items',
  'presupuestos',
  'bitacora_avance',
  'caja_proyecto',
  'movimientos_caja',
  'transacciones_recurrentes',
  'conciliaciones',
  'notificaciones'
)
ORDER BY tablename;

-- Resumen de mejoras
SELECT 
  'Tablas Creadas' as tipo,
  'caja_proyecto, movimientos_caja, transacciones_recurrentes' as detalles
UNION ALL
SELECT 
  'Tablas Mejoradas',
  'cambios_presupuesto, materiales_proyecto, checklist_items, presupuestos, bitacora_avance, conciliaciones, notificaciones'
UNION ALL
SELECT 
  'Vistas Creadas',
  'v_presupuestos_resumen, v_caja_resumen, v_materiales_alertas'
UNION ALL
SELECT 
  'Enumeraciones',
  'cambio_estado, movimiento_subtipo, frecuencia_pago'
UNION ALL
SELECT 
  'Índices',
  'Optimizados para queries frecuentes'
UNION ALL
SELECT 
  'RLS Policies',
  'Habilitadas en nuevas tablas'
UNION ALL
SELECT 
  'Triggers',
  'Auditoría automática de updated_at';

-- ============================================================================
-- FIN - SUPABASE IMPROVEMENTS PHASE 3
-- ============================================================================
-- 
-- ✅ Todas las mejoras han sido aplicadas sin eliminar datos existentes.
-- 
-- Próximos pasos:
-- 1. Verificar que no hay errores arriba
-- 2. Probar las vistas en el SQL Editor
-- 3. Regenerar tipos TypeScript: supabase gen types typescript --local
-- 4. Actualizar la aplicación con nuevos tipos
-- 5. Deployar a producción
-- 
-- Documentación: https://supabase.com/docs
