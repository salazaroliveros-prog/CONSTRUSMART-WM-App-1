# 🎯 PLAN MAESTRO DE REFACTORIZACIÓN - CONSTRUSMART WM App

**Fecha**: 25 de mayo de 2026  
**Objetivo**: Transformar en plataforma moderna, potente y profesional  
**Enfoque Principal**: Módulo de Presupuesto como motor de cálculo avanzado

---

## FASE 1: FUNDAMENTOS & INFRAESTRUCTURA (4-5 horas)

### 1.1 Modernizar AppContext y Estado Global
**Archivo**: `src/contexts/AppContext.tsx`

**Cambios**:
- ✅ Integrar Equipos completamente (CRUD + realtime)
- ✅ Crear hooks especializados por módulo
- ✅ Agregar error handling centralizado
- ✅ Implementar undo/redo para operaciones críticas
- ✅ Agregar caché inteligente de datos

**Nuevos archivos**:
```
src/hooks/usePresupuestos.ts        # Hook especializado
src/hooks/useEquipos.ts             # Hook para equipos
src/hooks/useTransacciones.ts       # Hook para transacciones
src/hooks/useOptimisticUpdates.ts   # Para UI sin lag
src/services/CalculoService.ts      # Motor de cálculos
```

### 1.2 Crear Service Layer
**Archivos nuevos**:
```
src/services/
├── PresupuestoService.ts       # Lógica de presupuestos
├── RenglonesService.ts         # Gestión de renglones
├── ExportService.ts            # PDF/CSV avanzado
├── CalculoService.ts           # Motor matemático
├── EquiposService.ts           # Lógica de equipos
└── CacheService.ts             # Caché inteligente
```

### 1.3 Actualizar Esquemas Zod
**Consolidar en**: `src/types/supabase.ts`
- Unificar todos los esquemas
- Agregar validaciones avanzadas
- Crear schemas para subrenglones
- Agregar schemas para materiales unitarios

---

## FASE 2: REDISEÑO DEL MÓDULO DE PRESUPUESTO (8-10 horas)

Este es el **corazón de la refactorización**. Será el módulo más potente.

### 2.1 Crear Motor de Cálculo Avanzado

**Archivo**: `src/services/CalculoService.ts`

**Funcionalidades**:
```typescript
// Cálculos automáticos en tiempo real
- Costo unitario = Material + Mano de Obra + Herramienta
- Subtotal línea = Costo Unitario × Cantidad
- Costo Directo = Sum(Subtotales)
- Indirectos = Costo Directo × Factor%
- Administrativos = Costo Directo × Factor%
- Imprevistos = Costo Directo × Factor%
- Subtotal = Costo Directo + Indirectos + Admin + Imprevistos
- Utilidad = Subtotal × Factor%
- TOTAL = Subtotal + Utilidad

// Cálculos avanzados
- Análisis de sensibilidad (¿qué pasa si cambio X factor?)
- Proyecciones financieras
- Comparación con histórico
- Alertas de presupuesto
```

### 2.2 Crear Nueva Estructura de Renglones

**Interfaz mejorada**:
```typescript
interface Renglon {
  id: string;
  codigo: string;                    // ID único
  descripcion: string;
  unidad: string;
  rendimiento: number;               // unidades/día
  costoMaterial: number;
  costoManoObra: number;
  costoHerramienta: number;
  
  // Nuevos campos
  subrenglones?: SubRenglon[];       // Desglose detallado
  materiales?: MaterialUnitario[];   // Detalle de materiales
  estimacionTiempo?: number;         // Días estimados
  dificultad?: 'baja' | 'media' | 'alta';
  equipoRequerido?: string[];        // Equipos necesarios
  notas?: string;
  categoria?: string;
  activo: boolean;
}

interface SubRenglon {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  costoTotal: number;
}

interface MaterialUnitario {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;  // EDITABLE
  costoTotal: number;
  proveedor?: string;
  especificaciones?: string;
}
```

### 2.3 Crear Biblioteca Inteligente de Renglones

**Archivo**: `src/features/presupuestos/lib/RenglonesLibrary.ts`

**Funcionalidades**:
```
- Búsqueda avanzada (por código, descripción, categoría)
- Filtros por tipología
- Historial de uso (renglones más usados)
- Favoritos personalizados
- Crear renglones custom
- Clonar y modificar renglones
- Importar desde CSV
- Validación automática de datos
- Versionado de cambios en renglones
```

### 2.4 Rediseñar Interfaz PresupuestoScreen

**Nueva estructura de 3 paneles**:

