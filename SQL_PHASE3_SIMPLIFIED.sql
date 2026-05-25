-- ============================================================================
-- SUPABASE PHASE 3 - SQL EN ORDEN DE EJECUCIÓN
-- ============================================================================
-- 
-- Este archivo contiene SOLO el SQL en orden de ejecución
-- Para guía completa con instrucciones, ver: SUPABASE_SETUP_GUIDE.md
--
-- ⚠️ IMPORTANTE: Ejecutar SECCIÓN POR SECCIÓN, no todo de una vez
--
-- ============================================================================

-- ✅ PASO 1: CREAR ENUMERACIONES (ENUM Types)
-- Ejecutar primero

CREATE TYPE cambio_estado AS ENUM ('pendiente', 'aprobada', 'rechazada', 'cancelada');
CREATE TYPE checklist_estado AS ENUM ('pendiente', 'en_progreso', 'completado', 'bloqueado');
CREATE TYPE fase_proyecto AS ENUM ('planeación', 'ejecución', 'finalizado');
CREATE TYPE movimiento_subtipo AS ENUM ('retiro', 'deposito', 'gasto', 'ingreso', 'ajuste');
CREATE TYPE frecuencia_transaccion AS ENUM ('diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'anual');
CREATE TYPE frecuencia_pago AS ENUM ('unica', 'diaria', 'semanal', 'mensual', 'trimestral', 'anual');

-- ============================================================================
-- ✅ PASO 2: CREAR TABLA - cambios_presupuesto
-- 

CREATE TABLE IF NOT EXISTS cambios_presupuesto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  numero_orden INT NOT NULL,
  descripcion TEXT NOT NULL,
  motivo TEXT,
  cambios JSONB NOT NULL DEFAULT '[]'::jsonb,
  impacto_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  porcentaje_impacto NUMERIC(5,2) NOT NULL DEFAULT 0,
  requiere_aprobacion_especial BOOLEAN DEFAULT FALSE,
  estado cambio_estado DEFAULT 'pendiente',
  solicitado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  solicitado_fecha TIMESTAMPTZ DEFAULT now(),
  aprobado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aprobado_fecha TIMESTAMPTZ,
  aprobacion_comentarios TEXT,
  rechazado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rechazado_fecha TIMESTAMPTZ,
  razon_rechazo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT numero_unico_por_presupuesto UNIQUE(presupuesto_id, numero_orden),
  CONSTRAINT estado_valido CHECK (
    (estado = 'pendiente') OR
    (estado = 'aprobada' AND aprobado_por IS NOT NULL AND aprobado_fecha IS NOT NULL) OR
    (estado = 'rechazada' AND rechazado_por IS NOT NULL AND rechazado_fecha IS NOT NULL)
  )
);

CREATE INDEX idx_cambios_presupuesto ON cambios_presupuesto(presupuesto_id);
CREATE INDEX idx_cambios_estado ON cambios_presupuesto(estado);
CREATE INDEX idx_cambios_usuario_solicita ON cambios_presupuesto(solicitado_por);

-- ============================================================================
-- ✅ PASO 3: CREAR TABLA - consumo_materiales
-- 

CREATE TABLE IF NOT EXISTS consumo_materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  renglon_id UUID REFERENCES presupuesto_lineas(id) ON DELETE SET NULL,
  codigo_material TEXT NOT NULL,
  descripcion TEXT,
  unidad_medida VARCHAR(20) DEFAULT 'und',
  cantidad_presupuestada NUMERIC(15,4) NOT NULL,
  cantidad_comprada NUMERIC(15,4) DEFAULT 0,
  cantidad_consumida NUMERIC(15,4) DEFAULT 0,
  cantidad_devuelta NUMERIC(15,4) DEFAULT 0,
  costo_unitario_presupuestado NUMERIC(15,4) NOT NULL,
  costo_unitario_real_compra NUMERIC(15,4),
  costo_total_presupuestado NUMERIC(15,2) GENERATED ALWAYS AS 
    (cantidad_presupuestada * costo_unitario_presupuestado) STORED,
  costo_total_comprado NUMERIC(15,2) GENERATED ALWAYS AS 
    (cantidad_comprada * COALESCE(costo_unitario_real_compra, costo_unitario_presupuestado)) STORED,
  variacion_costo_porcentaje NUMERIC(6,2) DEFAULT 0,
  cantidad_desperdicio NUMERIC(15,4) GENERATED ALWAYS AS 
    (cantidad_comprada - cantidad_consumida) STORED,
  porcentaje_desperdicio NUMERIC(5,2) GENERATED ALWAYS AS 
    CASE WHEN cantidad_comprada > 0 
      THEN ROUND(((cantidad_comprada - cantidad_consumida) / cantidad_comprada * 100)::numeric, 2)
      ELSE 0 
    END STORED,
  estado VARCHAR(20) DEFAULT 'activo',
  alerta_desperdicio BOOLEAN DEFAULT FALSE,
  alerta_costo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT cantidad_valida CHECK (
    cantidad_presupuestada > 0 AND
    cantidad_comprada >= 0 AND
    cantidad_consumida >= 0
  )
);

