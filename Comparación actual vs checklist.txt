Comparación actual vs checklist
He revisado el código real y esto es lo que está implementado versus lo que todavía falta.

1. Core / Navegación
AppLayout.tsx
✅ Navegación interna ya funciona
✅ Se actualizó `renderViewContent(v: ViewType)` a un mapeo tipado de vistas
⚠️ Falta tipado sólido adicional en AppContext y sigue siendo un mega-contexto
AppContext.tsx
✅ Auth, theme, offline, sync están en marcha
✅ Reconciliación realtime tipada y caché offline con tipos específicos
✅ Build de producción validado tras cambio de AppContext
✅ Se eliminó la declaración duplicada de `loadingRef`
⚠️ Sigue siendo un “mega contexto” con auth + datos + realtime + offline + mutaciones
⚠️ Hay muchos any, Record<string, unknown> y casting directo
2. Servicios y acceso a datos
AppDataService.ts
✅ Carga tablas centralizadas
⚠️ Sigue usando supabase.from() directamente y no es el único centro de datos
Servicios individuales
BodegaService.ts → ya no usa supabase.from directo
PresupuestosService.ts → as any, Record<string, unknown)
BitacoraAvanceService.ts → as any
FinancieroService.ts → uso de Record<string, unknown)
✅ Compras usa servicios, pero los servicios todavía tienen tipos débiles
3. Presupuesto
PresupuestoScreen.tsx
✅ Catálogo, cálculo APU, filtros y guardado están presentes
✅ PanelAPUPredictor ya está integrado en el UI
✅ Eliminado `as any` en `persistedCatalog` y tipado del guardado de renglones personalizados
⚠️ Sigue existiendo deuda en `lineas` y memoria de cálculo todavía está dentro del componente en vez de un motor reutilizable
4. Compras / Órdenes de compra
ComprasScreen.tsx
✅ UI de proveedores + OC + recepción existe
⚠️ Falta la mejora UX/responsive más agresiva para tablas y modales grandes
✅ Se basa en ProveedoresService y OrdenesCompraService
5. Seguimiento
SeguimientoScreen.tsx
✅ Gráficas y métricas están activas
⚠️ El cálculo de ruta crítica usa GanttService.calcularRutaCritica con datos de líneas de presupuesto simples
⚠️ No modela dependencias reales entre tareas ni predecesores reales
6. Financiero
FinancieroScreen.tsx
✅ Usa CoreEngineService.proyectarTendencia
⚠️ Hay duplicación de lógica financiera en componentes como DashboardFinanciero.tsx
⚠️ Todavía existen cálculos directos en UI que pueden trasladarse al motor
7. Bodega / Inventario
BodegaScreen.tsx
✅ UI sin supabase.from() directo
✅ Se reforzó el tipado en el mapeo de materiales y movimientos
BodegaService.ts
✅ Ya no usa `supabase.from()` directo; delega a `MovimientosMaterialesService`
⚠️ `MovimientosMaterialesService.ts` sigue utilizando `supabase.from('movimientos_materiales')`
8. UX / Diseño / Estilos
✅ Buen uso general de Tailwind, cards y gradientes
⚠️ Tablas grandes y modales aún no son totalmente móviles
⚠️ Hay inconsistencia de clases y estados visuales
⚠️ No hay overflow-x uniforme en muchas listas de datos
9. Calidad de código
✅ Hay servicios y Zod en partes del proyecto
⚠️ Tipado general aún es débil: any, Record<string, unknown>, Partial<any>
⚠️ AppContext.tsx sigue siendo un foco de deuda técnica
10. Funcionalidades avanzadas
Reportes automáticos: presente pero no completo
OCR / facturas: existen servicios, pero no está integrado UX terminado
Push notifications: hay menciones pero no validación completa
Aprobaciones/workflows: hay pantallas pero no flujo completo
RLS/roles: no revisado en el cliente, muy probable deuda
Checklist de implementación para lo que falta
A. Core / Navegación
 Cambiar renderViewContent(v: string) a renderViewContent(v: ViewType)
 Añadir validación exhaustiva de ViewType en AppContext y en Sidebar
 Separar AuthContext de DataContext para eliminar la mezcla de responsabilidades
 Reducir lógica de AppContext: mover carga de datos y realtime a servicios específicos
B. Servicios y acceso a datos
 Auditar todos los supabase.from() que quedan en servicios
 Mover todas las consultas y mutaciones a servicios tipados
 Crear un BaseService o DbService con métodos CRUD tipados
 Eliminar Record<string, unknown> y as any de:
BodegaService.ts
PresupuestosService.ts
BitacoraAvanceService.ts
FinancieroService.ts
RenglonesService.ts
C. Presupuesto
 Extraer cálculo de APU y tipologías a un motor reutilizable / servicio aparte
 Tipar persistedCatalog y lineas sin any
 Validar integración de PanelAPUPredictor con datos históricos y sugerencias
 Mover validarFactores / detectarAnomalias a un servicio reutilizable si aún no lo está
D. Compras / OC
 Auditar modales de proveedores y OC para responsive overflow-x-auto
 Reforzar los estados estatus con tipos claros
 Consolidar UX de recepción parcial vs total
E. Seguimiento
 Mejorar GanttService.calcularRutaCritica para soportar dependencias reales
 Añadir modelado de predecesores / sucesores por línea de presupuesto
 Reducir lógica de métricas en el componente y moverla a servicios
F. Financiero
 Eliminar duplicación entre FinancieroScreen.tsx y DashboardFinanciero.tsx
 Extraer todos los cálculos de flujo de caja a CoreEngineService
 Tipar transacciones, presupuestos y categorías en ProfitReport ✅ (30-05-2026)

Registro de progreso:
- 30-05-2026: Añadidos tipos auxiliares en `src/types/supabase.ts` (categorías y guardias de tipo).
- 30-05-2026: Actualizado `src/features/financiero/components/ProfitReport.tsx` para usar guardias tipadas y eliminar `as any` en filtros de categoría.
- 30-05-2026: Ejecutado `npm run typecheck` — sin errores.
- 30-05-2026: Ejecutados tests (vitest) — 17/17 pasados.
- 30-05-2026: Ejecutado `npm run build` — build de producción generado correctamente.

G. Bodega / Inventario
 Cambiar BodegaService para usar tipos claros en payloads
 Verificar que ningún UI usa supabase.from() directo
 Añadir validaciones de stock y de material inexistente
H. UX / Responsive
 Añadir overflow-x-auto a tablas en:
Clientes
Compras / OC
Presupuestos
Seguimiento
 Revisar modales de ancho y convertirlos a pantallas móviles cuando haga falta
 Homogeneizar botones / cards / estados hover/focus
I. Tipado TS
 ✅ Eliminar any en AppContext.tsx (realtime y caché offline)
 Eliminar Record<string, unknown> en supabase.ts donde sea innecesario
 Añadir tipos específicos de Database[T] en servicios
 Asegurar que ViewType cubre todas las vistas usadas (compras, aprobacion, etc.)
J. Funcionalidades avanzadas
 Validar completo el flujo de AprobacionScreen
 Integrar el servicio OCR con formulario de factura si está disponible
 Verificar push notifications en el cliente y mostrar estado
 Añadir alertas de salud de presupuesto y score de proyecto
 Documentar roles/permiso de vistas si se usa session.user
Prioridad recomendada
AppContext / ViewType / tipado base
Servicios y eliminación de any
Unificar motor financiero / cashflow
Mejorar Presupuesto + predictor/anomalías
Pulir UX móvil/tablas
Completar Aprobaciones / OCR / push / RLS