```
┌─────────────────────────────────────────────────────────┐
│ ENCABEZADO: Proyecto | Cliente | Ubicación | Tipología │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────────────┐  ┌──────────────────────────────┐ │
│ │  PANEL IZQUIERDO │  │    PANEL CENTRAL             │ │
│ │  (30% ancho)     │  │    (50% ancho)               │ │
│ ├──────────────────┤  │                              │ │
│ │                  │  │  Tabla de Líneas:            │ │
│ │ • Búsqueda       │  │  • Código | Descripción     │ │
│ │ • Filtros        │  │  • Cant | Unidad | Costo    │ │
│ │ • Categorías     │  │  • Editar | Eliminar        │ │
│ │ • Favoritos      │  │  • Expandir (subrenglones)  │ │
│ │ • Recientes      │  │                              │ │
│ │ • + Crear Custom │  │  DETALLES RENGLÓN (expandido)│ │
│ │                  │  │  └─ Subrenglones            │ │
│ │                  │  │  └─ Materiales unitarios    │ │
│ │                  │  │  └─ Estimación de tiempo    │ │
│ └──────────────────┘  └──────────────────────────────┘ │
│                                                         │
│ ┌──────────────────────────────────────────────────────┐ │
│ │  PANEL DERECHO (20% ancho) - RESUMEN EN VIVO       │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │                                                      │ │
│ │ Costo Directo:        $1,250,000                   │ │
│ │ Indirectos (15%):     $  187,500                   │ │
│ │ Administrativos(10%): $  125,000                   │ │
│ │ Imprevistos (5%):     $   62,500                   │ │
│ │ ────────────────────────────────                   │ │
│ │ Subtotal:             $1,625,000                   │ │
│ │ Utilidad (20%):       $  325,000                   │ │
│ │ ════════════════════════════════                   │ │
│ │ TOTAL:                $1,950,000                   │ │
│ │                                                      │ │
│ │ Estimado: 45 días                                   │ │
│ │ Precio/día: $43,333                                │ │
│ │                                                      │ │
│ │ [Generar PDF] [Exportar CSV]                       │ │
│ │ [Guardar] [Duplicar] [Compartir]                  │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## FASE 3: EXPORTACIÓN AVANZADA (3-4 horas)

### 3.1 PDF Profesional Mejorado

**Archivo**: `src/services/ExportService.ts`

**Contenido del PDF**:
- Encabezado con logo y datos empresa
- Datos del proyecto y cliente
- Tabla principal de presupuesto con todas las líneas
- **Desglose de materiales unitarios por línea**
- Gráfico de distribución de costos
- Resumen de factores aplicados
- Análisis financiero (gráficos)
- Pie de página con firma digital

**Estilo**:
- Diseño profesional y elegante
- Colores corporativos (WM/M&S)
- Tablas bien formateadas
- Gráficos integrados
- Responsive para impresión

### 3.2 CSV Avanzado

**Estructura**:
```csv
PRESUPUESTO: [nombre]
CLIENTE: [cliente]
UBICACIÓN: [ubicación]
FECHA: [fecha]
---

LÍNEAS DE PRESUPUESTO
Código,Descripción,Cantidad,Unidad,Costo Unitario,Costo Total

MATERIALES UNITARIOS POR LÍNEA
Código Línea,Material,Cantidad,Unidad,Costo Unit,Costo Total

RESUMEN FINANCIERO
Costo Directo,Indirectos,Administrativos,Imprevistos,Subtotal,Utilidad,TOTAL

ANÁLISIS
Precio por día,Margen %,Factor promedio
```

### 3.3 Exportar a Excel (Bonus)

**Usando `xlsx` library**:
- Múltiples hojas (Resumen, Detalle, Materiales, Análisis)
- Formato profesional
- Gráficos interactivos
- Celdas editable con fórmulas

---

## FASE 4: MEJORAS DE INTERFAZ & UX (5-6 horas)

### 4.1 Rediseño Visual Moderno

**Cambios de Estilos**:
- ✅ Gradientes sofisticados (azul → verde esmeralda)
- ✅ Efectos glassmorphism en paneles
- ✅ Animaciones suaves (framer-motion)
- ✅ Dark mode mejorado
- ✅ Tipografía más elegante (Inter/Poppins)
- ✅ Espaciado y proporciones áureas

**Componentes nuevos**:
```
src/components/presupuestos/
├── PresupuestoHeader.tsx         # Encabezado mejorado
├── RenglonesTable.tsx             # Tabla interactiva
├── RenglonesLibraryPanel.tsx      # Biblioteca lateral
├── RenglonesDetailPanel.tsx       # Panel de detalles
├── SubrenglonesEditor.tsx         # Editor de subrenglones
├── MaterialesUnitariosEditor.tsx  # Editor de materiales
├── PresupuestoSummary.tsx         # Resumen en vivo
├── CalculoVisualization.tsx       # Visualización de cálculos
└── PresupuestoComparison.tsx      # Comparar presupuestos
```

### 4.2 Agregar Interactividad Avanzada

**Funcionalidades**:
- Arrastrar y soltar (drag-drop) renglones
- Edición inline en tabla
- Doble click para expandir detalles
- Atajos de teclado (Ctrl+N = nuevo, Ctrl+S = guardar)
- Autocompletar en búsquedas
- Historial de cambios (undo/redo)
- Notificaciones en tiempo real

### 4.3 Mejorar Otros Módulos

**Clientes**:
- Tabla mejorada con búsqueda avanzada
- Filtros por estado
- Importar desde CSV
- Exportar a vCard

**Proyectos**:
- Kanban view de estados
- Gantt chart mejorado
- Filtros inteligentes
- Bulk operations

**Financiero**:
- Dashboard con KPIs mejorados
- Gráficos interactivos
- Análisis de categorías
- Proyecciones financieras

---

## FASE 5: PERFORMANCE & OPTIMIZACIONES (2-3 horas)

### 5.1 Code Splitting & Lazy Loading
```typescript
const PresupuestoScreen = lazy(() => import('./PresupuestoScreen'));
const ChartsComponent = lazy(() => import('./ChartsComponent'));
// Cargar solo cuando se necesita
```

### 5.2 Memoización y Optimizaciones
```typescript
// Usar useMemo para cálculos pesados
const totalPresupuesto = useMemo(() => {
  return calcularTotal(lineas, factores);
}, [lineas, factores]);

