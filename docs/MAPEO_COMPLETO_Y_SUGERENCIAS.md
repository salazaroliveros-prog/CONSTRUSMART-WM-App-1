# MAPEO COMPLETO DE LA APLICACIÓN CONSTRUSMART WM

## Análisis a nivel molecular: componentes, conexiones e inconsistencias

---

## 1. DASHBOARD (Dashboard.tsx — 596 líneas)

### Componentes internos
| Componente | Propósito | Conexión | Estado |
|------------|-----------|----------|--------|
| `KPI` | Tarjeta métrica con icono, label, valor, color degradado | Recibe props | ✅ |
| `ChartCard` | Contenedor de gráfica con título, drag & drop, ocultar | `onDrop`, `onRemove`, `span`, `height` | ✅ |
| `GanttView` | Diagrama de Gantt general | `presupuestosFiltrados` | ✅ |
| `ProjectHeatMap` | Mapa de calor de rentabilidad | `presupuestos`, `transacciones` | ✅ |
| `AgenteInteligente.diagnosticarProyecto()` | Alertas de proyectos | `presupuestos`, `transacciones` | ✅ |

### Charts (18 definiciones)
| ID | Tipo | Data Source | ¿Reacciona a filtro proyecto? |
|-----|------|-------------|------|
| kpi | KPIs | `stats` computado de `transaccionesFiltradas` + `presupuestosFiltrados` | ✅ |
| quick-entry | Formulario | `addTransaccion` | ✅ |
| curvas | Curva S (AreaChart) | `CoreEngineService.calcularCurvaS()` | ✅ |
| gantt | GanttView | `presupuestosFiltrados` | ✅ |
| fase | PieChart | `presupuestosFiltrados` | ✅ |
| avance | BarChart | `presupuestosFiltrados` | ✅ |
| flujo-caja | LineChart | `transaccionesFiltradas` | ✅ |
| gastos-cat | PieChart | `transaccionesFiltradas` | ✅ |
| comp-mensual | BarChart | `transaccionesFiltradas` | ✅ |
| ingresos-proy | BarChart | `transaccionesFiltradas` + `presupuestos` | ✅ |
| balance-acum | LineChart | `flujoMensual` acumulado | ✅ |
| heatmap | ProjectHeatMap | `presupuestos` | ✅ |
| alertas | Lista | `AgenteInteligente` | ✅ |
| gauge-rent | SVG Gauge | `stats.rentabilidad` | ✅ |

### Conexiones rotas
- Ninguna. Todas las gráficas reaccionan al filtro de proyecto.

### Inconsistencias
- `useEffect` para alertas (línea 155) usa `presupuestos` completo en lugar de `presupuestosFiltrados`. Las alertas se calculan para TODOS los proyectos aunque el filtro esté activo. **Bug menor:** las alertas no se filtran por proyecto.

---

## 2. CLIENTES (ClientesScreen — features/clientes/)

### Componentes
| Componente | Propósito | Conexión |
|------------|-----------|----------|
| `ClientesScreen` | CRUD completo de clientes | `AppContext.clientes` → `PresupuestosService` |
| Modal de edición | Formulario en línea | `addCliente`/`updateCliente`/`deleteCliente` |

### Conexiones rotas
- Ninguna. CRUD completo.

---

## 3. PRESUPUESTOS (PresupuestoScreen — 1245 líneas)

### Componentes
| Componente | Propósito | Conexión |
|------------|-----------|----------|
| `PresupuestoScreen` | Motor APU completo | `AppContext.presupuestos`, `addPresupuesto`, `updatePresupuesto` |
| `RenglonCard` (React.memo) | Fila de renglón colapsable con APU expandible | `linea`, `apu`, `isOpen`, `onToggle` |
| `PanelAPUPredictor` | Sugerencias de IA | `presupuestosHistorico`, `tipologia` |
| `ChecklistPanel` | Checklist por fase | `presupuestoId` |
| `MaterialesPanel` | Materiales del proyecto | `presupuestoId` |
| `BitacoraAvancePanel` | Registro de avance | `presupuestoId`, `onAvanceChange` |
| `calcularAPU()` | Cálculo de costos unitarios | `linea` → `costoMaterial`, `costoManoObra`, `costoHerramienta` |
| `getDimensionLabels()` | Dimensiones por tipo de obra | `descripcion` |
| Memoria de cálculo | Dimensional: veces, largo, ancho, alto | `linea.memoriaCalculo` → `cantidad` |

