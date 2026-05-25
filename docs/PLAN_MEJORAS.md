# PLAN DE MEJORAS - CONSTRUSMART WM App

## Diagnóstico General

| Área | Estado Actual | Riesgo |
|------|--------------|--------|
| TypeScript strict mode | Deshabilitado (`strict: false`, `noImplicitAny: false`, `strictNullChecks: false`) | ALTO - bugs silenciosos |
| Validación Zod en presupuestos | Bypass total - `addPresupuesto` usa `Record<string, unknown>` | ALTO - datos corruptos |
| Arquitectura dual | `presupuestos` + `proyectos` con RPC de sincronía | ALTO - inconsistencias |
| React Query | Instalado pero NO usado en ningún lado | BAJO - oportunidad |
| Toast/Sonner | Instalado pero solo se usa `console.error()` | MEDIO - UX pobre |
| Realtime listeners | Sin listener para `presupuestos` (ya corregido) | MEDIO |
| Paginación | `.select('*')` sin límites en todas las tablas | BAJO - escala mal |
| Avance/ingresos/gastos | Se setean al crear presupuesto y NUNCA se actualizan | ALTO - datos incorrectos |
| Link transacción-proyecto | Se rompe al transicionar fase (nuevo UUID en proyectos) | ALTO - transacciones huérfanas |
| Seed database | Función vacía | BAJO |
| RLS en Supabase | Solo existe para `clientes`, `presupuestos`, `proyectos` | MEDIO |
| Errores visibles al usuario | Ninguno - todo va a `console.error` | ALTO - UX crítico |

---

## Mejora 1: TypeScript Strict Mode + Limpieza de tipos

### Problema
`strict: false` permite `null`/`undefined` no chequeados, parámetros no usados, y `any` implícito. Esto oculta bugs.

### Solución

**Paso 1.1** - Habilitar strict progresivamente en `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Paso 1.2** - Cambiar `addPresupuesto`/`updatePresupuesto` de `Record<string, unknown>` a tipos reales:
```typescript
// En AppContext.tsx
addPresupuesto: (p: CreatePresupuesto) => Promise<string | null>;
updatePresupuesto: (id: string, p: UpdatePresupuesto) => Promise<void>;

