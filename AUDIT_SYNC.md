# Auditoría de Sincronización Frontend ↔ Backend

Fecha: 2026-05-26
Objetivo: Verificar que cada campo TypeScript tenga su columna SQL correspondiente y que las transformaciones de ida/vuelta sean correctas.

---

## 1. clientes

| App Interface (Cliente) | DB → App (dbToCliente) | App → DB (clienteToDb) | SQL Column | ✅/❌ |
|---|---|---|---|---|
| **id** (string) | ✅ `db.id` | — | `id uuid PK` | ✅ |
| **user_id** ❌ *missing* | — | — | `user_id uuid NOT NULL` | ❌ No expuesto en interfaz |
| **nombre** (string) | ✅ `db.nombre` | ✅ | `nombre text NOT NULL` | ✅ |
| **telefono** (string) | ✅ `db.telefono` | ✅ | `telefono text` | ✅ |
| **email** (string) | ✅ `db.email` | ✅ | `email text` | ✅ |
| **direccion** (string) | ✅ `db.direccion` | ✅ | `direccion text` | ✅ |
| **tipoProyecto** (string) | ✅ `db.tipo_proyecto` | ✅ `tipo_proyecto` | `tipo_proyecto text` | ✅ |
| **estado** (enum) | ✅ | ✅ | `estado text CHECK(...)` | ✅ |
| **notas** (string) | ✅ | ✅ | `notas text` | ✅ |
| **fecha** (string) | ✅ | `out.fecha` → null si vacío | `fecha date` | ✅ |
| **created_at** ❌ *missing* | — | — | `created_at timestamptz` | ❌ No expuesto |

**Problemas:**
- `user_id` no está en la interfaz `Cliente` (no se necesita para lectura porque viene del contexto, pero debería documentarse)
- `created_at` no está expuesto

---

## 2. proyectos

| App Interface (Proyecto) | DB → App (dbToProyecto) | App → DB (proyectoToDb) | SQL Column | ✅/❌ |
|---|---|---|---|---|
| **id** | ✅ | — | `id uuid PK` | ✅ |
| **user_id** ❌ *missing* | — | — | `user_id uuid NOT NULL` | ❌ |
| **nombre** | ✅ | ✅ | `nombre text NOT NULL` | ✅ |
| **cliente** | ✅ | ✅ | `cliente text` | ✅ |
| **tipo** | ✅ | ✅ | `tipo text` | ✅ |
| **estado** (enum 5 vals) | ✅ | ✅ | `estado text CHECK(5 vals)` | ✅ |
| **presupuestoTotal** | ✅ `presupuesto_total` | ✅ | `presupuesto_total numeric` | ✅ |
| **avanceFisico** | ✅ `avance_fisico` | ✅ | `avance_fisico numeric` | ✅ |
| **avanceFinanciero** | ✅ `avance_financiero` | ✅ | `avance_financiero numeric` | ✅ |
| **ingresos** | ✅ | ✅ | `ingresos numeric` | ✅ |
| **gastos** | ✅ | ✅ | `gastos numeric` | ✅ |
| **pendienteAportar** | ✅ `pendiente_aportar` | ✅ | `pendiente_aportar numeric` | ✅ |
| **fechaInicio** | ✅ `fecha_inicio` | `out.fecha_inicio` / null | `fecha_inicio date` | ✅ |
| **fechaFin** | ✅ `fecha_fin` | `out.fecha_fin` / null | `fecha_fin date` | ✅ |
| **created_at** ❌ | — | — | `created_at timestamptz` | ❌ No expuesto |

---

## 3. presupuestos — PROBLEMAS DETECTADOS