### Conexiones rotas
- `handleSugerirFactores()` llama a `sugerirFactores(tipologia)` que devuelve valores, pero nunca los persiste en la DB. Solo actualiza el estado local. **Inconsistencia:** al recargar la página se pierden.
- `handleExportPDF()` usa `exportPresupuestoPDF()` que requiere tipo de documento (admin/cliente). No hay selector de tipo de PDF. **Bug:** siempre exporta PDF admin.
- `loadMateriales()` en MaterialesPanel puede fallar si `presupuestoId` es null (recién creado). **Bug potencial:** error silencioso.

---

## 4. PROYECTOS (ProyectosScreen — features/proyectos/)

### Componentes
| Componente | Propósito | Conexión |
|------------|-----------|----------|
| `ProyectosScreen` | Gestión de proyectos por fase | `AppContext.presupuestos` (lee de tabla `presupuestos`) |
| `ConfirmDialog` | Confirmación de eliminación | `confirmDeleteId` |
| Botón "Cargar Prueba" | Seed data | `supabase.from('presupuestos').insert()` |

### Conexiones rotas
- La UI lee de la tabla `presupuestos` (no de `proyectos`). Esto es correcto porque la tabla `proyectos` es secundaria. **Documentar:**
  - **Tabla `presupuestos`**: proyectos con APU, fases, línea base financiera
  - **Tabla `proyectos`**: metadatos del proyecto (nombre, cliente, fechas)
  - **Falta conexión**: cuando se crea un presupuesto, debería sincronizarse automáticamente con la tabla `proyectos`

---

## 5. SEGUIMIENTO (SeguimientoScreen — 534 líneas)

### Componentes/Charts (15 definiciones)
| ID | Tipo | Data Source | ¿Reactivo al proyecto? |
|-----|------|-------------|------------------------|
| kpi | KPIs | `stats` con filtro | ✅ |
| avance-bar | BarChart | `presupuestosFiltrados` → ejecución | ✅ |
| fase-donut | PieChart | `presupuestosFiltrados` | ✅ |
| presup-vs-real | BarChart | `presupuestosFiltrados` + `transaccionesFiltradas` | ✅ |
| evo-avance | LineChart | `avanceSemanal` (simulado) | ⚠️ Simulado, no real |
| costos-acum | AreaChart | `transaccionesFiltradas` | ✅ |
| flujo-caja | LineChart | `transaccionesFiltradas` | ✅ |
| gastos-cat | PieChart | `transaccionesFiltradas` | ✅ |
| comp-mensual | BarChart | `transaccionesFiltradas` | ✅ |
| ingresos-proy | BarChart | `transaccionesFiltradas` + `presupuestosFiltrados` | ✅ |
| margen-mensual | LineChart | `transaccionesFiltradas` | ✅ |
| gantt | GanttView | `selectedProyecto` | ✅ |
| ruta-critica | Lista CPM | `GanttService.calcularRutaCritica()` | ✅ |
| planilla | Lista pagos | `selectedProyecto` + `transacciones` (mano-obra) | ✅ |
| presup-vs-planilla | BarChart | `selectedProyecto` (presupuesto vs planilla) | ✅ |
| avance-semanal | AreaChart | Simulado con `ejecucion.length` | ⚠️ Simulado |

### Inconsistencias
- **evo-avance y avance-semanal**: Son datos simulados (no reales). Deberían venir de `bitacora_avance` para ser precisos.
- `rutaCritica` usa `presupuestos.find()` (memorizado) pero el GanttView no recibe `proyectoId` — se pasa correctamente ✅

---

## 6. FINANCIERO (FinancieroScreen — 592 líneas)

