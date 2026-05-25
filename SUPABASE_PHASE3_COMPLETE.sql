/**
 * SUPABASE PHASE 3 - SQL MAESTRO COMPLETO
 * 
 * Orden de ejecución:
 * 1. Crear enumeraciones (ENUM types)
 * 2. Crear tablas principales
 * 3. Crear índices para performance
 * 4. Crear políticas de Row-Level Security (RLS)
 * 5. Crear funciones auxiliares
 * 
 * Tiempo estimado: 5-10 minutos
 * 
 * INSTRUCCIONES:
 * - Ejecutar SECUENCIALMENTE en el SQL Editor de Supabase
 * - NO ejecutar todo de una vez
 * - Verificar que cada sección termine exitosamente
 * - Los comentarios con -- indican pauses donde verificar
 * 
 * @author CONSTRUSMART WM
 * @date 2026-05-25
 */

-- ============================================================================
-- SECCIÓN 1: ENUMERACIONES (ENUM TYPES)
-- ============================================================================

-- Estados de órdenes de cambio
CREATE TYPE cambio_estado AS ENUM ('pendiente', 'aprobada', 'rechazada', 'cancelada');

-- Estados de checklist
CREATE TYPE checklist_estado AS ENUM ('pendiente', 'en_progreso', 'completado', 'bloqueado');

-- Fases del proyecto
CREATE TYPE fase_proyecto AS ENUM ('planeación', 'ejecución', 'finalizado');

-- Subtipos de movimientos de caja
CREATE TYPE movimiento_subtipo AS ENUM ('retiro', 'deposito', 'gasto', 'ingreso', 'ajuste');

-- Frecuencias de transacciones recurrentes
CREATE TYPE frecuencia_transaccion AS ENUM ('diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'anual');

-- Frecuencia de pagos
CREATE TYPE frecuencia_pago AS ENUM ('unica', 'diaria', 'semanal', 'mensual', 'trimestral', 'anual');

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
  cambios JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de cambios por línea
  
  -- Impacto financiero
  impacto_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  porcentaje_impacto NUMERIC(5,2) NOT NULL DEFAULT 0,
  requiere_aprobacion_especial BOOLEAN DEFAULT FALSE,
  
  -- Estado y auditoría
  estado cambio_estado DEFAULT 'pendiente',
  solicitado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  solicitado_fecha TIMESTAMPTZ DEFAULT now(),
  aprobado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aprobado_fecha TIMESTAMPTZ,
  aprobacion_comentarios TEXT,
  rechazado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rechazado_fecha TIMESTAMPTZ,
  razon_rechazo TEXT,
  
  -- Timestamps
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

-- COMENTARIO: Verificar que tabla cambios_presupuesto se creó correctamente

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
  
  -- Desperdicio
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

CREATE INDEX idx_consumo_presupuesto ON consumo_materiales(presupuesto_id);
CREATE INDEX idx_consumo_renglon ON consumo_materiales(renglon_id);
CREATE INDEX idx_consumo_alerta ON consumo_materiales(alerta_desperdicio, alerta_costo);

-- COMENTARIO: Verificar que tabla consumo_materiales se creó correctamente

-- ============================================================================
-- SECCIÓN 4: TABLA - CAJA DEL PROYECTO
-- ============================================================================

CREATE TABLE IF NOT EXISTS caja_proyecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  
  -- Saldos
  saldo_inicial NUMERIC(15,2) NOT NULL DEFAULT 0,
  saldo_sistema_actual NUMERIC(15,2) DEFAULT 0,
  saldo_real_actual NUMERIC(15,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT saldo_unico_por_proyecto UNIQUE(proyecto_id)
);

CREATE INDEX idx_caja_proyecto ON caja_proyecto(proyecto_id);

-- COMENTARIO: Verificar que tabla caja_proyecto se creó correctamente

-- ============================================================================
-- SECCIÓN 5: TABLA - MOVIMIENTOS DE CAJA
-- ============================================================================

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID NOT NULL REFERENCES caja_proyecto(id) ON DELETE CASCADE,
  
  -- Datos del movimiento
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  descripcion TEXT NOT NULL,
  subtipo movimiento_subtipo NOT NULL,
  concepto VARCHAR(100),
  
  -- Montos
  monto NUMERIC(15,2) NOT NULL,
  saldo_sistema_antes NUMERIC(15,2) NOT NULL,
  saldo_sistema_despues NUMERIC(15,2) NOT NULL,
  saldo_real_confirmado NUMERIC(15,2),
  
  -- Diferencia de reconciliación
  diferencia NUMERIC(15,2) GENERATED ALWAYS AS 
    (saldo_sistema_despues - COALESCE(saldo_real_confirmado, saldo_sistema_despues)) STORED,
  
  -- Auditoría
  registrado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conciliado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conciliado_fecha TIMESTAMPTZ,
  motivo_diferencia TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT monto_positivo CHECK (monto > 0)
);

