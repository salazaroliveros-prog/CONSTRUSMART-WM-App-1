# CHECKLIST: Estado Actual vs Estado Requerido

> **Leyenda:** ✅ Completo | ⚠️ Parcial | ❌ No existe / No implementado

---

## 1. MÓDULO PRESUPUESTO (Motor APU Avanzado)

| # | Funcionalidad | Estado | Detalle |
|---|--------------|--------|---------|
| 1.1 | Motor APU básico (Material + MO + Herramienta = Costo Unitario) | ✅ | `PresupuestoScreen.tsx` — useMemo `totales` recalcula en tiempo real |
| 1.2 | Factores paramétricos (Indirectos, Admin, Imprevistos, Utilidad) | ✅ | Porcentajes editables con cálculo automático de total |
| 1.3 | Catálogo de 40 renglones por tipología (8 tipos) | ⚠️ | `renglones.ts` con datos hardcodeados. Sin `subrenglones` ni `materiales` por renglón |
| 1.4 | **Sub-renglones (explosión de materiales)** | ❌ | No existe. Cada renglón solo tiene `{costoMaterial, costoManoObra, costoHerramienta, rendimiento}`. No hay desglose de cantidades unitarias de materiales, jornales, equipos |
| 1.5 | **Edición en tiempo real con auto-recalculo total** | ⚠️ | `totales` useMemo recalcula al cambiar `lineas` o `meta`. Pero solo hay 3 costos globales, no sub-renglones |
| 1.6 | **Acordeón desplegable con APU completa por renglón** | ⚠️ | `RenglonCard` tiene expandible que muestra material/MO/herramienta como 3 inputs simples, sin sub-componentes |
| 1.7 | **Cálculo de tiempo de ejecución vinculado a MO** | ❌ | `tiempo = Σ(cantidad / rendimiento)` — rendimiento es fijo por renglón, no se recalcula al cambiar MO/personas |
| 1.8 | **Algoritmos predictivos (ML-like) sugeridos** | ⚠️ | `predictorAPU.ts` existe pero NO está conectado a `PresupuestoScreen` (nunca se llama) |
| 1.9 | **Anomalías y validación conectadas a UI** | ⚠️ | `validacionPresupuesto.ts` existe, se usa `validarFactores` en screen, pero `detectarAnomalias` no se muestra |
| 1.10 | **Exportación PDF/CSV con formato avanzado + explosión de materiales** | ❌ | Exportación básica existe (CSV con secciones, PDF con `window.print`). Sin tabla resumen con desglose de materiales unitarios |
| 1.11 | **Cálculo de costo directo como suma de sub-renglones** | ❌ | `costoDirecto = Σ(cantidad × (material + MO + herramienta))` — no hay sub-renglones |
| 1.12 | **Botón "Sugerir APU" desde históricos** | ❌ | `sugerirAPU()` existe en `predictorAPU.ts` pero no hay botón en UI |

---

## 2. MÓDULO PROYECTOS

| # | Funcionalidad | Estado | Detalle |
|---|--------------|--------|---------|
| 2.1 | Registro de clientes | ✅ | `ClientesScreen` con CRUD completo + `clientes` en AppContext |
| 2.2 | Datos generales del proyecto (nombre, ubicación, tipo) | ✅ | Campos en `PresupuestoScreen` formulario lateral |
| 2.3 | Gestión de fases (planeación → ejecución → pausa → finalizado) | ✅ | `transicionFase()` en AppContext con notificaciones |
| 2.4 | Selección de cliente desde proyecto | ✅ | Selector de cliente en sidebar |
| 2.5 | Edición inline de datos financieros del proyecto | ⚠️ | `ProyectosScreen` permite editar ingresos/gastos/avance. No hay edición de todos los campos |

---

## 3. MÓDULO SEGUIMIENTO (Control Físico + Financiero + RRHH)

