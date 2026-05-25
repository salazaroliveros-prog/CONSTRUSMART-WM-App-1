# PLAN DE MEJORAS V2 - Automatización, UX y Precisión

## Resumen
Después de implementar las 15 mejoras base, se identifican 18 nuevas mejoras organizadas en 3 ejes: Automatización/Producción, Exactitud/Control, y UX Visual/Transiciones.

---

## Eje 1: Automatización y Producción

### M1 - Reportería Automática (PDF/Excel programado)
**Impacto:** ALTO | **Esfuerzo:** 2 días

Generar informes PDF/Excel automáticos al cambiar de fase o semanalmente.
- Al transicionar a `"Finalizado"`, generar PDF de cierre con: ingresos reales vs presupuestados, rentabilidad, avance final
- Botón "Reporte Semanal" que compila: proyectos activos, transacciones de la semana, avances
- Exportación batch: seleccionar múltiples presupuestos y exportar como un solo PDF

```typescript
// src/utils/reporteAutomatico.ts
export function generarReporteCierre(presupuesto: Presupuesto, transacciones: Transaccion[]) { ... }
export function reporteSemanal(presupuestos: Presupuesto[], transacciones: Transaccion[]) { ... }
```

### M2 - Dashboard de Productividad en Tiempo Real
**Impacto:** ALTO | **Esfuerzo:** 3 días

Dashboard en vivo con WebSocket/Realtime para ver cambios sin recargar.
- Contador de proyectos activos con LED verde parpadeante
- Timeline horizontal de actividades del día (como un calendario semanal)
- Tarjeta "Últimos cambios" que muestra las últimas 5 transiciones de fase con timestamp
- Badge de notificación en el Header cuando hay cambios nuevos

```typescript
// En AppContext, canal realtime unificado
const canalRealtime = supabase.channel('cambios')
  .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    notificarCambio(payload);
  }).subscribe();
```

### M3 - Asistente Inteligente de Presupuestos (APU Predictivo)
**Impacto:** ALTO | **Esfuerzo:** 4 días

Sistema de predicción de costos basado en presupuestos anteriores.
- Al crear un nuevo presupuesto, mostrar "Presupuestos similares" basado en tipología y monto
- Sugerir factores (indirectos, administrativos, utilidad) basados en el histórico
- Calcular duración estimada del proyecto basada en renglones y cantidades

```typescript
// src/utils/predictorAPU.ts
export function sugerirFactores(presupuestosAnteriores: Presupuesto[], tipologia: string) {
  // Promedio de factores de presupuestos similares
}
```

### M4 - Automatización de Flujo de Caja Proyectado
**Impacto:** ALTO | **Esfuerzo:** 2 días

Proyección automática de ingresos y egresos basada en transacciones recurrentes y fases.
- Detectar transacciones recurrentes (mano de obra semanal, alquiler mensual)
- Proyectar flujo a 30/60/90 días
- Alertas de déficit: "Si no se registra un ingreso en los próximos 15 días, el flujo será negativo"

```typescript
// src/hooks/useCashflowProyectado.ts
export function useCashflowProyectado(dias: number) {
  // Proyectar transacciones recurrentes + ingresos por fase
}
```

### M5 - Escáner de Facturas / OCR
**Impacto:** ALTO | **Esfuerzo:** 5 días (requiere API externa)

Subir foto de factura y extraer automáticamente: monto, proveedor, fecha, categoría.
- Integrar con Tesseract.js o API de Google Vision
- Asociar factura a transacción automáticamente
- Galería de facturas por proyecto

---

## Eje 2: Exactitud y Control

### M6 - Control de Cambios (Change Orders)
**Impacto:** ALTO | **Esfuerzo:** 3 días

Sistema de órdenes de cambio para modificar presupuestos aprobados.
- Cada cambio genera una "versión" del presupuesto
- Dif entre versiones: "Renglón X: Q 15,000 → Q 18,500 (+23%)"
- Aprobación requerida para cambios >10% del presupuesto original
- Historial completo de cambios visible en una línea de tiempo

