# 🎯 Plan de Implementación para 100% de Conexión Bilateral

Basado en `docs/ESQUEMA_CONEXIONES_BILATERALES.md` — 4 fixes para alcanzar 100%.

---

## Fix #1: AppContext — CRUD OrdenesCompra (Alta prioridad)

**Archivo:** `src/contexts/AppContext.tsx`

### Cambios:

**1.1 Interface `DataContextType` (línea ~123-124):**
```
// REEMPLAZAR:
  ordenesCompra: OrdenCompra[];
  refreshOrdenesCompra: () => Promise<void>;

// POR:
  ordenesCompra: OrdenCompra[];
  addOrdenCompra: (oc: CreateOrdenCompra) => Promise<OrdenCompra | null>;
  updateOrdenCompra: (id: string, oc: UpdateOrdenCompra) => Promise<void>;
  deleteOrdenCompra: (id: string) => Promise<void>;
```

**1.2 Implementación (junto a los otros métodos CRUD):**
```
const addOrdenCompra = useCallback(async (oc: CreateOrdenCompra) => {
  const creada = await OrdenesCompraService.crear(oc);
  setOrdenesCompra(prev => [...prev, creada as OrdenCompra]);
  return creada;
}, []);

const updateOrdenCompra = useCallback(async (id: string, oc: UpdateOrdenCompra) => {
  await OrdenesCompraService.actualizar(id, oc);
  setOrdenesCompra(prev => prev.map(p => p.id === id ? { ...p, ...oc } : p));
}, []);

const deleteOrdenCompra = useCallback(async (id: string) => {
  await OrdenesCompraService.eliminar(id);
  setOrdenesCompra(prev => prev.filter(p => p.id !== id));
}, []);
```

**Impacto:** AppContext CRUD 80% → 100%

---

## Fix #2: ComprasScreen — Refrescar OC tras crear (Media prioridad)

**Archivo:** `src/features/compras/components/ComprasScreen.tsx`

### Cambio:

Después de cada `OrdenesCompraService.crear()`, agregar:
```
// Al inicio del archivo
import { useAppContext } from '@/contexts/AppContext';
// Extraer refreshOrdenesCompra del contexto
const { refreshOrdenesCompra } = useAppContext();
// Después de crear OC exitosamente
await refreshOrdenesCompra();
```

**Impacto:** ComprasScreen 90% → 100%

---

## Fix #3: FinancieroScreen — Formulario de transacciones (Media prioridad)

**Archivo:** `src/features/financiero/components/FinancieroScreen.tsx`

### Cambio:

Agregar botón "+ Nueva Transacción" en la navbar que abre un modal con `TransactionForm`. El formulario ya existe: `src/components/shared/TransactionForm.tsx`.

```
// Agregar import
import TransactionForm from '@/components/shared/TransactionForm';

// Estado
const [showTransactionForm, setShowTransactionForm] = useState(false);

// En la navbar, junto a los botones de paginación:
<Button onClick={() => setShowTransactionForm(true)} size="sm">
  + Nueva Transacción
</Button>

// Modal (Dialog):
{showTransactionForm && (
  <TransactionForm onClose={() => {
    setShowTransactionForm(false);
    // El contexto se refresca automáticamente vía addTransaccion
  }} />
)}
```

**Impacto:** FinancieroScreen 55% → 90%

---

## Fix #4: Seguimiento — Refrescar transacciones tras pago (Baja prioridad)

**Archivo:** `src/components/screens/SeguimientoScreen.tsx`

### Cambio:

Extraer `addTransaccion` del contexto, y tras el registro de pago exitoso, llamarla con los datos retornados por `PlanillaService.registrarPago()`.

---

## 📐 Resumen de Líneas a Modificar

| Fix | Archivo | Líneas a agregar | Prioridad |
|-----|---------|:----------------:|:---------:|
| #1 | AppContext.tsx | ~30 | 🔴 Alta |
| #2 | ComprasScreen.tsx | ~5 | 🟡 Media |
| #3 | FinancieroScreen.tsx | ~25 | 🟡 Media |
| #4 | SeguimientoScreen.tsx | ~5 | 🟢 Baja |

**Total:** ~65 líneas de código nuevo, 0 líneas de código eliminado.