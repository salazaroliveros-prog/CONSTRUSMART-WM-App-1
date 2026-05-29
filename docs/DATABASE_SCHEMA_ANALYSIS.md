# Análisis de Esquema de Base de Datos - CONSTRUSMART WM

## Fecha: 28 de Mayo de 2026
## Análisis: Mapeo de Tablas, Relaciones y Conexiones Bidireccionales

---

## 1. TABLAS DEL SISTEMA (27 tablas identificadas)

### Núcleo de Negocio
| Tabla | Campos Clave | Relaciones | Estado |
|-------|--------------|-----------|--------|
| **clientes** | id, user_id, nombre | ← proyectos, presupuestos | ✅ Implementada |
| **proyectos** | id, user_id, cliente | ← presupuestos, equipos, órdenes_compra | ✅ Implementada |
| **presupuestos** | id, user_id, proyecto_id | ↔ subrenglones, materiales, transacciones | ✅ Implementada |

### Presupuestos (Desglose APU)
| Tabla | Campos Clave | Relaciones | Estado |
|-------|--------------|-----------|--------|
| **subrenglones** | id, presupuesto_id | ← subrenglon_materiales, subrenglon_mano_obra, subrenglon_equipos | ✅ Implementada |
| **subrenglon_materiales** | id, subrenglon_id | ← movimientos_materiales | ✅ Implementada |
| **subrenglon_mano_obra** | id, subrenglon_id | ← empleados | ✅ Implementada |
| **subrenglon_equipos** | id, subrenglon_id | ← equipos | ✅ Implementada |

### Almacén y Materiales
| Tabla | Campos Clave | Relaciones | Estado |
|-------|--------------|-----------|--------|
| **materiales_proyecto** | id, proyecto_id | ← orden_compra_items, movimientos_materiales | ✅ Implementada |
| **movimientos_materiales** | id, proyecto_id | ← materiales_proyecto, subrenglon_materiales | ✅ Implementada |

### Transacciones y Finanzas
| Tabla | Campos Clave | Relaciones | Estado |
|-------|--------------|-----------|--------|
| **transacciones** | id, user_id, tipo | ← presupuestos, empleados | ✅ Implementada |
| **presupuesto_conciliaciones** | id, presupuesto_id | ← partidas_conciliacion | ✅ Implementada |
| **partidas_conciliacion** | id, conciliacion_id | ← presupuesto_conciliaciones | ✅ Implementada |

### Control y Seguimiento
| Tabla | Campos Clave | Relaciones | Estado |
|-------|--------------|-----------|--------|
| **bitacora_avance** | id, presupuesto_id | ← presupuestos | ✅ Implementada |
| **actividades** | id, presupuesto_id, user_id | ← presupuestos | ✅ Implementada |
| **checklist_items** | id, presupuesto_id | ← presupuestos | ✅ Implementada |
| **cambios_presupuesto** | id, presupuesto_id | ← presupuestos | ✅ Implementada |

### Organización y Personal
| Tabla | Campos Clave | Relaciones | Estado |
|-------|--------------|-----------|--------|
| **equipos** | id, user_id | ← equipo_miembros, proyectos | ✅ Implementada |
| **equipo_miembros** | id, equipo_id, user_id | ← equipos | ✅ Implementada |
| **empleados** | id, user_id | ← transacciones, subrenglon_mano_obra | ✅ Implementada |

### Compras y Proveeduría
| Tabla | Campos Clave | Relaciones | Estado |
|-------|--------------|-----------|--------|
| **proveedores** | id, user_id | ← ordenes_compra | ✅ Implementada |
| **ordenes_compra** | id, user_id, proveedor_id, proyecto_id | ← orden_compra_items, recepcion_oc | ✅ Implementada |
| **orden_compra_items** | id, orden_compra_id, material_id | ← recepcion_oc_items | ✅ Implementada |
| **recepcion_oc** | id, orden_compra_id | ← recepcion_oc_items | ✅ Implementada |
| **recepcion_oc_items** | id, recepcion_oc_id, orden_compra_item_id | ← recepcion_oc | ✅ Implementada |

### Datos Auxiliares
| Tabla | Campos Clave | Relaciones | Estado |
|-------|--------------|-----------|--------|
| **renglones** | id, codigo | ← renglon_usage, renglon_precios_historial | ✅ Implementada |
| **renglon_usage** | id, presupuesto_id, renglon_id | ← presupuestos, renglones | ✅ Implementada |
| **renglon_precios_historial** | id, renglon_id | ← renglones | ✅ Implementada |
| **audit_log** | id, user_id | Sistema de auditoría | ✅ Implementada |
| **notificaciones** | id, user_id | Sistema de alertas | ✅ Implementada |
| **device_tokens** | id, user_id | Push notifications | ✅ Implementada |
| **ocr_documentos** | id, user_id | OCR de facturas | ✅ Implementada |

