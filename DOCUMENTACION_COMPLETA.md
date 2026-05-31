 # DOCUMENTACIÓN UNIFICADA — CONSTRUSMART WM

Este archivo consolida toda la documentación del repositorio en un único punto para evitar confusiones. Contiene resúmenes ejecutivos, estado de módulos, checklist, roadmap y referencias a servicios y scripts críticos.

-- Índice --
- Visión general (README)
- Roadmap y Auditoría (AUDIT_ROADMAP)
- Guía para agentes y desarrollo (AGENTS)
- Checklist técnico y de producto (checklist_presupuestos)
- Análisis de módulos (ANALISIS_COMPLETO_MODULOS)
- Arquitectura y estado (ARQUITECTURA_Y_ESTADO)
- Conexiones y flujo de datos (CONEXIONES_Y_FLUJO_DE_DATOS)
- Esquema de conexiones bilaterales (ESQUEMA_CONEXIONES_BILATERALES)
- Auditoría funcional (AUDIT_FUNCIONAL_COMPLETO)
- Plan de implementación 100% (PLAN_IMPLEMENTACION_100)
- Mapeo y sugerencias (MAPEO_COMPLETO_Y_SUGERENCIAS)
- Implementation checklist (IMPLEMENTATION_CHECKLIST)
- Reporte de mejoras APU (PRESUPUESTO_MEJORAS_COMPARISON_REPORT)
- Database schema analysis (DATABASE_SCHEMA_ANALYSIS)
- Diagramas y esquemas (SCHEMA_CONNECTIONS_DIAGRAM)
- Comparación actual vs checklist
- Scripts relevantes: README_MIGRATION

---

## Visión general (extracto README)

Aplicación web SPA construida con React, Vite, Tailwind CSS y Supabase para gestión integral de presupuestos, compras, bodega, seguimiento y finanzas de obra.

Stack: React 18 + Vite 5 + TypeScript + Tailwind 3 + Shadcn/ui + Supabase.

Estructura principal: `src/` (App, contexts, features, services, types, data). Servicio Supabase inicializado en `src/lib/supabase.ts`.

Comandos de desarrollo: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test -- --run`.

---

## Roadmap y Auditoría (extracto AUDIT_ROADMAP)

- 12 pantallas conectadas (Login, Dashboard, Clientes, Presupuesto, Proyectos, Seguimiento, Financiero, Equipos, Bodega, Cotización, Compras, Aprobación).
- Servicios principales: CoreEngineService, PresupuestosService, BodegaService, OrdenesCompraService, FinancieroService, GanttService, PlanillaService.
- Puntos críticos: falta CRUD de OrdenesCompra en `AppContext`, Financiero necesita UI de transacciones, Seguimiento no refresca transacciones tras pago.

Plan de refactorización prioritario:
1. Completar CRUD en `AppContext` (OrdenesCompra, Transacciones, Actividades/Proyectos).
2. Unificar cálculos financieros en `CoreEngineService`.
3. Migrar formularios a `react-hook-form + Zod`.

---

## Guía para agentes / desarrolladores (extracto AGENTS)

- Mantener arquitectura: React + Vite + Tailwind + Shadcn/ui, `AppContext.view` para navegación interna.
- No usar `supabase.from()` en componentes — usar `src/services/*`.
- Ejecutar `npm run typecheck` y `npm run test` antes de finalizar cambios.

---

## Checklist técnico (extracto checklist_presupuestos)

- Funcionalidades deseadas del motor APU, reporte, sincronización, BIM/IFC, conversión de unidades, recálculo en cascada, bloqueo de precios por proyecto, EVM, entre otros.

---

## Análisis de módulos (resumen)

- `PresupuestoScreen`: motor APU (650 líneas), export CSV/PDF, predictor APU pendiente de integración completa.
- `SeguimientoScreen`: Gantt/CPM y Bitacora; `PlanillaService.registrarPago` necesita validaciones y refresco de contexto.
- `BodegaScreen` y `ComprasScreen`: flujo OC → recepción → movimiento de inventario, mejoras UX responsive pendientes.

---

## Arquitectura y flujo de datos (resumen)

- Providers: BrowserRouter, QueryClientProvider, ThemeProvider, AppProvider (AppContext).
- Offline sync en `src/services/offline.ts` y PWA configurada con `vite-plugin-pwa`.
- Realtime: ~20 canales Supabase para tablas críticas.

---

## Esquema de conexiones bilaterales (resumen)

- Mapa lógico: UI ↔ AppContext ↔ Services ↔ Supabase. AppContext expone ~26 métodos CRUD.
- Estado global: 92% de comunicación bilateral; pendientes en Seguimiento, Financiero y OrdenesCompra.

---

## Auditoría funcional y known bugs (resumen)

- GanttService: corregido `duracionDias` pero validar predecesores reales.
- BitacoraAvancePanel: aún usa `supabase.from()` directo (pendiente migración a service).
- ViewType: validar que `'compras'` y `'aprobacion'` están incluidos en `src/types/supabase.ts`.

---

## Plan Implementación 100% (resumen de pasos)

1. Añadir `addOrdenCompra`/`updateOrdenCompra`/`deleteOrdenCompra` en `AppContext`.
2. Añadir UI `+ Nueva Transacción` en `FinancieroScreen` y `TransactionForm`.
3. Llamar a `addTransaccion` tras `PlanillaService.registrarPago()` en Seguimiento.
4. Migrar llamadas directas `supabase.from()` a servicios tipados (BitacoraAvance, MovimientosMateriales).
5. Ejecutar typecheck y tests y resolver errores.

---

## Mapeo, sugerencias y checklist de implementación (resumen)

- Auditar todos los servicios para eliminar `any` y `Record<string, unknown>`.
- Extraer cálculos APU a `CoreEngineService` si aún no está centralizado.
- Mejorar responsive en tablas y modales grandes.

---

## Comparación actual vs checklist (registro de progreso)

- Typecheck y tests ejecutados localmente (según documentación interna) sin errores.
- Lista de tareas prioritarias y recomendaciones incluidas arriba.

---

## Scripts y migraciones

- `scripts/ERP_SCHEMA_FINAL.sql` — Esquema maestro.
- `scripts/CLEANUP_ALL.sql` — Reset de la DB (usar con precaución).

---

## Notas finales

Este archivo reemplaza la colección previa de archivos `.md`. Para historial completo, consulte el control de versiones en Git.
