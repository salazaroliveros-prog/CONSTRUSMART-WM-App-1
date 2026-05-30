# Implementación pendiente - CONSTRUSMART WM

## Estado actual (Actualizado: 30/May/2026 · 2:41pm)
### ✅ Core / Navegación — COMPLETADO
- ✅ `ViewType` completo con `compras` y `aprobacion`
- ✅ `AppLayout.tsx` mapea `ViewType` a componentes
- ✅ AppContext separa AuthContext y DataContext
- ✅ `addOrdenCompra` en DataContextType + implementación con offline
- ✅ Eliminados `any` en AppContext: `(value as any).id`, `dbRecord as any`, `catch (error: any)` × 3

### ✅ Servicios y acceso a datos — COMPLETADO
- ✅ Sin `supabase.from()` en componentes UI (verificado: 0 resultados)
- ✅ `BitacoraAvanceService.ts` tipado fuerte (3 `as any` → 0)
- ✅ `MovimientosMaterialesService.ts` tipado fuerte con `satisfies`
- ✅ `RenglonesService.ts` tipado fuerte (12+ `as any` → 0)
- ✅ `PresupuestosService.ts` tipado fuerte (21 `as any` → 0)
- ✅ `FinancieroService.ts` tipado fuerte (`Record<string, unknown>` → `Partial<DBTransaccion>`)

### ✅ Tipado base
- ✅ `Database` tipada: `renglones`, `renglon_usage`, `renglon_precios_historial` (antes `any`)
- ✅ Interfaces `DBRenglon`, `DBRenglonUsage`, `DBRenglonPrecioHistorial` definidas
- ✅ DBRow marcado como TODO para migración futura a `Database[T]`

### ✅ Conexión bilateral (Plan 100%)
- ✅ `addOrdenCompra` en `AppContext.DataContextType` + implementación offline
- ✅ ComprasScreen refresca OC tras crear con `refreshOrdenesCompra()`
- ✅ FinancieroScreen: botón "+ Nueva Transacción" con modal completo
- ✅ SeguimientoScreen: `addTransaccion` disponible en contexto

### ✅ Motor de cálculo APU (prompt mejoramiento)
- ✅ `MERCADO_GUATEMALA`: Niveles Básico (Q3,000-3,500), Moderado (Q3,500-4,000), Premium (Q4,000-5,000)
- ✅ `calcularCostoM2Guatemala()`: calcula costo min/max/promedio
- ✅ `TIPOLOGY_MULTIPLIERS` con 6 tipologías
- ✅ `DimensionesCimentacion`, `DimensionesColumna`, `DimensionesSolera`, `DimensionesZapata`
- ✅ `calcularCimentacionPorDimensiones`, `calcularColumnaPorDimensiones`, `calcularSoleraPorDimensiones`, `calcularZapataPorDimensiones`
- ✅ Pérgola Metálica (13.03), Pérgola de Madera (13.04), Tejado Teja de Barro (13.05), Losa Prefabricada (06.02) ya existen con materiales actualizados

### ✅ PDF Export — COMPLETADO
- ✅ `exportPresupuestoPDF()` con tipo `'admin'` | `'cliente'`
- ✅ Membrete CONSTRUCTORA WM/M&S con logo
- ✅ Pie de página con dirección, teléfono, email, NIT, página
- ✅ Firmas: Elaboró, Revisó, Vo.Bo. (solo admin)
- ✅ Explosión de materiales, MO, equipo (solo admin)
- ✅ Resumen financiero diferenciado por tipo
- ✅ Tiempo estimado de obra

### ✅ Verificación
- ✅ `npm run typecheck` → 0 errores
- ✅ `npm run test` → 17/17 tests pasan (6 archivos)