---

## 2. ANÁLISIS DE CONEXIONES BIDIRECCIONALES

### Jerarquía Principal: Presupuesto
```
presupuestos (id, user_id, proyecto_id)
├── subrenglones (presupuesto_id)
│   ├── subrenglon_materiales (subrenglon_id)
│   ├── subrenglon_mano_obra (subrenglon_id)
│   └── subrenglon_equipos (subrenglon_id)
├── cambios_presupuesto (presupuesto_id)
├── bitacora_avance (presupuesto_id)
├── actividades (presupuesto_id)
├── checklist_items (presupuesto_id)
├── renglon_usage (presupuesto_id)
└── transacciones (presupuesto_id) [FK ausente - ERROR]
```

### Jerarquía Secundaria: Proyectos
```
proyectos (id, user_id)
├── ordenes_compra (proyecto_id)
│   ├── orden_compra_items (orden_compra_id)
│   ├── recepcion_oc (orden_compra_id)
│   │   └── recepcion_oc_items (recepcion_oc_id)
├── materiales_proyecto (proyecto_id)
│   └── movimientos_materiales (material_id)
├── equipos (proyecto_id) [FK ausente - ERROR]
└── bitacora_avance (proyecto_id) [FK ausente - ERROR]
```

### Jerarquía Terciaria: Equipos
```
equipos (id, user_id, [proyecto_id - ERROR])
└── equipo_miembros (equipo_id, user_id)
    └── subrenglon_equipos (equipo_id) [FK ausente - ERROR]
```

---

## 3. INCONSISTENCIAS DETECTADAS

### 🔴 CRÍTICAS

1. **`transacciones` SIN Foreign Key a `presupuestos`**
   - Campo: `presupuesto_id` no existe
   - Impacto: No se pueden rastrear gastos a presupuestos específicos
   - Solución: Añadir FK en `transacciones(presupuesto_id)`

2. **`equipos` SIN referencia a `proyectos`**
   - Campo: `proyecto_id` falta en tabla
   - Impacto: Equipos desvinculados de proyectos
   - Solución: Añadir `proyecto_id uuid REFERENCES proyectos(id)`

3. **`subrenglon_equipos` SIN Foreign Key a `equipos`**
   - Campo: `equipo_id` no existe
   - Impacto: Equipos no vinculados a subrenglones
   - Solución: Añadir FK en `subrenglon_equipos(equipo_id)`

4. **`bitacora_avance` tiene FK a `presupuestos` PERO FALTA FK a `proyectos`**
   - Campo: `proyecto_id` no existe
   - Impacto: Bitácoras no vinculadas directamente a proyectos
   - Solución: Añadir `proyecto_id uuid REFERENCES proyectos(id)`

### 🟡 MODERADAS

5. **`orden_compra_items` usa `material_id` pero relación NO es bidireccional**
   - FK existe pero no hay constraint estricto
   - Solución: Asegurar ON DELETE behavior

6. **`movimientos_materiales` tiene `subrenglon_id` pero sin FK explícita**
   - Impacto: Inconsistencia de datos
   - Solución: Agregar FK `REFERENCES subrenglones(id)`

7. **`transacciones` tiene campo `empleado_id` pero `empleados` no referencia de vuelta**
   - Solución: Bidireccionalidad asegurada por RLS

### 🟢 LEVES

8. **`audit_log` sin relaciones explícitas a otras tablas**
   - Intención: Solo registra eventos
   - Solución: Mantener como está

---

## 4. MAPEO DE DATOS: FLUJO DE LECTURA Y ESCRITURA

### Flujo 1: Creación de Presupuesto
```
App → AppContext.addPresupuesto()
  → PresupuestosService.crear()
    → INSERT presupuestos (user_id, proyecto_id, ...)
    → INSERT subrenglones (presupuesto_id, ...) ← Multilateral
      → INSERT subrenglon_materiales (subrenglon_id) ← Auditoría
      → INSERT subrenglon_mano_obra (subrenglon_id)
      → INSERT subrenglon_equipos (subrenglon_id)
    → INSERT renglon_usage (presupuesto_id, renglon_id)
```

### Flujo 2: Gestión de Materiales
```
App → BodegaScreen
  → MaterialesService.agregarMovimiento()
    → INSERT movimientos_materiales (proyecto_id, material_id, ...)
    → UPDATE materiales_proyecto (stock)
```

### Flujo 3: Órdenes de Compra
```
App → ComprasScreen
  → OrdenesCompraService.crear()
    → INSERT ordenes_compra (proveedor_id, proyecto_id, ...)
    → INSERT orden_compra_items (orden_compra_id, material_id, ...)
    → UPDATE materiales_proyecto (cantidad_pendiente) ← Missing
```