// Implementación
const addPresupuesto = async (p: CreatePresupuesto): Promise<string | null> => {
  if (!session) return null;
  const validated = validatePresupuesto({ ...p, user_id: session.user.id });
  const dbData = presupuestoToDb(validated);
  const { data, error } = await supabase.from('presupuestos')
    .insert({ ...dbData, user_id: session.user.id })
    .select().single();
  if (error) throw error;
  if (data) {
    setPresupuestos(prev => [dbToPresupuesto(data), ...prev]);
    return data.id;
  }
  return null;
};
```

**Paso 1.3** - Corregir los ~40 errores de tipo que aparecerán al habilitar strict.

**Políticas Supabase** - Sin cambios directos, pero las validaciones Zod más estrictas evitarán datos inválidos.

---

## Mejora 2: Eliminar arquitectura dual (unificar presupuestos y proyectos)

### Problema
Dos tablas (`presupuestos` y `proyectos`) con un RPC que las sincroniza. Cuando se transiciona fase, se crea un nuevo registro en `proyectos` con NUEVO UUID, rompiendo el vínculo con las transacciones existentes que usan `proyecto_id` = proyecto UUID.

### Solución

**Paso 2.1** - Agregar `proyecto_id` (UUID) a la tabla `presupuestos` para mantener el link a `proyectos`:
```sql
ALTER TABLE public.presupuestos ADD COLUMN proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL;
```

**Paso 2.2** - Modificar `transicionar_fase` RPC para REUTILIZAR el mismo proyecto UUID en lugar de crear uno nuevo:
```sql
CREATE OR REPLACE FUNCTION public.transicionar_fase(
  p_presupuesto_id uuid,
  p_nueva_fase text,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_presupuesto record;
  v_proyecto_id uuid;
  v_estado_proyecto text;
BEGIN
  SELECT * INTO v_presupuesto FROM public.presupuestos WHERE id = p_presupuesto_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Presupuesto no encontrado');
  END IF;

  -- Obtener el proyecto_id actual o usar el del presupuesto
  v_proyecto_id := v_presupuesto.proyecto_id;

  v_estado_proyecto := CASE p_nueva_fase
    WHEN 'planeación' THEN 'Planeación'
    WHEN 'ejecución' THEN 'Ejecución'
    WHEN 'pausa' THEN 'Parado'
    WHEN 'finalizado' THEN 'Finalizado'
    ELSE 'Planeación'
  END;

  -- Actualizar fase en presupuesto
  UPDATE public.presupuestos SET fase = p_nueva_fase, updated_at = now() WHERE id = p_presupuesto_id;

  -- Si ya tiene proyecto_id, hacer UPDATE; si no, INSERT y guardar el nuevo id
  IF v_proyecto_id IS NOT NULL THEN
    UPDATE public.proyectos SET
      estado = v_estado_proyecto,
      presupuesto_total = COALESCE(v_presupuesto.total, 0),
      avance_fisico = COALESCE(v_presupuesto.avance_fisico, 0),
      avance_financiero = COALESCE(v_presupuesto.avance_financiero, 0),
      ingresos = COALESCE(v_presupuesto.ingresos, 0),
      gastos = COALESCE(v_presupuesto.gastos, 0),
      pendiente_aportar = COALESCE(v_presupuesto.pendiente_aportar, COALESCE(v_presupuesto.total, 0)),
      fecha_inicio = CASE WHEN p_nueva_fase = 'ejecución' AND fecha_inicio IS NULL THEN CURRENT_DATE ELSE fecha_inicio END,
      fecha_fin = CASE WHEN p_nueva_fase = 'finalizado' THEN CURRENT_DATE ELSE fecha_fin END
    WHERE id = v_proyecto_id;
  ELSE
    INSERT INTO public.proyectos (user_id, nombre, cliente, tipo, estado, presupuesto_total, avance_fisico, avance_financiero, ingresos, gastos, pendiente_aportar, fecha_inicio, fecha_fin)
    VALUES (
      p_user_id, v_presupuesto.proyecto, v_presupuesto.cliente, v_presupuesto.tipologia,
      v_estado_proyecto, COALESCE(v_presupuesto.total, 0), COALESCE(v_presupuesto.avance_fisico, 0),
      COALESCE(v_presupuesto.avance_financiero, 0), COALESCE(v_presupuesto.ingresos, 0),
      COALESCE(v_presupuesto.gastos, 0), COALESCE(v_presupuesto.pendiente_aportar, COALESCE(v_presupuesto.total, 0)),
      CASE WHEN p_nueva_fase = 'ejecución' THEN CURRENT_DATE ELSE v_presupuesto.fecha_inicio END,
      CASE WHEN p_nueva_fase = 'finalizado' THEN CURRENT_DATE ELSE v_presupuesto.fecha_fin END
    )
    ON CONFLICT ON CONSTRAINT proyectos_nombre_user_key DO UPDATE SET
      estado = v_estado_proyecto,
      presupuesto_total = COALESCE(v_presupuesto.total, 0),
      fecha_fin = CASE WHEN p_nueva_fase = 'finalizado' THEN CURRENT_DATE ELSE EXCLUDED.fecha_fin END,
      fecha_inicio = CASE WHEN p_nueva_fase = 'ejecución' AND EXCLUDED.fecha_inicio IS NULL THEN CURRENT_DATE ELSE EXCLUDED.fecha_inicio END
    RETURNING id INTO v_proyecto_id;

    -- Guardar el proyecto_id en el presupuesto
    UPDATE public.presupuestos SET proyecto_id = v_proyecto_id WHERE id = p_presupuesto_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'presupuesto_id', p_presupuesto_id, 'proyecto_id', v_proyecto_id, 'fase', p_nueva_fase);
END;
$$;
```

**Paso 2.3** - Actualizar `dbToPresupuesto` y `Presupuesto` interface para incluir `proyectoId`:
```typescript
// En Presupuesto interface
proyectoId?: string;