CREATE INDEX idx_consumo_presupuesto ON consumo_materiales(presupuesto_id);
CREATE INDEX idx_consumo_renglon ON consumo_materiales(renglon_id);
CREATE INDEX idx_consumo_alerta ON consumo_materiales(alerta_desperdicio, alerta_costo);

-- ============================================================================
-- ✅ PASO 4: CREAR TABLA - caja_proyecto
-- 

CREATE TABLE IF NOT EXISTS caja_proyecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  saldo_inicial NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_sistema_actual NUMERIC(15,2) DEFAULT 0,
  saldo_real_actual NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT saldo_unico_por_proyecto UNIQUE(proyecto_id)
);

CREATE INDEX idx_caja_proyecto ON caja_proyecto(proyecto_id);

-- ============================================================================
-- ✅ PASO 5: CREAR TABLA - movimientos_caja
-- 

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID NOT NULL REFERENCES caja_proyecto(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  descripcion TEXT NOT NULL,
  subtipo movimiento_subtipo NOT NULL,
  concepto VARCHAR(100),
  monto NUMERIC(15,2) NOT NULL,
  saldo_sistema_antes NUMERIC(15,2) NOT NULL,
  saldo_sistema_despues NUMERIC(15,2) NOT NULL,
  saldo_real_confirmado NUMERIC(15,2),
  diferencia NUMERIC(15,2) GENERATED ALWAYS AS 
    (saldo_sistema_despues - COALESCE(saldo_real_confirmado, saldo_sistema_despues)) STORED,
  registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conciliado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conciliado_fecha TIMESTAMPTZ,
  motivo_diferencia TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT monto_positivo CHECK (monto > 0)
);

CREATE INDEX idx_movimientos_caja ON movimientos_caja(caja_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_caja(fecha);
CREATE INDEX idx_movimientos_subtipo ON movimientos_caja(subtipo);

-- ============================================================================
-- ✅ PASO 6: CREAR TABLA - checklists_proyecto
-- 

CREATE TABLE IF NOT EXISTS checklists_proyecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  fase fase_proyecto NOT NULL,
  tipologia VARCHAR(50) NOT NULL,
  estado checklist_estado DEFAULT 'pendiente',
  puede_avanzar BOOLEAN DEFAULT FALSE,
  intento_avance_sin_completar INT DEFAULT 0,
  creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fase_unica_por_presupuesto UNIQUE(presupuesto_id, fase)
);

CREATE INDEX idx_checklists_presupuesto ON checklists_proyecto(presupuesto_id);
CREATE INDEX idx_checklists_fase ON checklists_proyecto(fase);

-- ============================================================================
-- ✅ PASO 7: CREAR TABLA - items_checklist
-- 

CREATE TABLE IF NOT EXISTS items_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists_proyecto(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL,
  requerido BOOLEAN DEFAULT TRUE,
  completado BOOLEAN DEFAULT FALSE,
  completado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_completado TIMESTAMPTZ,
  foto_evidencia JSONB DEFAULT '[]'::jsonb,
  firma_digital TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT orden_unico_por_checklist UNIQUE(checklist_id, orden)
);

CREATE INDEX idx_items_checklist ON items_checklist(checklist_id);
CREATE INDEX idx_items_completado ON items_checklist(completado);

-- ============================================================================
-- ✅ PASO 8: CREAR TABLA - transacciones_recurrentes
-- 

CREATE TABLE IF NOT EXISTS transacciones_recurrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  monto NUMERIC(15,2) NOT NULL,
  frecuencia frecuencia_transaccion NOT NULL,
  activa BOOLEAN DEFAULT TRUE,
  proxima_fecha DATE,
  ultima_fecha DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transacciones_presupuesto ON transacciones_recurrentes(presupuesto_id);
CREATE INDEX idx_transacciones_activas ON transacciones_recurrentes(activa);

-- ============================================================================
-- ✅ PASO 9: HABILITAR ROW-LEVEL SECURITY (RLS)
-- 

ALTER TABLE cambios_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumo_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_recurrentes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ✅ PASO 10: CREAR POLÍTICAS RLS
-- 