### Componentes/Charts (18 definiciones)
| ID | Tipo | Data Source | ¿Reactivo a filtros? |
|-----|------|-------------|----------------------|
| kpi | KPIs | `stats` con filtered | ✅ |
| gastos-pie | PieChart | `transacciones` (global, NO filtered) | 🔴 **BUG** |
| comp-cat | BarChart | `transacciones` (global) | 🔴 **BUG** |
| operativos-admin | BarChart | `stats` (filtered) | ✅ |
| tendencia-gastos | LineChart | `transacciones` (global) | 🔴 **BUG** |
| acumulado-ing-gastos | AreaChart | `transacciones` (global) | 🔴 **BUG** |
| flujo-caja | LineChart | `transacciones` (global) | 🔴 **BUG** |
| proyecciones | Cards | `proyeccion` (global) | 🔴 **BUG** |
| proy-vs-real | BarChart | `transacciones` (global) | 🔴 **BUG** |
| ingresos-origen | BarChart | `transacciones` (global) | 🔴 **BUG** |
| distrib-operativos | PieChart | `transacciones` (global) | 🔴 **BUG** |
| profit-report | ProfitReport | `transacciones` + `presupuestos` (global) | 🔴 **BUG** |
| margen-proy | BarChart | `transacciones` (global) | 🔴 **BUG** |
| evo-balance | LineChart | `transacciones` (global) | 🔴 **BUG** |
| radar-salud | RadialBarChart | `stats` (filtered) | ✅ |
| gauge-eficiencia | SVG Gauge | `saludFinanciera` (global) | 🔴 **BUG** |

### Inconsistencias detectadas
- **14 de 16 gráficas usan `transacciones` global en lugar de `filtered`**. Solo `kpi` y `operativos-admin` son reactivas a los filtros.
- `ingresosPorOrigen` usa `transacciones` completo. No se filtra por proyecto.
- `margenPorProyecto` usa `transacciones` completo.
- `saludFinanciera = CoreEngineService.analizarSaludFinanciera(transacciones)` — global, no filtrado.

---

## 7. BODEGA (BodegaScreen — 462 líneas)

### Componentes/Funciones
| Función | Propósito | Conexión |
|---------|-----------|----------|
| `loadMateriales()` | Carga materiales + movimientos | `MaterialesService.persistDesglosados()` + `BodegaService.getMovimientos()` |
| `registrarCompra()` | Registra compra de material | `BodegaService.registrarCompra()` + `FinancieroService.registrarTransaccion()` |
| `registrarUso()` | Registra uso de material | `BodegaService.registrarUso()` |
| `generarOC()` | Genera orden de compra | `OrdenesCompraService.generarFolio()` + `crear()` + `crearItems()` |

### Conexiones rotas
- `MaterialesService.persistDesglosados()` requiere `selectedPresupuestoId` — error si no hay proyecto seleccionado. **Solución:** validar antes de llamar.
- `generarOC()` usa `selectedPresupuesto?.proyectoId` pero ese campo puede ser `undefined`. **Bug potencial:** OC sin proyecto vinculado.
- El error 403 original era por RLS faltante en `ordenes_compra`. Corregido con `FIX_RLS_ORDENES_COMPRA.sql`.

---

## 8. COMPRAS (ComprasScreen — 569 líneas)

### Componentes/Funciones
| Función | Propósito | Conexión |
|---------|-----------|----------|
| CRUD Proveedores | Crear, editar, eliminar proveedores | `ProveedoresService` |
| Crear OC | Orden de compra con items dinámicos | `OrdenesCompraService.crear()` + `crearItems()` |
| Recepción OC | Recepción parcial/total | `OrdenesCompraService.crearRecepcion()` + `actualizarEstatusOC()` |

### Conexiones rotas
- `listar()` en `OrdenesCompraService` filtra por `user_id` — necesita RLS policy de SELECT.
- `crearRecepcion()` inserta en `recepcion_oc` con `user_id` — necesita RLS policy de INSERT.
- **Todas cubiertas por `FIX_RLS_ORDENES_COMPRA.sql`.**

---

## 9. COTIZACIÓN (CotizacionScreen)

### Conexiones
- Módulo independiente. Genera cotizaciones en PDF/HTML. No conectado a la DB de Supabase (usa localStorage).
- **Inconsistencia:** Las cotizaciones no se sincronizan con presupuestos. Un cliente cotizado no aparece automáticamente en Clientes.

---

## 10. OFFLINE (offline.ts — 143 líneas)