### Flujo 4: Recepción y Almacén
```
App → ComprasScreen (Recepción tab)
  → OrdenesCompraService.registrarRecepcion()
    → INSERT recepcion_oc (orden_compra_id)
    → INSERT recepcion_oc_items (recepcion_oc_id, cantidad)
    → UPDATE orden_compra_items (cantidad_recibida)
    → INSERT movimientos_materiales (auto-generated) ← Missing trigger
```

### Flujo 5: Finanzas
```
App → FinancieroScreen
  → FinancieroService.proyectarCashFlow()
    → SELECT transacciones (user_id, presupuesto_id ← Missing FK)
    → SELECT presupuestos (total, ingresos, gastos)
    → Cálculo: cashflow = ingresos - gastos
```

---

## 5. POLÍTICAS RLS REQUERIDAS (Row-Level Security)

### Para cada tabla `table_name`:
```sql
CREATE POLICY "Users see own data"
  ON public.table_name
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Tablas con RLS:
- clientes ✅
- proyectos ✅
- presupuestos ✅
- transacciones ✅
- actividades ✅
- equipos ✅
- equipo_miembros ✅
- empleados ✅
- proveedores ✅
- ordenes_compra ✅
- bitacora_avance ✅
- materiales_proyecto ✅
- movimientos_materiales ✅
- cambios_presupuesto ✅
- notificaciones ✅
- device_tokens ✅
- ocr_documentos ✅
- audit_log ✅

---

## 6. ÍNDICES NECESARIOS (Optimización)

### Índices Primarios:
```sql
CREATE INDEX IF NOT EXISTS idx_presupuestos_user_id ON public.presupuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto_id ON public.presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_subrenglones_presupuesto_id ON public.subrenglones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_presupuesto_id ON public.transacciones(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proyecto_id ON public.ordenes_compra(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_materiales_proyecto_id ON public.materiales_proyecto(proyecto_id);
```

---

## 7. SOLUCIONES RECOMENDADAS

### PASO 1: Correcciones Críticas
```sql
-- A. Agregar FK a transacciones
ALTER TABLE public.transacciones
  ADD COLUMN IF NOT EXISTS presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE SET NULL;

-- B. Agregar proyecto_id a equipos
ALTER TABLE public.equipos
  ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL;

-- C. Agregar equipo_id a subrenglon_equipos
ALTER TABLE public.subrenglon_equipos
  ADD COLUMN IF NOT EXISTS equipo_id uuid REFERENCES public.equipos(id) ON DELETE SET NULL;

-- D. Agregar proyecto_id a bitacora_avance
ALTER TABLE public.bitacora_avance
  ADD COLUMN IF NOT EXISTS proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL;
```

### PASO 2: Agregar Trigger para Movimientos Automáticos
```sql
-- Crear movimiento automático al recibir OC
CREATE OR REPLACE FUNCTION fn_auto_movimiento_recepcion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.movimientos_materiales (
    proyecto_id, material_id, tipo, cantidad, usuario_id, created_at
  )
  SELECT 
    oc.proyecto_id,
    oci.material_id,
    'entrada',
    NEW.cantidad_recibida,
    NEW.user_id,
    now()
  FROM public.recepcion_oc_items roi
  JOIN public.orden_compra_items oci ON roi.orden_compra_item_id = oci.id
  JOIN public.ordenes_compra oc ON oci.orden_compra_id = oc.id
  WHERE roi.id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_movimiento_recepcion
  AFTER INSERT ON public.recepcion_oc_items
  FOR EACH ROW EXECUTE FUNCTION fn_auto_movimiento_recepcion();
```

### PASO 3: Validar Integridad Referencial
```sql
-- Verificar orfandades
SELECT 'presupuestos sin proyecto' as error FROM public.presupuestos WHERE proyecto_id IS NULL LIMIT 1;
SELECT 'transacciones sin presupuesto' as error FROM public.transacciones WHERE presupuesto_id IS NULL LIMIT 1;
SELECT 'equipos sin proyecto' as error FROM public.equipos WHERE proyecto_id IS NULL LIMIT 1;
```

---

## 8. TABLA DE AUDITORÍA SUGERIDA

```sql
CREATE TABLE IF NOT EXISTS public.audit_log_detallado (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  tabla text NOT NULL,
  registro_id uuid NOT NULL,
  operacion text CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
  datos_antes jsonb,
  datos_despues jsonb,
  timestamp timestamptz DEFAULT now(),
  ip_address inet
);
```

---

## 9. VALIDACIÓN FINAL

✅ **27 Tablas Identificadas**
✅ **Estructura Jerárquica Válida**
⚠️ **4 Inconsistencias Críticas Detectadas**
⚠️ **3 Inconsistencias Moderadas Detectadas**
✅ **RLS Policy Structure in Place**
⚠️ **Triggers Parcialmente Implementados**

---

**Recomendación Final:**
Ejecutar `SUPABASE_MASTER_SCHEMA_v2.sql` (próximo archivo) que incorpora todas las correcciones.