// En dbToPresupuesto
proyectoId: db.proyecto_id || '',
```

**Políticas Supabase** - Migración SQL completa con CREATE OR REPLACE FUNCTION.

---

## Mejora 3: Actualización automática de avance/ingresos/gastos desde transacciones

### Problema
`avanceFisico`, `avanceFinanciero`, `ingresos`, `gastos` se calculan al crear el presupuesto y nunca se recalculan. Las transacciones no impactan estos valores.

### Solución

**Paso 3.1** - Crear función SQL que recalcula desde transacciones:
```sql
CREATE OR REPLACE FUNCTION public.actualizar_financiero_presupuesto(p_presupuesto_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_proyecto_id uuid;
BEGIN
  -- Obtener proyecto_id del presupuesto
  SELECT proyecto_id INTO v_proyecto_id FROM public.presupuestos WHERE id = p_presupuesto_id;
  
  -- Actualizar presupuesto
  UPDATE public.presupuestos SET
    ingresos = COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'ingreso'), 0),
    gastos = COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'gasto'), 0),
    pendiente_aportar = GREATEST(0, total - COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'ingreso'), 0)),
    avance_financiero = CASE WHEN total > 0 THEN 
      LEAST(100, ROUND((COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'ingreso'), 0) / total) * 100))
    ELSE 0 END,
    updated_at = now()
  WHERE id = p_presupuesto_id;

  -- Sincronizar proyecto
  IF v_proyecto_id IS NOT NULL THEN
    UPDATE public.proyectos SET
      ingresos = COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'ingreso'), 0),
      gastos = COALESCE((SELECT SUM(costo_total) FROM public.transacciones WHERE proyecto_id = v_proyecto_id AND tipo = 'gasto'), 0)
    WHERE id = v_proyecto_id;
  END IF;