// Usar useCallback para funciones
const handleAgregarRenglon = useCallback((renglon) => {
  // ...
}, []);
```

### 5.3 Virtualización de Listas
```typescript
// Para presupuestos con muchas líneas (100+)
import { FixedSizeList } from 'react-window';
// Renderizar solo items visibles
```

---

## FASE 6: FUNCIONALIDADES AVANZADAS (Bonus)

### 6.1 Comparador de Presupuestos
- Comparar 2-3 presupuestos lado a lado
- Diferencias destacadas
- Análisis de variación

### 6.2 Plantillas de Presupuesto
- Guardar como plantilla
- Reutilizar en nuevos proyectos
- Biblioteca de plantillas corporativas

### 6.3 Colaboración en Tiempo Real
- Múltiples usuarios editando mismo presupuesto
- Comentarios inline en líneas
- Historial de cambios con avatar del usuario

### 6.4 Inteligencia Artificial
- Sugerencias de renglones basado en historial
- Detección de valores anómalos
- Predicción de costos basada en datos históricos

### 6.5 Análisis Avanzado
- Curva S de proyecto
- Análisis de sensibilidad (tornado charts)
- Simulación Monte Carlo para riesgos
- Alertas de presupuesto automáticas

---

## TIMELINE ESTIMADO

```
FASE 1: Fundamentos              4-5 horas    ✅ Crítica
FASE 2: Motor Presupuesto        8-10 horas   ✅ Crítica
FASE 3: Exportación              3-4 horas    ✅ Crítica
FASE 4: UI/UX Moderno            5-6 horas    ✅ Alta
FASE 5: Performance              2-3 horas    ⚠️ Media
FASE 6: Bonus Features           5-8 horas    ⚠️ Opcional
────────────────────────────────────────────
TOTAL (Fases 1-5):               23-28 horas
Incluir 6:                        28-36 horas
```

**Propuesta**: Empezar por Fases 1-3 (15 horas) para obtener "quick wins", luego Fase 4 (UI).

---

## HERRAMIENTAS ADICIONALES A INSTALAR

```bash
npm install framer-motion              # Animaciones
npm install lucide-react               # Íconos (ya está)
npm install pdfkit                     # PDF mejorado
npm install xlsx                       # Excel export
npm install recharts                   # Gráficos (ya está)
npm install react-dnd                  # Drag & drop
npm install date-fns                   # Manejo de fechas (ya está)
npm install zustand                    # Alt: state management
npm install react-hot-toast            # Notificaciones
npm install clsx tailwind-merge        # Clase CSS utils
```

---

## ESTRUCTURA DE CARPETAS FINAL

```
src/
├── components/
│   ├── presupuestos/
│   │   ├── PresupuestoHeader.tsx
│   │   ├── RenglonesTable.tsx
│   │   ├── RenglonesLibraryPanel.tsx
│   │   ├── RenglonesDetailPanel.tsx
│   │   ├── SubrenglonEditorModal.tsx
│   │   ├── MaterialesUnitariosEditor.tsx
│   │   ├── PresupuestoSummary.tsx
│   │   ├── CalculoVisualization.tsx
│   │   └── PresupuestoComparison.tsx
│   ├── shared/
│   │   ├── AdvancedChart.tsx
│   │   ├── DataTable.tsx
│   │   └── SearchBox.tsx
│   └── ...
├── services/
│   ├── PresupuestoService.ts
│   ├── CalculoService.ts
│   ├── RenglonesService.ts
│   ├── ExportService.ts
│   ├── EquiposService.ts
│   └── CacheService.ts
├── hooks/
│   ├── usePresupuestos.ts
│   ├── useRenglones.ts
│   ├── useCalculos.ts
│   └── useOptimisticUpdates.ts
├── types/
│   └── supabase.ts (consolidado)
├── utils/
│   ├── calculoHelpers.ts
│   ├── formatters.ts
│   └── validators.ts
└── ...
```

---

**Estado**: 🚀 LISTO PARA INICIAR  
**Prioridad**: Fases 1-3 primero, luego Fase 4  
**Referencia**: Este documento es el roadmap completo de refactorización