| App Interface (Presupuesto) | DB → App (dbToPresupuesto) | App → DB (presupuestoToDb) | SQL Column | ✅/❌ |
|---|---|---|---|---|
| **id** | ✅ | — | `id uuid PK` | ✅ |
| **user_id** | ✅ `db.user_id` | — (se añade aparte) | `user_id uuid NOT NULL` | ✅ |
| **proyecto** | ✅ | ✅ | `proyecto text NOT NULL` | ✅ |
| **cliente** | ✅ | ✅ | `cliente text` | ✅ |
| **ubicacion** | ✅ | ✅ | `ubicacion text` | ✅ |
| **tipologia** | ✅ | ✅ | `tipologia text` | ✅ |
| **fase** | ✅ | ✅ | `fase text CHECK(4 vals)` | ✅ |
| **estado** ❌ | ❌ No existe en DB | ❌ | ❌ No existe en esquema | **❌ phantom field** |
| **proyecto_nombre** ❌ | ❌ No existe en DB | ❌ | ❌ No existe | **❌ phantom field** |
| **proyectoId** | ✅ `proyecto_id` | `out.proyecto_id` / null | `proyecto_id text` | ✅ |
| **factor_indirectos** | ✅ | ✅ | `factor_indirectos numeric` | ✅ |
| **factor_administrativos** | ✅ | ✅ | `factor_administrativos numeric` | ✅ |
| **factor_imprevistos** | ✅ | ✅ | `factor_imprevistos numeric` | ✅ |
| **factor_utilidad** | ✅ | ✅ | `factor_utilidad numeric` | ✅ |
| **lineas** | ✅ | ✅ | `lineas jsonb` | ✅ |
| **avanceFisico** | ✅ `avance_fisico` | ✅ | `avance_fisico numeric` | ✅ |
| **avance** ❌ | ❌ No existe en DB | ❌ | ❌ No existe | **❌ phantom field** |
| **avanceFinanciero** | ✅ `avance_financiero` | ✅ | `avance_financiero numeric` | ✅ |
| **ingresos** | ✅ | ✅ | `ingresos numeric` | ✅ |
| **gastos** | ✅ | ✅ | `gastos numeric` | ✅ |
| **pendienteAportar** | ✅ `pendiente_aportar` | ✅ | `pendiente_aportar numeric` | ✅ |
| **total** | ✅ | ✅ | `total numeric` | ✅ |
| **costo_directo** | ✅ mapeado | ✅ mapeado en `presupuestoToDb` (FIXED) | `costo_directo numeric` | ✅ |
| **dias_duracion** ❌ | ❌ No existe en DB | ❌ | ❌ No existe | **❌ phantom field** |
| **fechaInicio** | ✅ `fecha_inicio` | `out.fecha_inicio` / null | `fecha_inicio date` | ✅ |
| **fechaFin** | ✅ `fecha_fin` | `out.fecha_fin` / null | `fecha_fin date` | ✅ |
| **created_at** | ✅ | — | `created_at timestamptz` | ✅ |
| **updated_at** | ✅ `db.updated_at` | se añade en `updatePresupuesto` | `updated_at timestamptz` | ✅ |

### ❌ Problemas críticos en `presupuestoToDb` (línea 485-507):
**NO mapea `costo_directo`** — si alguien llama `updatePresupuesto(id, { costo_directo: 5000 })`, el valor se pierde.

### ❌ Phantom fields en interfaz `Presupuesto`:
- `estado` (línea 187) — no existe en DB, parece confundido con `fase`
- `proyecto_nombre` (línea 182) — no existe en DB
- `avance` (línea 199) — no existe en DB, confundido con `avanceFisico`/`avance_fisico`
- `dias_duracion` (línea 205) — no existe en DB, debería ser computed property

### ❌ `CreatePresupuestoInput` (línea 271-283) no incluye `costo_directo`:
`addPresupuesto` lo hardcodea a 0 (línea 932).

---

## 4. transacciones

| App Interface (Transaccion) | DB → App | App → DB | SQL Column | ✅/❌ |
|---|---|---|---|---|
| **id** | ✅ | — | `id uuid PK` | ✅ |
| **user_id** ❌ | — | — | `user_id uuid NOT NULL` | ❌ No expuesto |
| **tipo** | ✅ | ✅ `out.tipo` | `tipo text CHECK(...)` | ✅ |
| **descripcion** | ✅ | ✅ | `descripcion text` | ✅ |
| **cantidad** | ✅ | ✅ | `cantidad numeric` | ✅ |
| **unidad** | ✅ | ✅ | `unidad text` | ✅ |
| **categoria** | ✅ | ✅ | `categoria text CHECK(11 vals)` | ✅ |
| **costoUnitario** | ✅ `costo_unitario` | ✅ | `costo_unitario numeric` | ✅ |
| **costoTotal** | ✅ `costo_total` | ✅ | `costo_total numeric` | ✅ |
| **fecha** | ✅ | ✅ | `fecha date` | ✅ |
| **proyectoId** | ✅ `proyecto_id` | ✅ | `proyecto_id text` | ✅ |
| **created_at** ❌ | — | — | `created_at timestamptz` | ❌ No expuesto |

---

## 5. actividades

| App Interface | DB → App | App → DB | SQL Column | ✅/❌ |
|---|---|---|---|---|
| **id** | ✅ | — | ✅ | ✅ |
| **user_id** ❌ | — | — | `user_id uuid NOT NULL` | ❌ No expuesto |
| **titulo** | ✅ | ✅ | `titulo text NOT NULL` | ✅ |
| **fecha** | ✅ | ✅ | `fecha date NOT NULL` | ✅ |
| **hora** | ✅ | ✅ | `hora text` | ✅ |
| **descripcion** | ✅ | ✅ | `descripcion text` | ✅ |
| **presupuestoId** | ✅ `presupuesto_id` | `out.presupuesto_id` / null | `presupuesto_id uuid` | ✅ |
| **created_at** ❌ | — | — | `created_at timestamptz` | ❌ No expuesto |