-- cambios_presupuesto
CREATE POLICY "cambios_select" ON cambios_presupuesto FOR SELECT USING (
  auth.uid() = solicitado_por OR
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

CREATE POLICY "cambios_insert" ON cambios_presupuesto FOR INSERT WITH CHECK (
  auth.uid() = solicitado_por AND
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

CREATE POLICY "cambios_update" ON cambios_presupuesto FOR UPDATE USING (
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

-- consumo_materiales
CREATE POLICY "consumo_select" ON consumo_materiales FOR SELECT USING (
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

CREATE POLICY "consumo_insert" ON consumo_materiales FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

CREATE POLICY "consumo_update" ON consumo_materiales FOR UPDATE USING (
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

-- caja_proyecto
CREATE POLICY "caja_select" ON caja_proyecto FOR SELECT USING (
  auth.uid() IN (SELECT usuario_id FROM proyectos WHERE id = proyecto_id)
);

CREATE POLICY "caja_insert" ON caja_proyecto FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT usuario_id FROM proyectos WHERE id = proyecto_id)
);

CREATE POLICY "caja_update" ON caja_proyecto FOR UPDATE USING (
  auth.uid() IN (SELECT usuario_id FROM proyectos WHERE id = proyecto_id)
);

-- movimientos_caja
CREATE POLICY "movimientos_select" ON movimientos_caja FOR SELECT USING (
  auth.uid() IN (
    SELECT usuario_id FROM proyectos 
    WHERE id = (SELECT proyecto_id FROM caja_proyecto WHERE id = caja_id)
  )
);

CREATE POLICY "movimientos_insert" ON movimientos_caja FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT usuario_id FROM proyectos 
    WHERE id = (SELECT proyecto_id FROM caja_proyecto WHERE id = caja_id)
  )
);

-- checklists_proyecto
CREATE POLICY "checklists_select" ON checklists_proyecto FOR SELECT USING (
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

CREATE POLICY "checklists_insert" ON checklists_proyecto FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

CREATE POLICY "checklists_update" ON checklists_proyecto FOR UPDATE USING (
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

-- items_checklist
CREATE POLICY "items_select" ON items_checklist FOR SELECT USING (
  auth.uid() IN (
    SELECT usuario_id FROM presupuestos 
    WHERE id = (SELECT presupuesto_id FROM checklists_proyecto WHERE id = checklist_id)
  )
);

CREATE POLICY "items_insert" ON items_checklist FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT usuario_id FROM presupuestos 
    WHERE id = (SELECT presupuesto_id FROM checklists_proyecto WHERE id = checklist_id)
  )
);

-- transacciones_recurrentes
CREATE POLICY "transacciones_select" ON transacciones_recurrentes FOR SELECT USING (
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

CREATE POLICY "transacciones_insert" ON transacciones_recurrentes FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

CREATE POLICY "transacciones_update" ON transacciones_recurrentes FOR UPDATE USING (
  auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
);

-- ============================================================================
-- ✅ PASO 11: CREAR FUNCIONES AUXILIARES
-- 

CREATE OR REPLACE FUNCTION calcular_saldo_caja(caja_id UUID)
RETURNS NUMERIC AS $$
  SELECT saldo_inicial + COALESCE(SUM(
    CASE 
      WHEN subtipo IN ('deposito', 'ingreso') THEN monto
      ELSE -monto
    END
  ), 0)
  FROM caja_proyecto
  LEFT JOIN movimientos_caja ON movimientos_caja.caja_id = caja_proyecto.id
  WHERE caja_proyecto.id = calcular_saldo_caja.caja_id
  GROUP BY caja_proyecto.saldo_inicial;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION puede_avanzar_checklist(checklist_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COUNT(*) = 0
  FROM items_checklist
  WHERE checklist_id = puede_avanzar_checklist.checklist_id
  AND requerido = TRUE
  AND completado = FALSE;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- ✅ PASO 12: CREAR TRIGGERS DE AUDITORÍA
-- 

CREATE OR REPLACE FUNCTION actualizar_updated_at_generic()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_cambios BEFORE UPDATE ON cambios_presupuesto
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_consumo BEFORE UPDATE ON consumo_materiales
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_caja BEFORE UPDATE ON caja_proyecto
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_movimientos BEFORE UPDATE ON movimientos_caja
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_checklists BEFORE UPDATE ON checklists_proyecto
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_items BEFORE UPDATE ON items_checklist
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_transacciones BEFORE UPDATE ON transacciones_recurrentes
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_generic();

-- ============================================================================
-- ✅ PASO 13: VERIFICACIÓN FINAL
-- 

-- Verificar que todas las tablas existen
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'cambios_presupuesto',
  'consumo_materiales',
  'caja_proyecto',
  'movimientos_caja',
  'checklists_proyecto',
  'items_checklist',
  'transacciones_recurrentes'
)
ORDER BY tablename;

-- Verificar que las políticas RLS existen
SELECT tablename, policyname, permissive 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'cambios_presupuesto',
  'consumo_materiales',
  'caja_proyecto',
  'movimientos_caja',
  'checklists_proyecto',
  'items_checklist',
  'transacciones_recurrentes'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- FIN - SUPABASE PHASE 3 SQL
-- ============================================================================