```sql
CREATE TABLE cambios_presupuesto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid REFERENCES presupuestos(id),
  version int NOT NULL,
  cambios jsonb, -- { renglon_id: { anterior: X, nuevo: Y, motivo: "..." } }
  aprobado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

### M7 - Validación de Factores Financieros
**Impacto:** MEDIO | **Esfuerzo:** 1 día

Validación automática de márgenes y rentabilidad al guardar presupuesto.
- Advertencia si la utilidad proyectada es <10%
- Advertencia si los indirectos + administrativos + imprevistos > 40%
- Sugerencia automática de factores basada en la tipología
- Indicador de salud del presupuesto: ✅ Bueno / ⚠️ Riesgo / ❌ Crítico

### M8 - Conciliación Bancaria / Caja Chica
**Impacto:** MEDIO | **Esfuerzo:** 3 días

Seguimiento de efectivo disponible vs registrado.
- Saldo inicial configurable por proyecto
- Registrar "Retiros" y "Depósitos" como subtipos de transacción
- Saldo actual vs saldo esperado (diferencia = conciliación pendiente)
- Alertas cuando el saldo disponible es insuficiente para gastos programados

### M9 - Trazabilidad de Materiales por Renglón
**Impacto:** ALTO | **Esfuerzo:** 4 días

Seguimiento físico de materiales desde el APU hasta la ejecución.
- Al seleccionar un renglón en ejecución, ver materiales comprados vs presupuestados
- Registrar "consumo real" de materiales
- Cálculo automático de desperdicio: (comprado - usado) / presupuestado
- Alerta si el desperdicio > 10%

```sql
CREATE TABLE consumo_materiales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  renglon_codigo text NOT NULL,
  presupuesto_id uuid REFERENCES presupuestos(id),
  cantidad_presupuestada numeric NOT NULL,
  cantidad_comprada numeric DEFAULT 0,
  cantidad_consumida numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
```

### M10 - Checklist de Calidad por Fase
**Impacto:** MEDIO | **Esfuerzo:** 2 días

Listas de verificación obligatorias para avanzar de fase.
- Checklist predefinido por tipología (para "Residencial": cimientos, columnas, losa, etc.)
- Cada ítem requiere: foto + firma digital + fecha
- No se puede transicionar a "Finalizado" sin checklist completo

---

## Eje 3: UX Visual, Transiciones y Efectos

### M11 - Transiciones Animadas entre Módulos
**Impacto:** MEDIO | **Esfuerzo:** 2 días

Animaciones fluidas al navegar entre vistas.
- Usar `framer-motion` o View Transitions API:
  - Slide horizontal al cambiar de módulo (izquierda/derecha según navegación)
  - Fade + scale para modales y paneles
  - Stagger children para listas (ítems aparecen uno tras otro)
- Transiciones de 200-300ms con easing `cubic-bezier(0.4, 0, 0.2, 1)`

```typescript
// Ejemplo con framer-motion en AppLayout
<motion.div
  key={view}
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.2 }}
>
  {renderView()}
</motion.div>
```

### M12 - Micro-interacciones en Botones
**Impacto:** BAJO | **Esfuerzo:** 1 día

Efectos sutiles que mejoran la percepción de respuesta.
- Ripple effect al hacer click (onda expansiva)
- Scale bounce: botón se "encoge" ligeramente al hacer click y rebota
- Loading spinner inline en botones de acción (no texto "Guardando...")
- Success checkmark animado después de guardar
- Hover glow en tarjetas del Dashboard

```css
/* En index.css */
.btn-ripple {
  position: relative;
  overflow: hidden;
}
.btn-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}
.btn-ripple:active::after {
  opacity: 1;
  transform: scale(2);
}
```

### M13 - Skeleton Loaders y Estados Vacíos
**Impacto:** MEDIO | **Esfuerzo:** 2 días

Pantallas de carga elegantes mientras se cargan datos.
- Skeleton cards para el Dashboard (misma forma que las KPI reales)
- Skeleton table rows para listas
- Estados vacíos ilustrados con iconos + mensaje + CTA
- Loading shimmer animation (gradiente animado)

```typescript
const SkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-slate-200 rounded-xl h-24 p-3">
    <div className="w-1/3 h-3 bg-slate-300 rounded mb-2" />
    <div className="w-1/2 h-5 bg-slate-300 rounded" />
  </div>
);
```

### M14 - Vista Calendario Mejorada (Gantt básico)
**Impacto:** ALTO | **Esfuerzo:** 3 días

Calendario tipo Gantt para visualizar proyectos en el tiempo.
- Barras horizontales por proyecto: ancho = duración estimada
- Colores por fase (azul = ejecución, verde = finalizado, etc.)
- Línea vertical de "hoy"
- Hover para ver detalles del proyecto

### M15 - Modo Oscuro Completo
**Impacto:** MEDIO | **Esfuerzo:** 2 días

Asegurar que todas las pantallas tengan modo oscuro consistente.
- Mapear todos los colores hardcodeados a variables CSS
- `dark:` variants en cada componente
- Toggle animado (luna ↔ sol)
- Persistir preferencia en localStorage

### M16 - Barra de Búsqueda Global Mejorada
**Impacto:** BAJO | **Esfuerzo:** 1 día

Mejoras a la Command Palette existente.
- Atajo visible en cada pantalla (⌘K tooltip)
- Búsqueda por cliente, no solo por proyecto
- Búsqueda por monto (ej: "presupuestos > 50000")
- Sección "Acciones rápidas": Nueva transacción, Nuevo cliente, etc.
- Fuzzy search con resultados priorizados

### M17 - Notificaciones Push y Badges
**Impacto:** ALTO | **Esfuerzo:** 3 días

Notificaciones del sistema para eventos importantes.
- Badge rojo en el Header con conteo de notificaciones no leídas
- Toast notification cuando otro miembro del equipo hace un cambio
- Notificaciones para: cambio de fase, transacción grande (>Q10,000), checklist pendiente
- Panel de notificaciones (campanita → dropdown)

```sql
CREATE TABLE notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  tipo text NOT NULL, -- 'fase', 'transaccion', 'checklist'
  mensaje text NOT NULL,
  leida boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