| # | Funcionalidad | Estado | Detalle |
|---|--------------|--------|---------|
| 3.1 | Seguimiento de avance físico por renglón (slider %) | ✅ | `ProyectosScreen` — sliders por renglón + avance ponderado |
| 3.2 | Avance financiero (ingresos vs gastos) | ✅ | `SeguimientoScreen` tabla con barras |
| 3.3 | **Diagrama Gantt funcional con:** | ❌ | `GanttView` barras en posición **aleatoria**, sin datos reales |
| 3.3a | Holguras (slack) | ❌ | `GanttService.calcularRutaCritica` — stub: `holgura = 0` para todo |
| 3.3b | Ruta crítica real | ❌ | Stub: todos marcados como críticos |
| 3.3c | Dependencias entre tareas | ❌ | No existe modelo de dependencias |
| 3.3d | Responsivo / interactivo | ❌ | Solo vista estática, sin drag, sin zoom |
| 3.3e | Línea de tiempo semanal real | ⚠️ | 12 semanas pero posiciones aleatorias |
| 3.4 | **Bitácora de avance (fechas, notas, recursos)** | ⚠️ | `BitacoraAvancePanel` — tabla simple con fecha/avance/notas. Sin recursos ni fotos |
| 3.5 | **Registro de personal y pago de planillas** | ⚠️ | `PlanillaService.registrarPago()` — registra en transacciones como 'mano-obra'. Sin empleados, sin desglose por trabajador |
| 3.6 | **Control de gastos personales (ganancia por proyecto)** | ❌ | No existe. No hay cálculo de ganancia neta por proyecto ni límite de gasto personal |
| 3.7 | **Dashboard financiero del proyecto (métricas integradas)** | ⚠️ | `DashboardFinanciero` — 4 tabs con validación, composición, cash flow (placeholder), alertas |
| 3.8 | **Tablero de control con paginación** | ❌ | `SeguimientoScreen` muestra todo en una tabla, sin paginación |
| 3.9 | **Gráficas visuales avanzadas (Gantt, Curva S, etc.)** | ❌ | No hay Curva S, no hay Earned Value Management |

---

## 4. MÓDULO BODEGA (Inventario / Materiales)

| # | Funcionalidad | Estado | Detalle |
|---|--------------|--------|---------|
| 4.1 | **Pantalla de Bodega dedicada** | ❌ | No existe en navegación. No hay entrada en menú |
| 4.2 | **Explosión de materiales desde presupuesto** | ⚠️ | `BodegaService.explosionarMateriales()` existe. No está conectado a UI |
| 4.3 | Control de stock por renglón y proyecto | ⚠️ | `MaterialesPanel` muestra estimado/usado/restante. Stock es básico |
| 4.4 | **Órdenes de compra (OC) vinculadas a renglones** | ❌ | No existe. `registrarCompra()` solo incrementa cantidad |
| 4.5 | **Recepción de materiales (entrada vs salida)** | ⚠️ | `movimientos_materiales` con tipo 'entrada'/'salida'. Sin workflow de recepción |
| 4.6 | **Proveedores** | ❌ | No existe tabla ni gestión de proveedores |
| 4.7 | Comparativa presupuestado vs real (por renglón) | ⚠️ | `useTrazabilidadMateriales` + `PanelTrazabilidadMateriales` compara presupuestado/comprado/consumido |
| 4.8 | Alertas de stock mínimo / sobrecompra | ❌ | No hay umbrales configurables |
| 4.9 | **Órdenes de compra generadas desde seguimiento** | ❌ | No hay flujo: presupuesto→bodega→seguimiento→compra |

---

## 5. MÓDULO DASHBOARD (Tablero Principal)

| # | Funcionalidad | Estado | Detalle |
|---|--------------|--------|---------|
| 5.1 | **Dashboard funcional** | ❌ | `Dashboard.tsx` — está **CORRUPTO** (definiciones duplicadas, sin return JSX válido). NO COMPILA |
| 5.2 | KPIs principales (ingresos, gastos, balance, proyectos activos) | ❌ | No se renderiza nada por el error de compilación |
| 5.3 | **Sistema de paginación (varias páginas, cada una sin scroll)** | ❌ | No existe ningún sistema de paginación |
| 5.4 | **Gráficas principales por página:** | ❌ | — |
| 5.4a | Gantt general de proyectos | ❌ | Existe `GanttView` aparte pero no integrado al dashboard |
| 5.4b | Cash flow proyectado (línea) | ⚠️ | `PanelCashFlow` con Recharts LineChart. No integrado a dashboard |
| 5.4c | Composición de costos (pastel) | ⚠️ | `DashboardFinanciero` con PieChart. No integrado a dashboard |
| 5.4d | Heatmap de rentabilidad por proyecto | ⚠️ | `ProjectHeatMap` existe como componente aparte |
| 5.4e | Curva S avance físico vs financiero | ❌ | No existe |
| 5.5 | **Filtros: selector de proyectos, rango de fechas** | ❌ | No hay filtros persistentes en dashboard |
| 5.6 | **Dashboard como pantalla de inicio** | ⚠️ | `view default → Dashboard` en AppLayout, pero como no compila, no funciona |
| 5.7 | **Alertas en tiempo real** | ⚠️ | `NotificationBell` con Realtime. No hay alertas en dashboard |
| 5.8 | **Notificaciones push** | ❌ | No hay service worker push. Solo Realtime cuando la app está abierta |

---

## 6. AGENTE FINANCIERO INTELIGENTE

