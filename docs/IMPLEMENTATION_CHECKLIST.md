# Implementación pendiente - CONSTRUSMART WM

## Estado actual (Actualizado: 30/May/2026 · 3:06pm)

### ✅ Core / Navegación — COMPLETADO
- ✅ `ViewType` completo con `compras` y `aprobacion`
- ✅ `AppLayout.tsx` mapea `ViewType` a componentes
- ✅ AppContext separa AuthContext y DataContext
- ✅ `addOrdenCompra` en DataContextType + implementación con offline
- ✅ Eliminados todos los `any` en AppContext

### ✅ Servicios y acceso a datos — COMPLETADO
- ✅ Sin `supabase.from()` en componentes UI
- ✅ **BitacoraAvanceService** tipado fuerte (3 `as any` → 0)
- ✅ **MovimientosMaterialesService** tipado fuerte con `satisfies`
- ✅ **RenglonesService** tipado fuerte (12+ `as any` → 0)
- ✅ **PresupuestosService** tipado fuerte (21 `as any` → 0)
- ✅ **FinancieroService** tipado fuerte (sin `Record<string, unknown>`)
- ✅ **AgenteInteligente** tipado con `Presupuesto`, `Transaccion`
- ✅ **ChangeOrderService** tipado con `CambiosPresupuesto`
- ✅ **ChecklistService** tipado con `ChecklistItem`
- ✅ **LoggerService** tipado con `unknown` en vez de `any`
- ✅ **OrdenesCompraService** tipado fuerte (últimos `as any` eliminados)

### ✅ Tipado base
- ✅ `Database` tipada: `renglones`, `renglon_usage`, `renglon_precios_historial`
- ✅ Interfaces `DBRenglon`, `DBRenglonUsage`, `DBRenglonPrecioHistorial`

### ✅ Conexión bilateral (Plan 100%)
- ✅ `addOrdenCompra` en `DataContextType` + implementación offline
- ✅ ComprasScreen refresca OC tras crear con `refreshOrdenesCompra()`
- ✅ FinancieroScreen: botón "+ Nueva Transacción" con modal completo
- ✅ SeguimientoScreen: `addTransaccion` disponible en contexto

### ✅ Motor de cálculo APU
- ✅ `MERCADO_GUATEMALA` (Básico Q3,000-3,500, Moderado Q3,500-4,000, Premium Q4,000-5,000)
- ✅ `calcularCostoM2Guatemala()` con costo min/max/promedio
- ✅ `TIPOLOGY_MULTIPLIERS` con 6 tipologías
- ✅ Funciones dimensionales: cimentación, columnas, soleras, zapatas
- ✅ Interfaces: `DimensionesCimentacion`, `DimensionesColumna`, `DimensionesSolera`, `DimensionesZapata`
- ✅ Renglones de losa/cubierta: Pérgola Metálica (13.03), Pérgola de Madera (13.04), Tejado Teja de Barro (13.05), Losa Prefabricada (06.02)

### ✅ PDF Export — COMPLETADO
- ✅ `exportPresupuestoPDF()` con tipo `'admin'` | `'cliente'`
- ✅ Membrete CONSTRUCTORA WM/M&S con logo
- ✅ Pie de página con dirección, teléfono, email, NIT, página
- ✅ Firmas: Elaboró, Revisó, Vo.Bo. (solo admin)
- ✅ Explosión de materiales, MO, equipo (solo admin)
- ✅ Resumen financiero diferenciado por tipo
- ✅ Tiempo estimado de obra

### ✅ Bodega / Inventario
- ✅ Validación de stock en `registrarUso` (lanza error si stock insuficiente)

### ✅ Verificación final
- ✅ `npm run typecheck` → 0 errores
- ✅ `npm run test` → 17/17 tests pasan (6 archivos)
- ✅ `as any)` en src/services/ → 0
- ✅ `as any` en AppContext → 0