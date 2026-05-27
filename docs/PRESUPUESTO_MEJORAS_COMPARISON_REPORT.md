# Informe de comparación: estado actual vs prompt de mejoras

## Contexto

Este informe compara los requerimientos del archivo `prompt de mejoras al modulo de presupuesto mayo 2026.txt` con la implementación actual del repositorio.

Se incluyeron los módulos clave:

- `src/features/presupuestos/components/PresupuestoScreen.tsx`
- `src/data/renglones.ts`
- `src/components/screens/Dashboard.tsx`
- `src/components/shared/GanttView.tsx`
- `src/services/seguimiento/GanttService.ts`
- `src/components/screens/BodegaScreen.tsx`
- `src/features/compras/components/ComprasScreen.tsx`
- `src/lib/exporters.ts`
- `src/utils/predictorAPU.ts`
- `src/utils/validacionPresupuesto.ts`

---

## 1. Características completas ya resueltas

### 1.1 Módulo Presupuesto

- Motor APU con **sub-renglones reales**: `src/data/renglones.ts` define `SubMaterial`, `SubManoObra`, `SubEquipo` y `subrenglones` por renglón.
- Cálculo en tiempo real y edición interactiva: `PresupuestoScreen.tsx` usa `calcularAPU()` y `useMemo` para recálculo automático después de cada cambio.
- Acordeón expandible por renglón con detalle de materiales, jornales y equipos.
- Exportación avanzada:
  - `downloadCSV()` genera CSV con resumen de renglones, explosión de materiales, mano de obra y equipo.
  - `exportPresupuestoPDF()` en `src/lib/exporters.ts` genera PDF profesional con tabla de renglones, explosión de materiales, mano de obra, equipo y resumen financiero.
- Validación y anomalías conectadas a UI:
  - `validarFactores()` y `detectarAnomalias()` en `src/utils/validacionPresupuesto.ts`.
  - `PresupuestoScreen.tsx` muestra advertencias, sugerencias y alerts en pantalla.
- Sugerencias históricas de APU:
  - `sugerirAPU()` en `src/utils/predictorAPU.ts`.
  - Botón `Sugerir APU desde históricos` presente en `PresupuestoScreen.tsx`.
- Datos de proyecto y tipologías: la pantalla permite seleccionar tipología, cliente, ubicación y factores.
- Guardado de presupuestos en Supabase con `addPresupuesto` y `updatePresupuesto`.

### 1.2 Módulo Proyectos

- Registro de clientes y proyectos ya existe en app.
- Selección de cliente, tipología y fase en la UI de presupuesto.
- `AppContext` maneja proyectos, fase y transición de fase.

### 1.3 Módulo Seguimiento

- `GanttView.tsx` existe y visualiza proyectos con barras y actividades.
- `GanttService.calcularRutaCritica()` implementa CPM básico con ES/EF/LS/LF y holguras.
- Seguimiento con paginación en `SeguimientoScreen.tsx` y métricas visuales.
- `BitacoraAvancePanel` ya está presente y puede registrar avances.

### 1.4 Módulo Bodega

- `BodegaScreen.tsx` es pantalla dedicada de gestión de bodega.
- Usa `MaterialesService` y `BodegaService` para consultar materiales, movimientos, compras y usos.
- Control de stock por proyecto, con tarjetas de resumen y tabla de materiales.

### 1.5 Módulo Compras

- `ComprasScreen.tsx` existe y ofrece:
  - Lista de órdenes de compra.
  - Generación de folio y creación de OC.
  - Recepción de materiales.
  - Integración con `OrdenesCompraService` y `ProveedoresService`.

### 1.6 Dashboard

- `Dashboard.tsx` presenta una estructura de 3 páginas con KPIs, gráfico de flujo de caja, pie chart, heatmap y Gantt.
- Incluye filtro de proyecto y navegación entre páginas.
- Incorpora resumen de transacciones recientes y OC recientes.

### 1.7 Exportadores y herramientas transversales

- Exportación PDF y CSV mejoradas en `src/lib/exporters.ts`.
- PWA / service worker y notificaciones de la aplicación ya están en el proyecto.
- OCR de facturas disponible en la app.