END;
$$;
```

**Paso 3.2** - Trigger en `transacciones` que llame automáticamente a la función:
```sql
CREATE OR REPLACE FUNCTION public.trigger_actualizar_financiero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_presupuesto_id uuid;
BEGIN
  -- Buscar presupuesto que tenga este proyecto_id
  SELECT id INTO v_presupuesto_id FROM public.presupuestos WHERE proyecto_id = COALESCE(NEW.proyecto_id, OLD.proyecto_id) LIMIT 1;
  IF v_presupuesto_id IS NOT NULL THEN
    PERFORM public.actualizar_financiero_presupuesto(v_presupuesto_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_actualizar_financiero
  AFTER INSERT OR UPDATE OR DELETE ON public.transacciones
  FOR EACH ROW EXECUTE FUNCTION public.trigger_actualizar_financiero();
```

**Paso 3.3** - También actualizar `avanceFisico` desde el frontend (input manual del usuario):
```typescript
// En SeguimientoScreen o ProyectosScreen - input editable de avance físico
const actualizarAvanceFisico = async (presupuestoId: string, valor: number) => {
  await supabase.from('presupuestos').update({ avance_fisico: valor }).eq('id', presupuestoId);
};
```

**Políticas Supabase** - RLS en `transacciones` debe permitir el trigger (SECURITY DEFINER lo maneja).

---

## Mejora 4: Sistema de notificaciones toast para errores y acciones

### Problema
Todos los errores van a `console.error`. El usuario no ve nada cuando algo falla.

### Solución

**Paso 4.1** - Usar Sonner (ya instalado: `"sonner": "^1.5.0"`) con `toast` en AppContext:
```typescript
import { toast } from 'sonner';

// En cada catch:
catch (error) {
  console.error('Error al agregar presupuesto:', error);
  toast.error('No se pudo guardar el presupuesto', {
    description: error instanceof Error ? error.message : 'Error desconocido',
  });
  throw error;
}
```

**Paso 4.2** - Toast de éxito:
```typescript
toast.success('Presupuesto guardado exitosamente');
```

**Políticas Supabase** - Sin cambios.

---

## Mejora 5: React Query para data fetching y caché

### Problema
`@tanstack/react-query` está instalado pero nunca se usa. Todo el fetching es imperativo en AppContext.

### Solución

**Paso 5.1** - Crear hooks personalizados para cada entidad:
```typescript
// src/hooks/usePresupuestos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { dbToPresupuesto, presupuestoToDb } from '@/types/supabase';
import type { CreatePresupuesto, UpdatePresupuesto, Presupuesto } from '@/types/supabase';
import { toast } from 'sonner';
import { useSession } from './useSession';

export function usePresupuestos() {
  const session = useSession();
  return useQuery({
    queryKey: ['presupuestos', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(dbToPresupuesto);
    },
    enabled: !!session,
  });
}
```

**Paso 5.2** - Mutations con invalidación automática:
```typescript
export function useCreatePresupuesto() {
  const queryClient = useQueryClient();
  const session = useSession();
  return useMutation({
    mutationFn: async (p: CreatePresupuesto) => {
      const validated = validatePresupuesto({ ...p, user_id: session!.user.id });
      const { data, error } = await supabase.from('presupuestos')
        .insert({ ...presupuestoToDb(validated), user_id: session!.user.id })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
      toast.success('Presupuesto creado');
    },
    onError: (error: Error) => {
      toast.error('Error al crear presupuesto', { description: error.message });
    },
  });
}
```

**Paso 5.3** - Limpiar AppContext progresivamente, moviendo la lógica CRUD a hooks.

**Políticas Supabase** - Sin cambios.

---

## Mejora 6: RLS policies completas para todas las tablas

### Problema
No todas las tablas tienen RLS. Las que tienen usan solo `auth.uid() = user_id` pero sin políticas para service_role.

### Solución

**Paso 6.1** - RLS completo para todas las tablas:

```sql
-- ============================================
-- POLÍTICAS RLS COMPLETAS
-- ============================================

-- CLIENTES
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;

CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clientes_insert" ON public.clientes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clientes_update" ON public.clientes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clientes_delete" ON public.clientes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PROYECTOS
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proyectos_select" ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_insert" ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_update" ON public.proyectos;
DROP POLICY IF EXISTS "proyectos_delete" ON public.proyectos;

CREATE POLICY "proyectos_select" ON public.proyectos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "proyectos_insert" ON public.proyectos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proyectos_update" ON public.proyectos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proyectos_delete" ON public.proyectos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- PRESUPUESTOS
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "presupuestos_select" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_insert" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_update" ON public.presupuestos;
DROP POLICY IF EXISTS "presupuestos_delete" ON public.presupuestos;

CREATE POLICY "presupuestos_select" ON public.presupuestos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "presupuestos_insert" ON public.presupuestos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "presupuestos_update" ON public.presupuestos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "presupuestos_delete" ON public.presupuestos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- TRANSACCIONES
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transacciones_select" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_insert" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_update" ON public.transacciones;
DROP POLICY IF EXISTS "transacciones_delete" ON public.transacciones;

CREATE POLICY "transacciones_select" ON public.transacciones
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transacciones_insert" ON public.transacciones
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transacciones_update" ON public.transacciones
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transacciones_delete" ON public.transacciones
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ACTIVIDADES
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "actividades_select" ON public.actividades;
DROP POLICY IF EXISTS "actividades_insert" ON public.actividades;
DROP POLICY IF EXISTS "actividades_update" ON public.actividades;
DROP POLICY IF EXISTS "actividades_delete" ON public.actividades;

CREATE POLICY "actividades_select" ON public.actividades
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "actividades_insert" ON public.actividades
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "actividades_update" ON public.actividades
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "actividades_delete" ON public.actividades
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

---

## Mejora 7: Calendario de actividades - sincronización con fases

### Problema
El calendario es independiente. No se relaciona con las fases de los proyectos.

### Solución

**Paso 7.1** - Agregar `presupuesto_id` a actividades:
```sql
ALTER TABLE public.actividades ADD COLUMN presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE;
```

**Paso 7.2** - En el calendario, mostrar actividades por proyecto y fecha de fase:
```typescript
// Al transicionar a 'ejecución', crear actividad automática
if (nuevaFase === 'ejecución') {
  await supabase.from('actividades').insert({
    user_id: p_user_id,
    titulo: `Inicio de ejecución: ${v_presupuesto.proyecto}`,
    fecha: new Date().toISOString().split('T')[0],
    descripcion: `El proyecto cambió a fase de ejecución`,
    presupuesto_id: p_presupuesto_id,
  });
}
```

**Políticas Supabase** - RLS en `actividades` (incluida arriba).

---

## Mejora 8: Exportación mejorada

### Problema
La exportación a PDF usa `window.print()` que tiene limitaciones. No hay exportación a Excel.

### Solución

**Paso 8.1** - Agregar exportación a Excel usando la librería `xlsx`:
```bash
npm install xlsx
```

**Paso 8.2** - Función de exportación a Excel:
```typescript
import * as XLSX from 'xlsx';

export const downloadExcel = (data: unknown[][], filename: string) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, filename);
};
```

**Políticas Supabase** - Sin cambios.

---

## Mejora 9: Historial de cambios (audit log)

### Problema
No hay trazabilidad de cambios. No se sabe cuándo se creó, modificó o eliminó algo.

### Solución

**Paso 9.1** - Tabla de auditoría:
```sql
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

**Paso 9.2** - Trigger de auditoría genérico:
```sql
CREATE OR REPLACE FUNCTION public.trigger_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id, auth.uid()),
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN NEW;
END;
$$;

