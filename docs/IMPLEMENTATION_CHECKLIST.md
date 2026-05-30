# Implementación pendiente - CONSTRUSMART WM

Esta lista convierte el plan de revisión en un checklist concreto para el repositorio actual. Cada tarea corresponde a una brecha funcional o técnica detectada en el análisis.

## Estado actual
- ✅ El sistema ya tiene navegación interna activa y `ViewType` actual incluye `compras` y `aprobacion`.
- ✅ `AppLayout.tsx` ya mapea `ViewType` a componentes y no depende de un switch de strings.
- ✅ `AppContext.tsx` ya separa conceptualmente `AuthContext` y `DataContext`, aunque el proveedor aún mantiene lógica pesada.
- ✅ Se eliminó una declaración duplicada `loadingRef` en `AppContext.tsx`.
- ✅ La app centraliza la carga inicial en `src/services/AppDataService.ts`, pero aún hay deuda en tipado y en consultas directas dentro de servicios.
- ✅ El módulo de compras usa servicios, pero esos servicios necesitan reforzar tipos y validación.
- ✅ Bodega no usa supabase directo en UI y `BodegaService.ts` ya delega la inserción en `MovimientosMaterialesService`.
- ⚠️ `MovimientosMaterialesService.ts` sigue usando `supabase.from('movimientos_materiales')`.
- ⚠️ `GanttService` y `FinancieroService` requieren mayor consolidación y estilo de datos más firme.

## 1. Core / Navegación
- [x] Cambiar `renderViewContent(v: string)` en `src/components/AppLayout.tsx` a `renderViewContent(v: ViewType)` con tipado estricto.
- [x] Validar que `ViewType` cubre todas las vistas usadas: `dashboard`, `clientes`, `proyectos`, `presupuesto`, `seguimiento`, `financiero`, `equipos`, `bodega`, `cotizacion`, `compras`, `aprobacion`.
- [ ] Reducir la lógica de estado en `AppContext.tsx`; extraer la carga de datos y la sincronización a servicios específicos.
- [ ] Eliminar `useMemo`/`useCallback` innecesarios y evitar cadenas "magic strings" para vistas en la navegación.

## 2. Servicios y acceso a datos
- [ ] Auditar y mover todas las consultas `supabase.from()` fuera de componentes UI.
- [ ] Unificar patrones CRUD en servicios tipados y evitar `as any` en `supabase.from()`.
- [ ] Corregir los siguientes servicios con tipos débiles o `Record<string, unknown>`:
  - `src/services/proyectos/BodegaService.ts`
  - `src/services/presupuestos/PresupuestosService.ts`
  - `src/services/seguimiento/BitacoraAvanceService.ts`
  - `src/services/financiero/FinancieroService.ts`
  - `src/services/RenglonesService.ts`
- [ ] Añadir tipos `Database[T]` donde aplique y eliminar conversiones de tipo sin validación.
- [ ] Evaluar si conviene crear un `BaseService`/`DbService` para los CRUD comunes y queries compartidas.

## 3. Presupuesto
- [ ] Extraer el motor de cálculo de APU a un servicio reutilizable fuera del componente `PresupuestoScreen`.
- [ ] Tipar `persistedCatalog`, `lineas` y `subrenglones` sin usar `as any`.
- [ ] Validar que `PanelAPUPredictor` recibe datos históricos correctos y muestra sugerencias de costo con coherencia.
- [ ] Integrar `validarFactores` y `detectarAnomalias` en un flujo operativo visible al usuario.
- [ ] Centralizar tipologías, multiplicadores y fórmulas de costo en el motor, no en el componente.

## 4. Compras / Órdenes de compra
- [ ] Revisar el diseño responsive de proveedores, órdenes y recepción.
- [ ] Añadir `overflow-x-auto` a tablas grandes y formularios de OC en móvil.
- [ ] Validar estados de OC con tipos estrictos (`pendiente`, `aprobada`, `recibida_parcial`, `recibida`, `cancelada`).
- [ ] Consolidar el flujo de recepción parcial y recepción total en `OrdenesCompraService`.

## 5. Seguimiento
- [ ] Mejorar `GanttService.calcularRutaCritica` para soportar dependencias de tareas reales.
- [ ] Modelar predecesores/sucesores de líneas de presupuesto en lugar de usar solo índice/orden implícito.
- [ ] Delegar la lógica de cálculo de métricas de seguimiento a servicios, no al componente.
- [ ] Verificar que los charts de avance se adaptan bien en móviles.

## 6. Financiero
- [ ] Eliminar duplicación entre `src/features/financiero/components/FinancieroScreen.tsx` y `src/components/DashboardFinanciero.tsx`.
- [ ] Mover todos los cálculos de cashflow, proyecciones y salud financiera a `src/services/CoreEngineService.ts`.
- [ ] Tipar categorías y transacciones en `ProfitReport` y otras visualizaciones.
- [ ] Añadir alertas de salud financiera en UI con base en `CoreEngineService`.

## 7. Bodega / Inventario
- [x] Cambiar `BodegaService` para usar payloads tipados en lugar de `Record<string, unknown>`.
- [x] Confirmar que ninguna UI usa `supabase.from()` directo.
- [ ] `MovimientosMaterialesService.ts` aún usa `supabase.from('movimientos_materiales')` y puede centralizarse más.
- [ ] Agregar validación de stock y manejo de materiales inexistentes en el servicio.

## 8. UX / Diseño / Estilos
- [ ] Aplicar `overflow-x-auto` en tablas clave: Clientes, Compras, Presupuestos, Seguimiento.
- [ ] Revisar modales y formularios para que no excedan ancho en móvil.
- [ ] Homogeneizar estilos de botones, cards y estados hover/focus.
- [ ] Verificar consistencia de breakpoints y spacing entre vistas.

## 9. Calidad de código
- [ ] Eliminar todos los `any` en `src/contexts/AppContext.tsx`.
- [ ] Eliminar `Record<string, unknown>` innecesarios en la base de tipos.
- [ ] Añadir tipos claros para todas las consultas y mutaciones de servicios.
- [ ] Revisar el uso de `Partial<any>` y reemplazarlo por tipos precisos.

## 10. Funcionalidades avanzadas
- [ ] Validar el flujo completo de `AprobacionScreen` y su enlace con órdenes / transacciones.
- [ ] Integrar OCR / facturas en la UI si el servicio ya existe.
- [ ] Confirmar que las notificaciones push están implementadas y se muestra el estado al usuario.
- [ ] Añadir un panel de alertas de presupuesto con umbrales de desviación.
- [ ] Documentar el modelo de roles/permiso si se usa en la app.

## Instrucciones de ejecución
1. Priorizar primero `AppContext` y el tipado base para no propagar más deuda.
2. Luego corregir servicios con tipos débiles y mover cualquier query directa a servicios.
3. Después, extraer el motor de APU y unificar el cálculo financiero en `CoreEngineService`.
4. Finalmente, pulir UX responsive y validar avances en `AprobacionScreen`, OCR y notificaciones.

## Prioridad de ejecución
1. `AppContext` / `ViewType` / tipado base
2. Servicios y eliminación de `any`
3. Motor financiero/cashflow unificado
4. Presupuesto + predictor/anomalías
5. UX móvil/tablas
6. Aprobaciones / OCR / push / RLS