| # | Funcionalidad | Estado | Detalle |
|---|--------------|--------|---------|
| 6.1 | Diagnóstico financiero básico (desviación >90%) | ⚠️ | `AgenteInteligente.diagnosticarProyecto()` — solo 2 reglas |
| 6.2 | **Alertas operativas en dashboard** | ❌ | `AgenteInteligente` no está conectado a UI (se llama en Dashboard corrupto) |
| 6.3 | **Notificaciones push fuera de la app** | ❌ | Sin Web Push API |
| 6.4 | **Recomendaciones de optimización presupuestal** | ❌ | No existe |
| 6.5 | **Alertas de flujo de caja (proyección a 15/30/90 días)** | ⚠️ | `useCashflowProyectado` detecta alertas. No hay UI de dashboard |
| 6.6 | **Análisis de rentabilidad por proyecto** | ❌ | No hay cálculo automático de rentabilidad neta por proyecto |

---

## 7. FUNCIONALIDADES TRANSVERSALES

| # | Funcionalidad | Estado | Detalle |
|---|--------------|--------|---------|
| 7.1 | **Responsive: PC + Móvil** | ⚠️ | AppLayout usa `viewOrder` con animación. No hay layout responsive adaptativo para móvil |
| 7.2 | Offline-first con cola de mutaciones | ✅ | `offline.ts` con cache localStorage + PendingMutation |
| 7.3 | Tiempo real (Realtime Supabase ~17 canales) | ✅ | Live sync en todas las tablas principales |
| 7.4 | Exportación Excel (xlsx) | ✅ | `exportExcel.ts` con múltiples sheets |
| 7.5 | **Exportación PDF con formato profesional avanzado** | ❌ | `printPDF()` básico con `window.print()`. Sin tabla de resumen de renglones con desglose de materiales |
| 7.6 | OCR para escaneo de facturas | ✅ | `OCRFactura.tsx` con Tesseract.js español |
| 7.7 | Validación de factores + puntuación de salud | ✅ | `validacionPresupuesto.ts` con sistema de puntuación |
| 7.8 | **Sistema de roles/permisos por equipo** | ⚠️ | `TeamsScreen` + `EquiposService`. Solo compartición básica |

---

## 8. PROBLEMAS CRÍTICOS DETECTADOS

| # | Problema | Impacto |
|---|----------|---------|
| 8.1 | `Dashboard.tsx` — archivo **corrupto** (no compila) | ❌ La pantalla principal de la app no funciona |
| 8.2 | `GanttView.tsx` — posiciones de barras **aleatorias** | ❌ Datos no representan la realidad |
| 8.3 | `GanttService.calcularRutaCritica()` — **stub** sin CPM real | ❌ No se puede confiar en la ruta crítica |
| 8.4 | `PlanillaService` ignora `empleadoId` en `registrarPago()` | ⚠️ No hay trazabilidad por empleado |
| 8.5 | `renglones.ts` — datos **hardcodeados** en cliente | ⚠️ No se pueden editar desde Supabase |
| 8.6 | 3 implementaciones de cash flow no unificadas | ⚠️ Resultados inconsistentes |
| 8.7 | `SeguimientoAvanceScreen` tiene `transacciones` hardcodeado como `[]` | ❌ Panel de conciliación sin datos |

---

## 9. RESUMEN DE PRIORIDADES (ARQUITECTURA SUGERIDA)

```
FASE 1 — CRÍTICO (Arreglar lo que no funciona)
  ├── 8.1 Dashboard.tsx → Reescribir completamente
  ├── 8.2/8.3 Gantt → Implementar CPM real
  └── 8.7 SeguimientoAvanceScreen → Conectar datos reales

FASE 2 — MOTOR APU EXPANDIDO (Corazón del sistema)
  ├── 1.4 Sub-renglones con explosión de materiales
  ├── 1.6 Acordeón APU completo (materiales, MO, equipos por renglón)
  ├── 1.7 Tiempo de ejecución dinámico vinculado a MO
  └── 1.10 Exportación avanzada con desglose

FASE 3 — BODEGA + COMPRAS
  ├── 4.1 Pantalla de Bodega dedicada (entrada de navegación)
  ├── 4.4 Órdenes de compra
  ├── 4.6 Proveedores
  └── 4.9 Flujo presupuesto→bodega→seguimiento→compra

FASE 4 — DASHBOARD + ANALYTICS
  ├── 5.1-5.6 Dashboard con paginación, KPIs, filtros
  ├── 5.4e Curva S (Earned Value Management)
  └── 5.8 Notificaciones push

FASE 5 — RRHH + GASTOS PERSONALES
  ├── 3.6 Control de ganancia por proyecto
  ├── 3.5 Planilla completa con empleados
  └── 6.2 Agente financiero expandido

FASE 6 — RESPONSIVE + UI/UX
  ├── 7.1 Layout responsive completo
  └── 7.5 Exportación PDF profesional
```