-- Aplicar a todas las tablas
CREATE TRIGGER trg_audit_clientes AFTER INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_audit();
CREATE TRIGGER trg_audit_presupuestos AFTER INSERT OR UPDATE OR DELETE ON public.presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_audit();
CREATE TRIGGER trg_audit_transacciones AFTER INSERT OR UPDATE OR DELETE ON public.transacciones
  FOR EACH ROW EXECUTE FUNCTION public.trigger_audit();
CREATE TRIGGER trg_audit_proyectos AFTER INSERT OR UPDATE OR DELETE ON public.proyectos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_audit();
CREATE TRIGGER trg_audit_actividades AFTER INSERT OR UPDATE OR DELETE ON public.actividades
  FOR EACH ROW EXECUTE FUNCTION public.trigger_audit();
```

---

## Mejora 10: Dashboard - Indicadores de rentabilidad real

### Problema
El Dashboard muestra "Margen = Ingresos - Gastos" pero usa TODAS las transacciones, no las asociadas a proyectos activos.

### Solución

**Paso 10.1** - Calcular márgenes por proyecto:
```typescript
// En Dashboard.tsx
const margenesPorProyecto = useMemo(() => {
  return presupuestos.filter(p => p.fase === 'ejecución').map(p => {
    const txns = transacciones.filter(t => t.proyectoId === p.proyectoId);
    const ingresos = txns.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastos = txns.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
    return {
      proyecto: p.proyecto,
      presupuesto: p.total,
      ingresos,
      gastos,
      margen: ingresos - gastos,
      rentabilidad: p.total > 0 ? ((ingresos - gastos) / p.total * 100) : 0,
    };
  });
}, [presupuestos, transacciones]);
```

**Paso 10.2** - Agregar KPI de rentabilidad:
```typescript
// Tarjeta adicional en Dashboard
<KPI icon={TrendingUp} label="Rentabilidad Promedio" 
  value={`${(stats.margen / (stats.ingresos || 1) * 100).toFixed(1)}%`} color="emerald" />
```

---

## Mejora 11: Paginación y carga diferida

### Problema
`supabase.from('tabla').select('*')` carga TODOS los registros. Con el tiempo, será lento.

### Solución

**Paso 11.1** - Agregar paginación a `loadAll`:
```typescript
const PAGE_SIZE = 100;

const loadPresupuestos = async (userId: string, page = 0) => {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await supabase
    .from('presupuestos')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  return { data: (data || []).map(dbToPresupuesto), count, hasMore: to < (count || 0) };
};
```

**Paso 11.2** - En React Query, usar `keepPreviousData` para experiencia fluida.

**Políticas Supabase** - Sin cambios.

---

## Mejora 12: Búsqueda global (command palette)

### Problema
No hay forma de buscar proyectos/presupuestos/clientes desde un solo lugar.

### Solución

**Paso 12.1** - Agregar comando `Cmd/Ctrl+K` con `cmdk` (ya instalado):
```typescript
// src/components/shared/CommandPalette.tsx
import { Command } from 'cmdk';
import { useAppContext } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation'; // o navegación SPA