### M18 - Panel de Control Ejecutivo (Dashboard V2)
**Impacto:** MUY ALTO | **Esfuerzo:** 5 días

Dashboard ejecutivo rediseñado con KPIs visuales y gráficos interactivos.
- Mapa de calor de rentabilidad por proyecto (verde = rentable, rojo = pérdida)
- Gráfico de dona: distribución de gastos por categoría con drill-down
- Indicador de salud general: semáforo (🟢/🟡/🔴)
- Timeline de hitos del proyecto (próximos 30 días)
- Chart interactivo: zoom, tooltips detallados, click para filtrar
- Gauge charts para avance físico y financiero

---

## Priorización Recomendada

| Prioridad | Mejora | Impacto | Esfuerzo | Dependencias |
|-----------|--------|---------|----------|--------------|
| P0 | M11 - Transiciones animadas | Visual | 2d | Ninguna |
| P0 | M12 - Micro-interacciones | Visual | 1d | Ninguna |
| P0 | M18 - Dashboard V2 | UX | 5d | Ninguna |
| P1 | M1 - Reportería automática | Prod | 2d | Mejora 8 (xlsx) |
| P1 | M6 - Control de cambios | Control | 3d | Migración SQL |
| P1 | M14 - Vista Gantt | Visual | 3d | Calendario existente |
| P2 | M2 - Dashboard tiempo real | Prod | 3d | Realtime Supabase |
| P2 | M7 - Validación factores | Control | 1d | Tipos existentes |
| P2 | M10 - Checklist calidad | Control | 2d | Tipologías |
| P3 | M3 - APU Predictivo | Prod | 4d | Historial datos |
| P3 | M4 - Flujo caja proyectado | Prod | 2d | M2 Dashboard |
| P3 | M17 - Notificaciones | UX | 3d | SQL migration |
| P4 | M5 - OCR Facturas | Prod | 5d | API externa |
| P4 | M8 - Conciliación bancaria | Control | 3d | SQL migration |
| P4 | M9 - Trazabilidad materiales | Control | 4d | SQL migration |
| P4 | M13 - Skeleton loaders | Visual | 2d | Ninguna |
| P4 | M15 - Modo oscuro completo | Visual | 2d | Tema existente |
| P4 | M16 - Búsqueda mejorada | Visual | 1d | CmdK existente |

## Conclusión

### Línea base actual (implementado ✅)
- 15 mejoras completadas: strict mode, unificación presupuestos, triggers financieros,
  React Query, RLS, audit log, Excel, command palette, rentabilidad, paginación, equipos

### Prioridad inmediata (P0) - Visual
**M11 + M12 + M18** son las de mayor impacto visual con esfuerzo moderado.
Transforman la experiencia de usuario de "funcional" a "profesional".

### Prioridad alta (P1) - Automatización y Control
**M1 + M6 + M14** agregan valor tangible para la gestión de construcción:
reportes automáticos, control de cambios presupuestarios, y vista de tiempo.

### Prioridad media (P2) - Calidad
**M2 + M7 + M10** mejoran la calidad de datos y la visibilidad en tiempo real.

### Futuro (P3-P4)
Características avanzadas como OCR, trazabilidad de materiales, y conciliación bancaria.