CREATE INDEX idx_movimientos_caja ON movimientos_caja(caja_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_caja(fecha);
CREATE INDEX idx_movimientos_subtipo ON movimientos_caja(subtipo);

-- COMENTARIO: Verificar que tabla movimientos_caja se creó correctamente

-- ============================================================================
-- SECCIÓN 6: TABLA - CHECKLISTS DE CALIDAD
-- ============================================================================

CREATE TABLE IF NOT EXISTS checklists_proyecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  
  -- Identificación
  fase fase_proyecto NOT NULL,
  tipologia VARCHAR(50) NOT NULL, -- residencial, comercial, industrial, obra-civil
  
  -- Datos del checklist
  estado checklist_estado DEFAULT 'pendiente',
  puede_avanzar BOOLEAN DEFAULT FALSE,
  intento_avance_sin_completar INT DEFAULT 0,
  
  -- Auditoría
  creado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fase_unica_por_presupuesto UNIQUE(presupuesto_id, fase)
);

CREATE INDEX idx_checklists_presupuesto ON checklists_proyecto(presupuesto_id);
CREATE INDEX idx_checklists_fase ON checklists_proyecto(fase);

-- COMENTARIO: Verificar que tabla checklists_proyecto se creó correctamente

-- ============================================================================
-- SECCIÓN 7: TABLA - ITEMS DE CHECKLIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS items_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists_proyecto(id) ON DELETE CASCADE,
  
  -- Datos del item
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL,
  requerido BOOLEAN DEFAULT TRUE,
  
  -- Estado de completación
  completado BOOLEAN DEFAULT FALSE,
  completado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha_completado TIMESTAMPTZ,
  
  -- Evidencia
  foto_evidencia JSONB DEFAULT '[]'::jsonb, -- Array de URLs
  firma_digital TEXT, -- Base64 o URL a firma
  notas TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT orden_unico_por_checklist UNIQUE(checklist_id, orden)
);

CREATE INDEX idx_items_checklist ON items_checklist(checklist_id);
CREATE INDEX idx_items_completado ON items_checklist(completado);

-- COMENTARIO: Verificar que tabla items_checklist se creó correctamente

-- ============================================================================
-- SECCIÓN 8: TABLA - TRANSACCIONES RECURRENTES (Para Cash Flow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transacciones_recurrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  
  -- Datos
  descripcion TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'ingreso' o 'egreso'
  monto NUMERIC(15,2) NOT NULL,
  frecuencia frecuencia_transaccion NOT NULL,
  
  -- Control
  activa BOOLEAN DEFAULT TRUE,
  proxima_fecha DATE,
  ultima_fecha DATE,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transacciones_presupuesto ON transacciones_recurrentes(presupuesto_id);
CREATE INDEX idx_transacciones_activas ON transacciones_recurrentes(activa);

-- COMENTARIO: Verificar que tabla transacciones_recurrentes se creó correctamente

-- ============================================================================
-- SECCIÓN 9: CREAR ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================

-- Índices en presupuestos (asumiendo que ya existen)
CREATE INDEX IF NOT EXISTS idx_presupuestos_fase ON presupuestos(fase);
CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto ON presupuestos(proyecto);
CREATE INDEX IF NOT EXISTS idx_presupuestos_usuario ON presupuestos(usuario_id);

-- Índices en presupuesto_lineas (asumiendo que ya existen)
CREATE INDEX IF NOT EXISTS idx_lineas_presupuesto ON presupuesto_lineas(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_lineas_tipo ON presupuesto_lineas(tipo);

-- ============================================================================
-- SECCIÓN 10: HABILITAR ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las nuevas tablas
ALTER TABLE cambios_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumo_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_recurrentes ENABLE ROW LEVEL SECURITY;

-- COMENTARIO: Verificar que RLS está habilitado

-- ============================================================================
-- SECCIÓN 11: POLÍTICAS RLS - CAMBIOS PRESUPUESTO
-- ============================================================================

-- Los usuarios pueden ver cambios de presupuestos que crearon o que les pertenecen
CREATE POLICY "cambios_presupuesto_select" ON cambios_presupuesto
  FOR SELECT USING (
    auth.uid() = solicitado_por OR
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

-- Solo quien solicita puede crear cambios
CREATE POLICY "cambios_presupuesto_insert" ON cambios_presupuesto
  FOR INSERT WITH CHECK (
    auth.uid() = solicitado_por AND
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

-- Solo aprobadores pueden actualizar estado
CREATE POLICY "cambios_presupuesto_update" ON cambios_presupuesto
  FOR UPDATE USING (
    auth.uid() IN (SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id)
  );

-- COMENTARIO: Verificar que políticas RLS de cambios_presupuesto se crearon

-- ============================================================================
-- SECCIÓN 12: POLÍTICAS RLS - CONSUMO MATERIALES
-- ============================================================================

CREATE POLICY "consumo_materiales_select" ON consumo_materiales
  FOR SELECT USING (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

CREATE POLICY "consumo_materiales_insert" ON consumo_materiales
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

CREATE POLICY "consumo_materiales_update" ON consumo_materiales
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

-- COMENTARIO: Verificar que políticas RLS de consumo_materiales se crearon

-- ============================================================================
-- SECCIÓN 13: POLÍTICAS RLS - CAJA Y MOVIMIENTOS
-- ============================================================================

CREATE POLICY "caja_proyecto_select" ON caja_proyecto
  FOR SELECT USING (
    auth.uid() IN (
      SELECT usuario_id FROM proyectos WHERE id = proyecto_id
    )
  );

CREATE POLICY "caja_proyecto_insert" ON caja_proyecto
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT usuario_id FROM proyectos WHERE id = proyecto_id
    )
  );

CREATE POLICY "caja_proyecto_update" ON caja_proyecto
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT usuario_id FROM proyectos WHERE id = proyecto_id
    )
  );

-- Movimientos de caja
CREATE POLICY "movimientos_caja_select" ON movimientos_caja
  FOR SELECT USING (
    auth.uid() IN (
      SELECT usuario_id FROM proyectos 
      WHERE id = (SELECT proyecto_id FROM caja_proyecto WHERE id = caja_id)
    )
  );

CREATE POLICY "movimientos_caja_insert" ON movimientos_caja
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT usuario_id FROM proyectos 
      WHERE id = (SELECT proyecto_id FROM caja_proyecto WHERE id = caja_id)
    )
  );