export const CommandPalette = () => {
  const { presupuestos, clientes, setView } = useAppContext();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Búsqueda global">
      <Command.Input placeholder="Buscar proyectos, clientes..." />
      <Command.List>
        <Command.Group heading="Proyectos">
          {presupuestos.map(p => (
            <Command.Item key={p.id} onSelect={() => { setView('proyectos'); setOpen(false); }}>
              {p.proyecto}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Clientes">
          {clientes.map(c => (
            <Command.Item key={c.id} onSelect={() => { setView('clientes'); setOpen(false); }}>
              {c.nombre}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
};
```

**Políticas Supabase** - Sin cambios.

---

## Mejora 13: Dashboard - Gráfica de flujo de caja proyectado

### Problema
El Dashboard muestra flujo histórico pero no proyectado.

### Solución

**Paso 13.1** - Agregar gráfica de proyección basada en presupuestos:
```typescript
const proyeccion = useMemo(() => {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const data: Record<string, { mes: string; proyectado: number }> = {};
  
  // Por cada proyecto en ejecución, distribuir su presupuesto en los meses restantes
  presupuestos.filter(p => p.fase === 'ejecución').forEach(p => {
    const mesesRestantes = 6; // estimado simple
    const porMes = p.pendienteAportar / mesesRestantes;
    for (let i = 0; i < mesesRestantes; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!data[key]) data[key] = { mes: key, proyectado: 0 };
      data[key].proyectado += porMes;
    }
  });
  return Object.values(data).slice(0, 6);
}, [presupuestos]);
```

---

## Mejora 14: Múltiples usuarios/roles (equipo)

### Problema
La app es monousuario - cada usuario ve solo sus datos.

### Solución

**Paso 14.1** - Agregar tabla de equipos:
```sql
CREATE TABLE IF NOT EXISTS public.equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  creador_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.equipo_miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id uuid REFERENCES public.equipos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text DEFAULT 'miembro', -- 'admin', 'miembro', 'visor'
  created_at timestamptz DEFAULT now(),
  UNIQUE(equipo_id, user_id)
);
```

**Paso 14.2** - Modificar RLS para permitir acceso a miembros del equipo:
```sql
CREATE POLICY "presupuestos_select_team" ON public.presupuestos
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    user_id IN (SELECT user_id FROM public.equipo_miembros WHERE equipo_id IN
      (SELECT equipo_id FROM public.equipo_miembros WHERE user_id = auth.uid()))
  );
```

---

## Mejora 15: Backups automáticos desde Supabase

### Problema
No hay plan de backup.

### Solución

**Paso 15.1** - Configurar backups point-in-time en Supabase Dashboard:
- Ir a Database → Backup → Enable Point-in-Time Recovery
- Configurar retención: 7 días mínimo

**Paso 15.2** - Script de exportación programado:
```bash
# pg_dump semanal (ejecutar como cron job)
pg_dump -- db-url > backup_$(date +%Y%m%d).sql
```

---

## Resumen de Implementación

| # | Mejora | Prioridad | Estado | Archivos Clave |
|---|--------|-----------|--------|----------------|
| 1 | TypeScript strict mode | ALTA | ✅ Completado | `tsconfig.app.json`, `tsconfig.json` |
| 2 | Unificar presupuestos/proyectos | ALTA | ✅ Completado | `migration_fase_presupuestos.sql` |
| 3 | Auto-actualizar financiero desde transacciones | ALTA | ✅ Completado | `migration_fase_presupuestos.sql` (trigger) |
| 4 | Toast notifications | MEDIA | ✅ Completado | `AppContext.tsx` |
| 5 | React Query hooks | MEDIA | ✅ Completado | `src/hooks/useDataQuery.ts` |
| 6 | RLS policies completas | ALTA | ✅ Completado | `migration_fase_presupuestos.sql` |
| 7 | Calendario sincronizado con fases | BAJA | ✅ Completado | `migration_fase_presupuestos.sql` (RPC) |
| 8 | Exportación Excel | BAJA | ✅ Completado | `src/utils/exportExcel.ts` |
| 9 | Audit log | MEDIA | ✅ Completado | `migration_fase_presupuestos.sql` |
| 10 | Dashboard rentabilidad real | MEDIA | ✅ Completado | `Dashboard.tsx` |
| 11 | Paginación | BAJA | ✅ Completado | `AppContext.tsx` (PAGE_SIZE) |
| 12 | Command palette (Cmd+K) | BAJA | ✅ Completado | `CommandPalette.tsx` |
| 13 | Proyección flujo de caja | BAJA | ✅ Completado | `Dashboard.tsx` |
| 14 | Equipos multi-usuario | FUTURA | ✅ Completado | `migration_equipos.sql`, `TeamsScreen.tsx` |
| 15 | Backups | ALTA | ✅ Documentado | Configuración en Supabase Dashboard |

## Orden recomendado de implementación

```
Fase 1 (Semana 1): Seguridad y datos
  ├── Mejora 6: RLS policies completas
  ├── Mejora 2: Unificar presupuestos/proyectos
  └── Mejora 3: Auto-actualizar financiero

Fase 2 (Semana 2): Calidad y UX
  ├── Mejora 1: TypeScript strict mode
  ├── Mejora 4: Toast notifications
  └── Mejora 15: Backups

Fase 3 (Semanas 3-4): Arquitectura
  ├── Mejora 5: React Query hooks
  ├── Mejora 11: Paginación
  └── Mejora 9: Audit log

Fase 4 (Semanas 5-6): Features
  ├── Mejora 7: Calendario sincronizado
  ├── Mejora 8: Exportación Excel
  ├── Mejora 10: Dashboard rentabilidad
  ├── Mejora 12: Command palette
  └── Mejora 13: Proyección flujo

Fase 5 (Futuro):
  └── Mejora 14: Multi-usuario/equipos
```