---

## 6. equipos

| App Interface (Equipo) | DB → App | App → DB | SQL Column | ✅/❌ |
|---|---|---|---|---|
| **id** | ✅ | — | ✅ | ✅ |
| **nombre** | ✅ | ✅ | `nombre text NOT NULL` | ✅ |
| **userId** (camelCase) | ✅ `db.user_id` | **❌** `equipoToDb` NO mapea `userId` → `user_id` | `user_id uuid NOT NULL` | ✅ (se añade aparte en addEquipo) |
| **estado** | ✅ | ✅ | `estado text CHECK(...)` | ✅ |
| **descripcion** | ✅ | ✅ | `descripcion text` | ✅ |
| **created_at** | ✅ | — | `created_at timestamptz` | ✅ |

---

## 7. equipo_miembros

| App Interface (EquipoMiembro) | DB → App | App → DB | SQL Column | ✅/❌ |
|---|---|---|---|---|
| **id** | ✅ | — | ✅ | ✅ |
| **equipoId** | ✅ `db.equipo_id` | ❌ `equipoMiembroToDb` NO mapea `equipoId` | `equipo_id uuid NOT NULL` | ✅ (se añade aparte) |
| **userId** | ✅ `db.user_id` | ❌ NO mapea `userId` | `user_id uuid NOT NULL` | ✅ (se añade aparte) |
| **rol** | ✅ | ✅ | `rol text CHECK(...)` | ✅ |
| **created_at** | ✅ | — | ✅ | ✅ |

---

## 8. Feature Hooks

### useChangeOrders — `cambios_presupuesto`
| Campo SQL | App escribe | Problema |
|---|---|---|
| `aprobado_por` | Se setea al CREAR la orden (userId) | ❌ Debería ser `null` hasta que se apruebe |
| `presupuesto_id` | ✅ | ✅ |
| `version` | ✅ | ✅ |
| `cambios` | ✅ | ✅ |
| `motivo` | ✅ | ✅ |
| `estado` | ✅ | ✅ |

### useChecklistCalidad — `checklist_items`
| Campo SQL | App escribe | Problema |
|---|---|---|
| `presupuesto_id` | ✅ | ✅ |
| `fase` | ✅ | ✅ |
| `item` | ✅ | ✅ |
| `completado` | ✅ | ✅ |
| `completado_por` | ❌ Nunca se escribe | ❌ Falta registrar quién completa |
| `completado_en` | ❌ Nunca se escribe | ❌ Falta registrar cuándo |

### useTrazabilidadMateriales — `materiales_proyecto` + `movimientos_materiales`
| Campo SQL | App escribe | Problema |
|---|---|---|
| `materiales_proyecto` | ✅ Todos los campos básicos | ✅ |
| `movimientos_materiales` | ✅ | ✅ |

### useConciliacionBancaria — `conciliaciones`
| Campo SQL | App escribe | Problema |
|---|---|---|
| `id` | Usa `proyecto_id` como id | ❌ `conciliaciones.id` es UUID, no proyecto_id |
| `user_id` | ✅ | ✅ |
| `banco` | ✅ Siempre 'Caja chica' | ⚠️ Hardcodeado |
| `periodo` | ✅ | ✅ |
| `saldo_libros` | ✅ | ✅ |
| `saldo_banco` | ✅ | ✅ |

---

## Resumen de Hallazgos

### ❌ Críticos (producen datos incorrectos)
1. **`costo_directo` no se mapea en `presupuestoToDb`** — las actualizaciones perderán este campo
2. **`CreatePresupuestoInput` no incluye `costo_directo`** — hardcodeado a 0 en addPresupuesto
3. **`useConciliacionBancaria` usa `proyecto_id` como `conciliaciones.id`** — conflictos de UUID
4. **`useChangeOrders` setea `aprobado_por` al crear** — debería ser null hasta aprobar

### ⚠️ Moderados (phantom fields)
5. **`Presupuesto.estado`** — no existe en DB, parece confundido con `fase`
6. **`Presupuesto.proyecto_nombre`** — no existe en DB
7. **`Presupuesto.avance`** — no existe en DB, duplicado de `avanceFisico`
8. **`Presupuesto.dias_duracion`** — no existe en DB, debería ser computed

### 🔧 Menores
9. **`user_id`** y **`created_at`** no expuestos en interfaces `Cliente`, `Proyecto`, `Transaccion`, `Actividad`
10. **`equipoToDb`** no mapea `userId` → `user_id`
11. **`equipoMiembroToDb`** no mapea `equipoId` → `equipo_id` ni `userId` → `user_id`
12. **`useChecklistCalidad`** no escribe `completado_por` ni `completado_en`