### Funciones
| Función | Propósito | Estado |
|---------|-----------|--------|
| `loadCachedData()` | Lee datos de localStorage | ✅ |
| `saveCachedData()` | Guarda datos en localStorage | ✅ |
| `clearUserCache()` | Limpia cache del usuario | ✅ |
| `addPendingMutation()` | Agrega operación pendiente a cola | ✅ |
| `removePendingMutation()` | Remueve operación de cola | ✅ |
| `getPendingMutations()` | Lee cola de operaciones | ✅ |
| `processPendingMutations()` | Ejecuta cola con retry (3 intentos + backoff) | ✅ |
| `checkOnline()` | Verifica conectividad con Supabase | ✅ |

### Inconsistencias
- `TABLES` (línea 5) no incluye `ordenes_compra`, `orden_compra_items`, `recepcion_oc`, `materiales_proyecto`, `movimientos_materiales`. **Bug:** estas tablas no se almacenan en offline cache.

---

## 11. SERVICIOS COMPLETOS

| Servicio | Funciones | Conexiones rotas |
|----------|-----------|------------------|
| `CoreEngineService.ts` | `calcularCurvaS()`, `proyectarTendencia()`, `analizarSaludFinanciera()`, `calcularAPU()` | Ninguna |
| `BodegaService.ts` | `registrarCompra()`, `registrarUso()`, `getMovimientos()` | `EliminarMovimiento()` existe pero nunca se usa |
| `OrdenesCompraService.ts` | `listar()`, `crear()`, `crearItems()`, `crearRecepcion()`, `actualizarEstatusOC()` | Ninguna (después de FIX RLS) |
| `ProveedoresService.ts` | `crear()`, `actualizar()`, `eliminar()`, `listar()` | Ninguna |
| `MaterialesService.ts` | `persistDesglosados()`, `listar()` | `costoMaterialTotal()` existe pero nunca se usa |
| `FinancieroService.ts` | `registrarTransaccion()`, `obtenerTransacciones()`, `obtenerResumen()` | Ninguna |
| `PresupuestosService.ts` | `addPresupuesto()`, `updatePresupuesto()`, `deletePresupuesto()` | `getPresupuestos()` se usa en AppContext | 
| `RenglonesService.ts` (803 líneas) | `obtenerBibliotecaRenglones()`, `crearRenglon()`, CRUD completo | Ninguna |
| `GanttService.ts` | `calcularRutaCritica()` | Bug: hardcodea `proyectoFin=30` |
| `PlanillaService.ts` | `registrarPago()` | Sin validación de existencia de empleado |
| `EmpleadoService.ts` | CRUD empleados | Existe pero no se usa en UI (no hay pantalla de empleados) |
| `AgenteInteligente.ts` | `diagnosticarProyecto()` | 2 reglas básicas |
| `RealtimeService.ts` | Suscripciones en tiempo real | ~20 canales |
| `LoggerService.ts` | Logging estructurado | ✅ |

---

## 12. INCONSISTENCIAS CRÍTICAS DETECTADAS

### 🔴 Conexiones rotas (bloquean funcionalidad)

| # | Módulo | Problema | Solución |
|---|--------|----------|----------|
| 1 | **FinancieroScreen** | 14/16 gráficas usan `transacciones` global en vez de `filtered` | Cambiar dependencias de useMemo |
| 2 | **Dashboard** | Alertas usan `presupuestos` completo, no `presupuestosFiltrados` | Cambiar dependencia de useEffect (línea 158) |
| 3 | **BodegaScreen** | `generarOC()` usa `proyectoId` que puede ser undefined | Validar antes de crear OC |
| 4 | **Offline.ts** | `TABLES` no incluye `ordenes_compra`, `orden_compra_items`, `recepcion_oc`, `materiales_proyecto` | Agregar a la lista de TABLES |
| 5 | **Ruta Crítica** | `GanttService.calcularRutaCritica()` hardcodea `proyectoFin=30` | Debe calcular fin real desde fechas |

### 🟡 Inconsistencias de diseño

| # | Módulo | Problema |
|---|--------|----------|
| 6 | **Dashboard** | Las alertas no se filtran por proyecto seleccionado |
| 7 | **PresupuestoScreen** | Factores sugeridos no se persisten en DB |
| 8 | **SeguimientoScreen** | `evo-avance` y `avance-semanal` son simulados, no reales |
| 9 | **BodegaScreen** | `MaterialesService.persistDesglosados()` no valida si `selectedPresupuestoId` existe |
| 10 | **FinancieroScreen** | `saludFinanciera` no se filtra por proyecto |