---

## 2. Funciones parcialmente implementadas

### 2.1 Dashboard

- El concepto de dashboard paginado está implementado en `Dashboard.tsx`.
- Sin embargo, hay un bug concreto: los manejadores `prevPage` y `nextPage` no están definidos en `Dashboard.tsx`, lo que provoca un error de compilación.
- El componente muestra KPI y gráficos, pero requiere corrección de navegación.

### 2.2 Bodega y flujo de compras

- `BodegaScreen.tsx` funciona como gestor de stock por proyecto.
- No hay evidencia clara de un flujo totalmente automático de presupuesto → bodega → compras → recepción dentro del mismo workflow.
- El módulo ya integra compra/uso, pero falta verificar si la selección de renglones del presupuesto está enlazada a la creación de OC de forma automática.

### 2.3 Personal y finanzas

- Existe `FinancieroScreen.tsx`, `ProfitReport` y cálculo de cash flow.
- La lógica de gastos personales y ganancia por proyecto está presente de forma parcial, pero no hay una regla de bloqueo o umbral de gasto personal claramente visible en la UI.

### 2.4 Roles y permisos

- Hay soporte de `equipos` y pantalla de `TeamsScreen`.
- No se encontró un RBAC avanzado o permisos de equipo completos en la interfaz actual.

### 2.5 Notificaciones push

- La app tiene notificaciones de UI y PWA, pero no se encontró una implementación completa de Push API / Web Push server-side.

---

## 3. Gaps concretos para cerrar antes de entregar

### 3.1 Corrección crítica

- `src/components/screens/Dashboard.tsx` necesita definir `prevPage` y `nextPage` para que el componente compile y la paginación funcione.

### 3.2 Verificación de flujo completo presupuesto → compras

- Confirmar e implementar el enlace entre los renglones presupuestados y las órdenes de compra.
- Añadir selección de renglones presupuestados en el flujo de creación de OC si no está hecho.

### 3.3 Validación financiera avanzada

- Añadir control explícito de gastos personales vs ganancia proyectada.
- Implementar alertas/umbral de gastos personales en `FinancieroScreen.tsx` y/o dashboard.

### 3.4 Mejoras de experiencia de dashboard

- Añadir filtros persistentes de fecha y proyecto en dashboard.
- Verificar que Curva S, progreso físico/financiero y métricas principales sean visibles en modo pantalla completa sin scroll.

### 3.5 Roles/seguridad

- Definir si se requiere RBAC adicional para equipos y permisos de edición.
- Si se desea, agregar política de acceso por equipo para proyectos y presupuesto.

### 3.6 Notificaciones push

- Implementar Push API y notificaciones fuera del navegador abierto si el objetivo es “notificaciones push” reales.

---

## 4. Recomendaciones rápidas

1. Arreglar `Dashboard.tsx` como prioridad inmediata.
2. Validar flujo de datos `Presupuesto -> Bodega -> Compras` para cerrar la trazabilidad de materiales.
3. Confirmar la funcionalidad de `ProfitReport` y agregar control de gastos personales si la entrega lo requiere.
4. Revisar roles/permisos si el producto final exige colaboración multiusuario estructurada.
5. Documentar el flujo en un diagrama simple para asegurar que la app entregue la visión ERP solicitada.

---

## 5. Estado general

- El proyecto ya tiene una base sólida de módulos integrados.
- El módulo de presupuesto es robusto y contiene la mayoría de las funciones clave descritas en el prompt.
- Quedan principalmente ajustes de pulido, validación cross-module y cierre de algunos gaps de entregabilidad.

---

### Archivos clave para revisar

ingeniería:

- `src/features/presupuestos/components/PresupuestoScreen.tsx`
- `src/data/renglones.ts`
- `src/lib/exporters.ts`
- `src/components/screens/Dashboard.tsx`
- `src/components/shared/GanttView.tsx`
- `src/services/seguimiento/GanttService.ts`
- `src/components/screens/BodegaScreen.tsx`
- `src/features/compras/components/ComprasScreen.tsx`
- `src/utils/predictorAPU.ts`
- `src/utils/validacionPresupuesto.ts`