-- COMENTARIO: Verificar que políticas RLS de caja se crearon

-- ============================================================================
-- SECCIÓN 14: POLÍTICAS RLS - CHECKLISTS
-- ============================================================================

CREATE POLICY "checklists_select" ON checklists_proyecto
  FOR SELECT USING (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

CREATE POLICY "checklists_insert" ON checklists_proyecto
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

CREATE POLICY "checklists_update" ON checklists_proyecto
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

-- Items del checklist
CREATE POLICY "items_checklist_select" ON items_checklist
  FOR SELECT USING (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos 
      WHERE id = (SELECT presupuesto_id FROM checklists_proyecto WHERE id = checklist_id)
    )
  );

CREATE POLICY "items_checklist_insert" ON items_checklist
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos 
      WHERE id = (SELECT presupuesto_id FROM checklists_proyecto WHERE id = checklist_id)
    )
  );

-- COMENTARIO: Verificar que políticas RLS de checklists se crearon

-- ============================================================================
-- SECCIÓN 15: POLÍTICAS RLS - TRANSACCIONES RECURRENTES
-- ============================================================================

CREATE POLICY "transacciones_recurrentes_select" ON transacciones_recurrentes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

CREATE POLICY "transacciones_recurrentes_insert" ON transacciones_recurrentes
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

CREATE POLICY "transacciones_recurrentes_update" ON transacciones_recurrentes
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT usuario_id FROM presupuestos WHERE id = presupuesto_id
    )
  );

-- COMENTARIO: Verificar que políticas RLS de transacciones se crearon

-- ============================================================================
-- SECCIÓN 16: CREAR FUNCIONES AUXILIARES
-- ============================================================================

-- Función para calcular saldo de caja en tiempo real
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

-- Función para verificar si un checklist puede avanzar de fase
CREATE OR REPLACE FUNCTION puede_avanzar_checklist(checklist_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COUNT(*) = 0
  FROM items_checklist
  WHERE checklist_id = puede_avanzar_checklist.checklist_id
  AND requerido = TRUE
  AND completado = FALSE;
$$ LANGUAGE SQL STABLE;

-- COMENTARIO: Verificar que las funciones auxiliares se crearon

-- ============================================================================
-- SECCIÓN 17: CREAR TRIGGERS PARA AUDITORÍA
-- ============================================================================

-- Trigger para actualizar updated_at en cambios_presupuesto
CREATE OR REPLACE FUNCTION actualizar_updated_at_cambios()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_cambios
  BEFORE UPDATE ON cambios_presupuesto
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_cambios();

-- Trigger similar para otras tablas
CREATE OR REPLACE FUNCTION actualizar_updated_at_generic()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_updated_consumo
  BEFORE UPDATE ON consumo_materiales
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_caja
  BEFORE UPDATE ON caja_proyecto
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_movimientos
  BEFORE UPDATE ON movimientos_caja
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_checklists
  BEFORE UPDATE ON checklists_proyecto
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_items
  BEFORE UPDATE ON items_checklist
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_generic();

CREATE TRIGGER trigger_updated_transacciones
  BEFORE UPDATE ON transacciones_recurrentes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_generic();

-- COMENTARIO: Verificar que los triggers se crearon

-- ============================================================================
-- SECCIÓN 18: VERIFICACIÓN FINAL
-- ============================================================================

-- Listar todas las tablas creadas
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
);

-- Listar todas las políticas RLS
SELECT schemaname, tablename, policyname, permissive 
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
);

-- ============================================================================
-- FIN - SUPABASE PHASE 3 SQL MAESTRO
-- ============================================================================
-- 
-- Si llegaste aquí, ¡todas las tablas están creadas correctamente!
-- 
-- Próximos pasos:
-- 1. Verificar que no hay errores en la consola de Supabase
-- 2. Actualizar tipos TypeScript en src/types/supabase.ts
-- 3. Regenerar tipos: supabase gen types typescript --local
-- 4. Deployer a producción
-- 
-- Documentación: https://supabase.com/docs