---

## 13. NUEVAS IMPLEMENTACIONES SUGERIDAS

### Como Ingeniero Civil y Arquitecto con experiencia en proyectos de construcción

### 🏗️ PRIORIDAD ALTA — Impacto directo en el negocio

#### 1. MÓDULO DE CONTROL DE COSTOS AVANZADO POR RENGLÓN APU
**Propósito:** Comparar en tiempo real el costo presupuestado vs el costo real de CADA renglón APU.
**Implementación:**
- Nueva tabla `analisis_desviaciones`:
  ```sql
  renglon_id, presupuesto_id, costo_estimado, costo_real, 
  desviacion_porcentual, estado (bajo_control/alerta/critica)
  ```
- Nuevo chart en Dashboard y Seguimiento: "Desviación por Renglón" (BarChart coloreado)
- Notificaciones automáticas cuando desviación > 15%
- **Valor:** El constructor sabe exactamente DÓNDE se está perdiendo dinero

#### 2. MÓDULO DE PROGRAMACIÓN DE OBRA (GANTT AVANZADO CON RUTA CRÍTICA REAL)
**Propósito:** Programación profesional de obra con dependencias entre actividades, holguras, y curva de personal.
**Implementación:**
- Reemplazar `GanttService.calcularRutaCritica()` actual con algoritmo CPM completo
- Agregar: fechas reales de inicio/fin por actividad, % de avance por actividad
- Vista de: Ruta Crítica, Ruta No Crítica, Holguras
- Exportación a MS Project compatible (XML)
- **Valor:** Planificación profesional de obra, evita retrasos

#### 3. MÓDULO DE ESTIMACIÓN DIMENSIONAL AUTOMÁTICA (TAKE-OFF)
**Propósito:** Calcular cantidades de obra automáticamente desde planos o dimensiones ingresadas.
**Implementación:**
- El usuario ingresa: metros lineales de muro, área de losa, cantidad de columnas
- El sistema genera automáticamente los renglones APU con cantidades correctas
- Vinculado a la Memoria de Cálculo existente en PresupuestoScreen
- **Valor:** Ahorra horas de cálculo manual, minimiza errores

#### 4. MÓDULO DE CONTROL DE AVANCE CON FOTOGRAFÍAS
**Propósito:** Evidencia fotográfica del avance de obra vinculada a actividades.
**Implementación:**
- Nueva tabla `fotos_avance` (presupuesto_id, url, fecha, descripcion, actividad_id)
- Subida de fotos desde el móvil
- Línea de tiempo visual del proyecto (antes/después)
- **Valor:** Documentación profesional para el cliente, respaldo legal

### 🏗️ PRIORIDAD MEDIA — Diferenciación competitiva

#### 5. MÓDULO DE RENDIMIENTO DE CUADRILLAS
**Propósito:** Medir la productividad real de las cuadrillas vs la estimada en APU.
**Implementación:**
- El capataz registra: cuadrilla asignada, horas trabajadas, avance real
- El sistema calcula: rendimiento real (m²/día, m³/día), eficiencia vs APU
- Reporte semanal de productividad
- **Valor:** Identifica cuadrillas de alto/bajo rendimiento, mejora estimaciones futuras

#### 6. MÓDULO DE CONTROL DE CAMBIOS (CHANGE ORDERS) INTEGRADO
**Propósito:** Gestión completa de órdenes de cambio con aprobación del cliente y cliente final.
**Implementación:**
- El ChangeOrdersPanel actual se conecta a tabla `cambios_presupuesto`
- Flujo: Solicitud → Aprobación Cliente → Ejecución → Facturación
- Impacto en presupuesto total y cronograma
- **Valor:** Control financiero estricto, evita sobrecostos no autorizados

#### 7. MÓDULO DE GESTIÓN DE PROVEEDORES Y COTIZACIONES COMPARATIVAS
**Propósito:** Solicitar y comparar cotizaciones de múltiples proveedores.
**Implementación:**
- Nueva tabla `cotizaciones_proveedor` (proveedor_id, material_id, precio, fecha, vigencia)
- Vista comparativa por material: precio más bajo, más alto, promedio
- Selección automática del mejor proveedor por material
- **Valor:** Optimiza costos de materiales 10-15%

### 🏗️ PRIORIDAD BAJA — Escalabilidad empresarial

