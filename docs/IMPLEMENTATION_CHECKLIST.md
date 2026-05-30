# Implementación pendiente - CONSTRUSMART WM

## Estado actual (Actualizado: 30/May/2026 · 2:22pm)
- ✅ `ViewType` completo con `compras` y `aprobacion`.
- ✅ `AppLayout.tsx` mapea `ViewType` a componentes.
- ✅ AppContext separa AuthContext y DataContext.
- ✅ Bodega sin `supabase.from()` directo en UI.
- ✅ `addOrdenCompra` en DataContextType.
- ✅ ComprasScreen refresca OC tras crear.
- ✅ FinancieroScreen con modal "+ Nueva Transacción".
- ✅ SeguimientoScreen con `addTransaccion`.
- ✅ `BitacoraAvanceService.ts` tipado fuerte.
- ✅ `MovimientosMaterialesService.ts` tipado fuerte.
- ✅ `RenglonesService.ts` tipado fuerte.
- ✅ `PresupuestosService.ts` tipado fuerte.
- ✅ `Database` tipada: `renglones`, `renglon_usage`, `renglon_precios_historial` (antes `any`).

---

## 🔴 Prioridad 1: Motor de cálculo APU - Mejoras según prompt

### 1.1 Nuevos renglones de losa/cubierta
- [ ] Agregar **Pérgola Metálica** a `renglones.ts` con cálculos automáticos
- [ ] Agregar **Pérgola de Madera** a `renglones.ts` con cálculos automáticos
- [ ] Verificar que **Losa Prefabricada** (06.02) tenga cálculos completos
- [ ] Verificar que **Tejado Teja de Barro** (13.05) tenga cálculos completos

### 1.2 Renglones con dimensiones configurables (Sub-renglones inteligentes)
- [ ] **Cimentación**: Campos largo × ancho × profundidad → cálculo excavación, concreto y acero
- [ ] **Columnas**: Campos sección × altura → cálculo concreto, varillas y desperdicio
- [ ] **Soleras**: Campos sección × longitud → cálculo materiales
- [ ] **Zapatas**: Campos dimensiones → cálculo volumen y acero
- [ ] **Cálculo Automático de Acero** (diámetros y longitudes según dimensiones)

### 1.3 Renglón personalizado mejorado
- [x] Botón "+ Nuevo renglón personalizado" ya existe durante selección
- [ ] Mejorar formulario con filtros de parámetros de cálculo y rendimientos
- [ ] Integrar librería de parámetros de códigos de rendimientos

### 1.4 Parámetros de mercado Guatemala
- [ ] Matriz de costos/m²: Básico Q3,000-3,500, Moderado Q3,500-4,000, Premium Q4,000-5,000
- [ ] Aplicar automáticamente al área total del proyecto
- [ ] Actualizar `TIPOLOGY_MULTIPLIERS` con datos actuales de Guatemala

### 1.5 Informes PDF profesionales
- [ ] **Informe Administrador**: Resumen renglones + desglose/explosión unitario de materiales + tiempo + costos directos/indirectos + APUs
- [ ] **Informe Cliente**: Solo resumen de renglones + total + tiempo de construcción
- [ ] **Membrete empresa** en todos los informes
- [ ] **Firmas** en última hoja
- [ ] **Pie de página** con correo, teléfono, dirección

---

## 🟡 Prioridad 2: Servicios restantes
- [x] ~~Migrar `PresupuestosService.ts` a tipado fuerte~~ ✅ **Completado** (21 `as any` eliminados)
- [ ] Migrar `FinancieroService.ts` a tipado fuerte
- [ ] Eliminar `DBRow = Record<string, unknown>` de `types/supabase.ts` (requiere migración completa de transformadores)

## 🟢 Prioridad 3: UX / Diseño
- [ ] Aplicar `overflow-x-auto` en tablas clave
- [ ] Revisar modales responsive
- [ ] Homogeneizar estilos de botones

## 🔵 Prioridad 4: Funcionalidades avanzadas
- [ ] Validar flujo `AprobacionScreen`
- [ ] Integrar OCR/facturas en UI
- [ ] Panel de alertas de presupuesto con umbrales de desviación

---

## Progreso de refactorización de tipado

| Servicio | Estado | `as any` removidos |
|----------|--------|:------------------:|
| BitacoraAvanceService | ✅ Completo | 3 |
| MovimientosMaterialesService | ✅ Completo | 0 |
| RenglonesService | ✅ Completo | **12** |
| PresupuestosService | ✅ Completo | **21** |
| Database.renglones | ✅ Tipado (antes `any`) | N/A |
| FinancieroService | ⏳ Pendiente | varios |