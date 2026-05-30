# Implementación pendiente - CONSTRUSMART WM

Esta lista convierte el plan de revisión en un checklist concreto para el repositorio actual. Cada tarea corresponde a una brecha funcional o técnica detectada en el análisis.

## 1. Core / Navegación
- [ ] Cambiar `renderViewContent(v: string)` en `src/components/AppLayout.tsx` a `renderViewContent(v: ViewType)` con tipado estricto.
- [ ] Validar que `ViewType` cubre todas las vistas usadas: `dashboard`, `clientes`, `proyectos`, `presupuesto`, `seguimiento`, `financiero`, `equipos`, `bodega`, `cotizacion`, `compras`, `aprobacion`.
- [ ] Extraer `AuthContext` de `DataContext` en `src/contexts/AppContext.tsx` para separar estado de autenticación de estado de datos.
- [ ] Mover la lógica de carga y sincronización de datos de `AppContext` a servicios específicos cuando sea posible.
- [ ] Eliminar `useMemo`/`useCallback` innecesarios y evitar cadenas "magic strings" para vistas.

## 2. Servicios y acceso a datos
- [ ] Auditar y mover todas las consultas supabase fuera de componentes UI.
- [ ] Unificar patrones CRUD en servicios tipados y evitar `as any` en `supabase.from()`.
- [ ] Corregir los siguientes servicios con tipos débiles o `Record<string, unknown>`:
  - `src/services/proyectos/BodegaService.ts`
  - `src/services/presupuestos/PresupuestosService.ts`
  - `src/services/seguimiento/BitacoraAvanceService.ts`
  - `src/services/financiero/FinancieroService.ts`
  - `src/services/RenglonesService.ts`
- [ ] Añadir tipos `Database[T]` donde aplique y eliminar conversiones de tipo sin validación.

## 3. Presupuesto
- [ ] Extraer el motor de cálculo de APU a un servicio reutilizable fuera del componente `PresupuestoScreen`.
- [ ] Tipar `persistedCatalog`, `lineas` y `subrenglones` sin usar `as any`.
- [ ] Verificar que `PanelAPUPredictor` reciba datos correctos y que la UI muestre sugerencias de costos históricas.
- [ ] Asegurar que `validarFactores` y `detectarAnomalias` estén integrados en un flujo operativo claro.
- [ ] Revisar tipologías y multiplicadores `nivelCalidad` para que no se mezclen en el componente.

## 4. Compras / Órdenes de compra
- [ ] Revisar el diseño responsive de proveedores, órdenes y recepción.
- [ ] Añadir `overflow-x-auto` a tablas grandes y formularios de OC en móvil.
- [ ] Validar estados de OC con tipos estrictos (`pendiente`, `aprobada`, `recibida_parcial`, `recibida`, `cancelada`).
- [ ] Consolidar el flujo de recepción parcial y recepción total en `OrdenesCompraService`.

## 5. Seguimiento
- [ ] Mejorar `GanttService.calcularRutaCritica` para soportar dependencias de tareas reales.
- [ ] Modelar predecesores/sucesores de líneas de presupuesto en lugar de usar solo índice/orden implícito.
- [ ] Reducir la lógica de métricas en `src/components/screens/SeguimientoScreen.tsx` y delegar a servicios.
- [ ] Verificar que los charts de avance sean móviles y manejables en pantallas pequeñas.

## 6. Financiero
- [ ] Eliminar duplicación entre `src/features/financiero/components/FinancieroScreen.tsx` y `src/components/DashboardFinanciero.tsx`.
- [ ] Mover todos los cálculos de cashflow, proyecciones y salud financiera a `src/services/CoreEngineService.ts`.
- [ ] Tipar categorías y transacciones en `ProfitReport` y otras visualizaciones.
- [ ] Añadir alertas de salud financiera en UI con base en `CoreEngineService.analizarSaludFinanciera`.

## 7. Bodega / Inventario
- [ ] Cambiar `BodegaService` para usar payloads tipados en lugar de `Record<string, unknown>`.
- [ ] Confirmar que ninguna UI usa `supabase.from()` directo.
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
- [ ] Validar el flujo completo de `AprobacionScreen` y su enlace con ordenes / transacciones.
- [ ] Integrar OCR / facturas en la UI si el servicio ya existe.
- [ ] Confirmar que las notificaciones push están implementadas y se muestra el estado al usuario.
- [ ] Añadir un panel de alertas de presupuesto con umbrales de desviación.
- [ ] Documentar el modelo de roles/permiso si se usa en la app.

## Prioridad de ejecución
1. `AppContext` / `ViewType` / tipado base
2. Servicios y eliminación de `any`
3. Motor financiero/cashflow unificado
4. Presupuesto + predictor/anomalías
5. UX móvil/tablas
6. Aprobaciones / OCR / push / RLS