#### 8. MÓDULO DE CONTABILIDAD DE OBRA (LIBRO DE OBRA)
**Propósito:** Contabilidad específica de obra para declaraciones SAT/IGSS.
**Implementación:**
- Generar libro de obra electrónico (según normativa local)
- Reportes de ISSS, IRTRA, INSIVUMEH
- Asientos contables automáticos desde transacciones
- **Valor:** Cumplimiento legal, evita multas

#### 9. MÓDULO DE GESTIÓN DE SUBCONTRATOS
**Propósito:** Administrar subcontratistas (instalaciones eléctricas, hidráulicas, etc.)
**Implementación:**
- Nueva tabla `subcontratistas` (similar a proveedores pero con especialidad, licencia)
- Contratos por actividad/renglón
- Control de avance del subcontratista
- Reporte de pagos vs contrato
- **Valor:** Gestión centralizada de todos los actores de la obra

#### 10. MÓDULO DE DOCUMENTACIÓN TÉCNICA (PLANOS, ESPECIFICACIONES)
**Propósito:** Repositorio de documentos técnicos por proyecto.
**Implementación:**
- Subida de archivos (PDF, DWG, DXF)
- Vinculación a renglones APU y actividades
- Control de versiones (revisión A, B, C)
- **Valor:** Toda la documentación técnica accesible desde la app

#### 11. MÓDULO DE CURVA "S" PROFESIONAL (VALOR GANADO - EVM)
**Propósito:** Earned Value Management completo (PV, EV, AC, SPI, CPI).
**Implementación:**
- La Curva S actual se expande con: Valor Planificado, Valor Ganado, Costo Real
- Indicadores: SPI (Schedule Performance Index), CPI (Cost Performance Index)
- Pronóstico: EAC (Estimate at Completion), VAC (Variance at Completion)
- **Valor:** Control profesional de obra exigido por grandes clientes

---

## 14. TABLA RESUMEN DE CORRECCIONES PENDIENTES

| # | Prioridad | Archivo | Corrección |
|---|-----------|---------|------------|
| 1 | 🔴 ALTA | `FinancieroScreen.tsx` | Cambiar 14 gráficas de `transacciones` a `filtered` |
| 2 | 🔴 ALTA | `Dashboard.tsx` (línea 158) | Cambiar `presupuestos` a `presupuestosFiltrados` en alertas |
| 3 | 🔴 ALTA | `BodegaScreen.tsx` | Validar `selectedPresupuesto?.proyectoId` antes de OC |
| 4 | 🟡 MEDIA | `offline.ts` | Agregar tablas faltantes a `TABLES` |
| 5 | 🟡 MEDIA | `GanttService.ts` | Reemplazar hardcode `proyectoFin=30` con cálculo real |
| 6 | 🟡 MEDIA | `PresupuestoScreen.tsx` | Persistir factores sugeridos en DB |
| 7 | 🟢 BAJA | `SeguimientoScreen.tsx` | Reemplazar avance simulado por datos de `bitacora_avance` |
| 8 | 🟢 BAJA | `FinancieroScreen.tsx` | Filtrar `saludFinanciera` por proyecto |
| 9 | 🟢 BAJA | `BodegaScreen.tsx` | Validar `selectedPresupuestoId` en `loadMateriales()` |

---

## 15. CONCLUSIÓN TÉCNICA

La aplicación tiene una arquitectura sólida con:
- ✅ Separación clara de capas (UI → Services → Supabase)
- ✅ Soporte offline completo (cache + pending mutations)
- ✅ Motor APU completo con 40 renglones y 6 tipologías
- ✅ 3 dashboards ejecutivos con +50 gráficos recharts
- ✅ Sistema de fases y transiciones

🔴 **Problemas críticos a resolver:**
1. FinancieroScreen: 14/16 gráficas no respetan filtros
2. Dashboard: alertas no filtradas por proyecto
3. Ruta Crítica: hardcodea duración

💡 **Próximos pasos recomendados (orden de implementación):**
1. Corregir las 3 inconsistencias críticas 🔴
2. Implementar **Control de Costos por Renglón APU** (#1)
3. Implementar **Programación de Obra Avanzada** (#2)
4. Implementar **Take-off Automático** (#3)
5. Implementar **Control de Avance con Fotografías** (#4)