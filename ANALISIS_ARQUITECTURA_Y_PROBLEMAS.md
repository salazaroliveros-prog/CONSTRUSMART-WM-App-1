# 🔍 ANÁLISIS COMPLETO: ARQUITECTURA, FUNCIONALIDAD Y PROBLEMAS
**Aplicación**: CONSTRUSMART WM App Vol.5  
**Fecha de Análisis**: 25 de mayo de 2026  
**Status**: ⚠️ PROBLEMAS CRÍTICOS DETECTADOS

---

## TABLA DE CONTENIDOS
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Problemas Críticos Encontrados](#problemas-críticos-encontrados)
4. [Inconsistencias de Conexión Supabase](#inconsistencias-de-conexión-supabase)
5. [Errores de Compilación](#errores-de-compilación)
6. [Problemas de Migraciones SQL](#problemas-de-migraciones-sql)
7. [Problemas de Seguridad RLS](#problemas-de-seguridad-rls)
8. [Plan de Correcciones](#plan-de-correcciones)

---

## RESUMEN EJECUTIVO

### Estado Actual
La aplicación está **parcialmente funcional pero con múltiples inconsistencias críticas**:
- ✅ Núcleo de autenticación y CRUD operacional
- ✅ Sincronización realtime con Supabase funcionando
- ❌ Errores de compilación no resueltos
- ❌ Esquema de base de datos desincronizado con la aplicación
- ❌ Políticas RLS incompletas y conflictivas
- ❌ Módulo de equipos (Teams) parcialmente implementado

### Riesgo de Datos
⚠️ **ALTO**: Las políticas RLS están fallando silenciosamente. Los datos pueden no estar protegidos adecuadamente.

---

## ARQUITECTURA GENERAL

### Stack Tecnológico
```
Frontend:        React 18 + TypeScript + Vite
UI Components:   shadcn/ui (Radix UI) + Tailwind CSS
Estado Global:   React Context + useCallback + useRef
Backend:         Supabase (PostgreSQL + Auth + Realtime)
Validación:      Zod schemas
Exportación:     CSV/PDF (print-based)
Visualización:   Recharts
```

### Flujo de Datos Principal
```
User Input (React Component)
    ↓
AppContext (global state + CRUD methods)
    ↓
Supabase Client (supabase-js)
    ↓
PostgreSQL (con RLS policies)
    ↓
Realtime subscription → estado global
    ↓
Re-render UI
```

### Arquitectura de Módulos
```
src/
├── components/
│   ├── screens/              # Vistas principales
│   │   ├── Dashboard.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SeguimientoScreen.tsx
│   │   ├── TeamsScreen.tsx   ⚠️ Parcialmente integrado
│   │   └── ...
│   ├── shared/               # Componentes reutilizables
│   └── ui/                   # shadcn/ui components
├── features/
│   ├── clientes/
│   ├── presupuestos/         ⚠️ Estado local, no en Context
│   ├── proyectos/
│   └── financiero/
├── contexts/
│   └── AppContext.tsx        # ⚠️ Centro de problemas
├── types/
│   └── supabase.ts           # Tipos + esquemas Zod
├── lib/
│   ├── supabase.ts           # Cliente Supabase
│   └── schemas.ts            # ⚠️ Esquemas duplicados/incompletos
└── utils/
    └── seedDatabase.ts       # Datos iniciales
```

### Entidades Principales
```
1. Clientes       (id, nombre, telefono, email, direccion, estado, ...)
2. Proyectos      (id, nombre, cliente, estado, presupuesto_total, avance_*, ...)
3. Presupuestos   (id, proyecto, cliente, lineas[], factors, ...)
4. Transacciones  (id, tipo, descripcion, cantidad, costo_total, proyecto_id, ...)
5. Actividades    (id, titulo, fecha, hora, descripcion, ...)
6. Equipos        (id, nombre, creador_id, user_id, ...)  ⚠️ Desintegrado
7. EquipoMiembros (id, equipo_id, user_id, rol, ...)      ⚠️ Desintegrado
```

---

## PROBLEMAS CRÍTICOS ENCONTRADOS

### ❌ PROBLEMA 1: Error de Compilación - Dependencia Faltante
**Severidad**: CRÍTICA (App no compila)  
**Ubicación**: `vite.config.ts`, línea 2  
**Problema**:
```typescript
import react from "@vitejs/plugin-react-swc";  // ❌ Paquete no instalado
```

**Error Real**:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react-swc'
```

**Causa**: El paquete `@vitejs/plugin-react-swc` no está en `package.json`.

**Impacto**: 
- ❌ No se puede ejecutar `npm run build`
- ❌ No se puede hacer deploy
- ❌ Bloquea desarrollo en producción

**Solución**:
```bash
npm install --save-dev @vitejs/plugin-react-swc
# O reemplazar con @vitejs/plugin-react
```

---

### ❌ PROBLEMA 2: Desconexión AppContext ↔ Módulo Equipos
**Severidad**: ALTA (Feature incompleto)  
**Ubicación**: `src/contexts/AppContext.tsx` vs `src/components/screens/TeamsScreen.tsx`

**Evidencia**:

1. **ViewType incluye 'equipos'**:
```typescript
// src/types/supabase.ts
export type ViewType = '...' | 'equipos';  // ✅ Definido
```

2. **AppLayout renderiza TeamsScreen**:
```typescript
// src/components/AppLayout.tsx
case 'equipos': return <TeamsScreen />;  // ✅ Renderizado
```

3. **PERO AppContext NO tiene métodos para Equipos**:
```typescript
// src/contexts/AppContext.tsx
interface AppContextType {
  // ... tiene clientes, proyectos, presupuestos, transacciones, actividades
  // ❌ NO TIENE:
  // equipos: Equipo[];
  // addEquipo: ...
  // updateEquipo: ...
  // deleteEquipo: ...
}
```

4. **TeamsScreen no usa AppContext**:
```typescript
// src/components/screens/TeamsScreen.tsx
const { session } = useAppContext();  // Solo usa session
const [equipos, setEquipos] = useState(...);  // Estado local independiente
const loadEquipos = useCallback(async () => {  // Carga propia
  const { data } = await supabase.from('equipos').select('*')...
})
```

**Problema**: 
- ❌ Equipos tienen estado LOCAL en TeamsScreen, no sincronizado
- ❌ Otros componentes NO pueden acceder a datos de equipos
- ❌ No hay realtime listeners para equipos
- ❌ Sin CRUD en AppContext = sin validación global

**Impacto**: 
- Los datos de equipos NO se sincronizan en realtime
- Múltiples usuarios podrían ver datos desactualizados
- Los presupuestos no pueden estar asociados a equipos

---

### ❌ PROBLEMA 3: Esquema SQL Desincronizado - Falta de `team_id`
**Severidad**: ALTA (Datos no persisten correctamente)

**Ubicación**: Múltiples archivos de migración SQL

**Problema**:
Las políticas RLS en `supabase_rls_final_policies.sql` esperan `team_id`:
```sql
-- supabase_rls_final_policies.sql
CREATE POLICY "Acceso propietario presupuestos" ON presupuestos FOR ALL TO authenticated 
USING (auth.uid() = user_id OR team_id IN (SELECT equipo_id FROM equipo_miembros WHERE user_id = auth.uid()));
```

**PERO** el esquema base (`supabase_schema.sql`) NO incluye `team_id`:
```sql
-- supabase_schema.sql (líneas originales)
CREATE TABLE public.presupuestos (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    -- ... otros campos ...
    -- ❌ NO TIENE: team_id uuid
);
```

**¿Dónde está `team_id`?**
- ✓ Mencionado en: `supabase_rls_final_policies.sql`
- ✓ Mencionado en: `supabase_rls_final_v2.sql` (fallback version)
- ✓ Mencionado en: `supabase_rls_migration_extra.sql`
- ❌ NO está en: `supabase_schema.sql` (schema base)

**Impacto**:
- Las políticas RLS FALLAN silenciosamente
- Inserciones pueden fallar con error "column team_id does not exist"
- Si no fallan, es porque las políticas NO se ejecutan correctamente

**Prueba de Fallo**:
```typescript
// En AppContext.tsx
await supabase.from('presupuestos').insert({
  user_id: session.user.id,
  proyecto: 'Mi Proyecto',
  // ... otros campos
  // ❌ Si se intenta usar team_id, fallará
});
```

---

### ❌ PROBLEMA 4: Múltiples Versiones de Políticas RLS Conflictivas
**Severidad**: ALTA (Seguridad inconsistente)

**Archivos en Conflicto**:
1. `supabase_rls_migration.sql` (versión 1)
2. `supabase_rls_final_policies.sql` (versión "final")
3. `supabase_rls_final_v2.sql` (versión "final v2")
4. `supabase_rls_migration_extra.sql` (versión "extra")

**Ejemplo de Conflicto**:

**Versión 1** (`supabase_rls_migration.sql`):
```sql
CREATE POLICY "Acceso propietario presupuestos" ON presupuestos FOR ALL TO authenticated 
USING (auth.uid() = user_id);  -- Solo user_id
```

**Versión "Final"** (`supabase_rls_final_policies.sql`):
```sql
CREATE POLICY "Acceso propietario presupuestos" ON presupuestos FOR ALL TO authenticated 
USING (auth.uid() = user_id OR team_id IN (SELECT ...));  -- user_id + team_id
```

**Versión "Final v2"** (`supabase_rls_final_v2.sql`):
```sql
CREATE POLICY "Acceso propietario presupuestos" ON presupuestos FOR ALL TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL);  -- user_id + NULL check
```

**Problema**: 
- ❌ ¿Cuál fue ejecutada en Supabase? No hay forma de saberlo sin revisar el dashboard
- ❌ La aplicación asume una versión específica pero podría tener otra
- ❌ Esto causa inconsistencias entre dev, staging y producción

---

### ❌ PROBLEMA 5: Tipos Incompletos/Duplicados
**Severidad**: MEDIA (Errores potenciales en desarrollo)

**Ubicación**: `src/types/supabase.ts` vs `src/lib/schemas.ts`

**Problema 1: Tipos Equipo/EquipoMiembro definidos pero NO utilizados en AppContext**:
```typescript
// src/types/supabase.ts (línea ~208)
export interface Equipo {
  id: string;
  nombre: string;
  creador_id: string;
  user_id: string;
  created_at?: string;
}

export interface EquipoMiembro {
  id: string;
  equipo_id: string;
  user_id: string;
  rol: 'admin' | 'miembro' | 'visor';
  created_at?: string;
}

export type CreateEquipo = Omit<Equipo, 'id' | 'created_at'>;
```

Pero en AppContext NO hay:
```typescript
// ❌ Falta en AppContext.tsx
// equipos: Equipo[];
// addEquipo: (e: CreateEquipo) => Promise<void>;
```

**Problema 2: Esquemas Zod duplicados**:
- `src/types/supabase.ts`: Contiene `ClienteSchema`, `ProyectoSchema`, etc.
- `src/lib/schemas.ts`: Contiene `PresupuestoSchema`, `ClienteSchema`, `EquipoSchema`, etc.

Son 2 archivos diferentes con overlap. Cuál se usa en realidad?

```typescript
// src/components/screens/TeamsScreen.tsx (línea 1)
import { EquipoSchema } from '@/lib/schemas';  // ← Usa schemas.ts
```

---

### ❌ PROBLEMA 6: Presupuestos con Estado Local en Componente
**Severidad**: MEDIA (Funcionalidad limitada para equipos)

**Ubicación**: `src/features/presupuestos/components/PresupuestoScreen.tsx`

**Problema**:
```typescript
// PresupuestoScreen NO usa AppContext para presupuestos locales
const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
const [meta, setMeta] = useState({ proyecto: '', ... });
const [saving, setSaving] = useState(false);

// Presupuestos SÍ está en AppContext pero no se usa para form state
const { presupuestos } = useAppContext();
```

**Impacto**:
- Presupuestos guardados en AppContext pero NO sincronizados con form
- Estado split entre AppContext y componente local
- Si hay cambios de otros usuarios, el form no se actualiza

---

### ❌ PROBLEMA 7: Sin Validación de Migraciones en App
**Severidad**: MEDIA (Datos inconsistentes)

**Ubicación**: Ningún código en la app verifica qué migraciones se ejecutaron

**Problema**:
- App asume que todas las tablas existen y tienen todos los campos
- Si falta una migración, la app falla silenciosamente
- No hay versionado de migraciones

**Ejemplo**:
```typescript
// En AppContext, loadAll() hace esto:
const { data: presupuestos } = await supabase
  .from('presupuestos')
  .select('*')  // ← Asume que 'presupuestos' existe con ciertos campos
  .eq('user_id', userId);

// Si presupuestos tabla no existe, error de runtime, no de compilación
```

---

## INCONSISTENCIAS DE CONEXIÓN SUPABASE

### Tabla 1: Verificación de Correspondencia Schema ↔ Tipos ↔ App

| Tabla | Schema Base | Tipos (supabase.ts) | AppContext | RLS Policies | Status |
|-------|-------------|---------------------|-----------|---------------|--------|
| clientes | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| proyectos | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| transacciones | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| actividades | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| presupuestos | ✅ | ✅ | ✅ | ⚠️ (team_id) | ⚠️ CONFLICTO |
| equipos | ✅ | ✅ | ❌ | ⚠️ | ❌ DESINTEGRADO |
| equipo_miembros | ✅ | ✅ | ❌ | ⚠️ | ❌ DESINTEGRADO |
| checklist_items | ✅ | ❌ | ❌ | ✅ | ⚠️ HUÉRFANO |

### Análisis Detallado

#### 1. **Clientes, Proyectos, Transacciones, Actividades**: ✅ SINCRONIZADOS
- Schema base: ✅ Definido
- Tipos: ✅ Definidos
- AppContext: ✅ CRUD completo con realtime
- RLS: ✅ Políticas simples funcionales
- **Conclusión**: Este núcleo está correcto

#### 2. **Presupuestos**: ⚠️ CONFLICTO CON `team_id`
**Problema**: Las políticas RLS más recientes requieren `team_id` pero la tabla no la tiene

```sql
-- supabase_schema.sql (original)
CREATE TABLE presupuestos (
  id uuid,
  user_id uuid,
  -- ❌ NO tiene team_id
);

-- supabase_rls_final_policies.sql (newer)
CREATE POLICY ... USING (... OR team_id IN (...));  
-- ❌ Refiere a columna que no existe
```

**Impacto de Compilación**: 
```sql
-- Si se intenta:
ALTER TABLE presupuestos ADD COLUMN team_id uuid;
CREATE POLICY ... USING (team_id IN (...));
-- Ambos comandos se ejecutan

-- PERO si la migración no se ejecutó:
-- Las políticas RLS fallan silenciosamente
```

#### 3. **Equipos y EquipoMiembros**: ❌ DESINTEGRADOS
**Problema**: Tablas existen en BD, tipos existen en TypeScript, PERO:
- ❌ NO hay CRUD en AppContext
- ❌ NO hay realtime listeners
- ❌ NO hay validación centralizada
- ✅ SÍ hay TeamsScreen con lógica propia

**Impacto**:
```typescript
// Usuario A crea equipo en TeamsScreen
// Usuario B crea equipo en OTRA ventana
// Ambos ven su lista LOCAL, no sincronizada
// Sin realtime, cambios no se propagan
```

#### 4. **ChecklistItems**: ⚠️ HUÉRFANO
**Problema**: Tabla y RLS existen en SQL, pero:
- ❌ NO hay tipos en supabase.ts
- ❌ NO hay CRUD en AppContext
- ❌ Componentes que lo usan estarían rotos

---

## ERRORES DE COMPILACIÓN

### Error 1: Dependencia Faltante (CRÍTICO)

```
Error: Cannot find package '@vitejs/plugin-react-swc'
Location: vite.config.ts:2
Status: ❌ BLOQUEA BUILD
```

**Solución**:
```json
// package.json - Agregar a devDependencies
"@vitejs/plugin-react-swc": "^3.x.x"
```

**O reemplazar en vite.config.ts**:
```typescript
import react from "@vitejs/plugin-react";  // Alternativa disponible
```

### Error 2: Tipos Incompletos (POTENCIAL)

**Archivo**: `src/components/screens/TeamsScreen.tsx`
```typescript
import { EquipoSchema } from '@/lib/schemas';  // ✅ Existe
import type { Equipo, EquipoMiembro } from '@/types/supabase';  // ✅ Existen
```

**Pero si se intenta usar en AppContext**:
```typescript
// src/contexts/AppContext.tsx
import { Equipo } from '@/types/supabase';  // ✅ Existe
// Pero no hay addEquipo() para usar con el tipo
```

---

## PROBLEMAS DE MIGRACIONES SQL

### 1. Múltiples Versiones sin Historial
**Archivos de Migración**:
```
supabase_schema.sql                    # Schema base
supabase_rls_migration.sql             # Primera versión RLS
supabase_rls_final_policies.sql        # "Final" (con team_id)
supabase_rls_final_v2.sql              # "Final v2" (diferente)
supabase_rls_migration_extra.sql       # Parches
migration_checklist.sql                # Checklist module
migration_equipos.sql                  # Teams module
```

**Problema**: ❌ Sin versión aplicada se desconoce cuál está en producción

### 2. Conflicto en Políticas RLS

**Timeline Confusa**:
1. `supabase_schema.sql`: Crea tablas básicas SIN team_id
2. `supabase_rls_migration.sql`: Añade RLS simple
3. `supabase_rls_final_policies.sql`: Asume team_id existe (pero tabla no lo tiene)
4. `supabase_rls_final_v2.sql`: Fallback que evita team_id
5. `supabase_rls_migration_extra.sql`: Intenta agregar team_id

**Resultado**: Incertidumbre total sobre el estado real

### 3. Falta de Validación de Campos

**No se verifica** si campos esperados existen:
```typescript
// En AppContext loadAll()
const { data } = await supabase.from('presupuestos').select('*');
// ¿Qué pasa si presupuestos no tiene user_id?
// ¿Qué pasa si no tiene team_id en la columna?
// Runtime error, sin forma de recuperarse
```

---

## PROBLEMAS DE SEGURIDAD RLS

### 1. Políticas Inconsistentes por Tabla

**Tabla presupuestos**:
- Version A: `USING (auth.uid() = user_id)`
- Version B: `USING (auth.uid() = user_id OR team_id IN (...))`
- Version C: `USING (auth.uid() = user_id OR user_id IS NULL)`

**¿Cuál está activa?** No hay forma de saber sin conectarse a Supabase dashboard.

### 2. Riesgo de Data Leak con NULL Checks

En `supabase_rls_final_v2.sql`:
```sql
CREATE POLICY "..." USING (auth.uid() = user_id OR user_id IS NULL);
```

**Peligro**: Si una fila tiene `user_id = NULL`, TODOS pueden verla.

**Ejemplo de Escenario Malo**:
```sql
-- Alguien inserta sin verificar user_id
INSERT INTO presupuestos (proyecto, user_id) 
VALUES ('Secreto', NULL);

-- Cualquier usuario autenticado puede verlo
SELECT * FROM presupuestos;  -- Ve el presupuesto con user_id NULL
```

### 3. Políticas Team-based No Funcionan Sin Columna

Si `team_id` no existe en tabla:
```sql
-- Esto falla:
USING (team_id IN (SELECT equipo_id FROM equipo_miembros WHERE ...))
-- Column "team_id" does not exist
```

### 4. Sin Validación en INSERT

```typescript
// AppContext puede hacer esto:
await supabase.from('presupuestos').insert({
  proyecto: 'Algo',
  // ❌ No valida que user_id sea requerido
  // ❌ No valida que team_id sea válido
});

// RLS debería rechazarlo, pero si WITH CHECK tiene NULL:
// Pasa sin validar
```

---

## PLAN DE CORRECCIONES

### FASE 1: Correcciones Inmediatas (Críticas)

#### 1.1 Resolver Error de Compilación
**Tarea**: Instalar o reemplazar dependencia

**Opción A** (Recomendado - menor cambio):
```bash
npm install --save-dev @vitejs/plugin-react
```

**Modificar vite.config.ts**:
```typescript
- import react from "@vitejs/plugin-react-swc";
+ import react from "@vitejs/plugin-react";
```

**Tiempo**: 5 minutos

---

#### 1.2 Consolidar Migraciones SQL
**Tarea**: Crear versión única de verdad

**Crear**: `supabase_consolidated_v1.sql`
```sql
-- FASE 1: Tablas Base (SIN team_id por ahora)
CREATE TABLE IF NOT EXISTS presupuestos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  proyecto text NOT NULL,
  -- ... todos los campos necesarios
  -- ⚠️ NO incluir team_id aún
);

-- FASE 2: Políticas RLS (Simple)
DROP POLICY IF EXISTS "presupuestos_access" ON presupuestos;
CREATE POLICY "presupuestos_access" ON presupuestos FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- FASE 3: Índices y Constraints
CREATE INDEX IF NOT EXISTS idx_presupuestos_user ON presupuestos(user_id);
```

**Pasos**:
1. ✅ Copiar versión correcta a Supabase
2. ✅ Borrar todas las políticas conflictivas
3. ✅ Ejecutar consolidado
4. ✅ Verificar en Supabase dashboard

**Tiempo**: 30 minutos

---

### FASE 2: Integración Equipos (Alta Prioridad)

#### 2.1 Agregar Equipos a AppContext
**Ubicación**: `src/contexts/AppContext.tsx`

**Agregar a AppContextType**:
```typescript
interface AppContextType {
  // ... existente ...
  
  // Nuevos campos para equipos
  equipos: Equipo[];
  addEquipo: (e: CreateEquipo) => Promise<string | null>;
  updateEquipo: (id: string, e: UpdateEquipo) => Promise<void>;
  deleteEquipo: (id: string) => Promise<void>;
  
  equipoMiembros: EquipoMiembro[];
  addEquipoMiembro: (em: CreateEquipoMiembro) => Promise<void>;
  removeEquipoMiembro: (id: string) => Promise<void>;
}
```

**Agregar realtime listeners**:
```typescript
const realtimeEquipos = useRef<...>(null);
const realtimeEquipoMiembros = useRef<...>(null);

// En setupRealtimeListeners():
realtimeEquipos.current = supabase.channel('equipos')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'equipos',
    filter: `user_id=eq.${userId}`
  }, (payload) => handleRealtimeChange('equipos', payload))
  .subscribe();
```

**Agregar CRUD methods**:
```typescript
const addEquipo = async (e: CreateEquipo) => {
  if (!session) return null;
  try {
    const { data, error } = await supabase
      .from('equipos')
      .insert({
        ...e,
        user_id: session.user.id,
        creador_id: session.user.id
      })
      .select()
      .single();
    
    if (!error && data) {
      setEquipos(prev => [data, ...prev]);
      return data.id;
    }
  } catch (err) {
    console.error('Error adding equipo:', err);
    throw err;
  }
};
```

**Tiempo**: 1-2 horas

---

#### 2.2 Refactorizar TeamsScreen
**Ubicación**: `src/components/screens/TeamsScreen.tsx`

**Cambio**:
```typescript
// ANTES (estado local)
const [equipos, setEquipos] = useState(...);

// DESPUÉS (desde Context)
const { equipos, addEquipo, deleteEquipo } = useAppContext();

const handleCrear = async () => {
  const id = await addEquipo({ nombre: nuevoEquipo.trim() });
  if (id) {
    toast.success('Equipo creado');
    setNuevoEquipo('');
    // equipos se actualiza automáticamente via realtime
  }
};
```

**Tiempo**: 30 minutos

---

#### 2.3 Extender Presupuestos para Asociar a Equipos
**Ubicación**: `src/types/supabase.ts`

**Modificar interface**:
```typescript
export interface Presupuesto {
  id: string;
  user_id: string;
  team_id?: string;  // ← Nuevo campo opcional
  proyecto: string;
  // ... resto de campos
}
```

**Agregar en schema SQL**:
```sql
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES equipos(id) ON DELETE SET NULL;
```

**Tiempo**: 1 hora

---

### FASE 3: Sincronización y Validación

#### 3.1 Crear Validador de Migraciones
**Crear**: `src/lib/migrationValidator.ts`

```typescript
export async function validateSchema() {
  // Verificar que todas las tablas existen
  const requiredTables = [
    'clientes', 'proyectos', 'presupuestos', 
    'transacciones', 'actividades', 'equipos', 
    'equipo_miembros', 'checklist_items'
  ];
  
  for (const table of requiredTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error?.message?.includes('does not exist')) {
      console.error(`❌ Tabla faltante: ${table}`);
      return false;
    }
  }
  
  return true;
}
```

**Llamar en AppProvider**:
```typescript
useEffect(() => {
  validateSchema().then(isValid => {
    if (!isValid) {
      toast.error('Base de datos no está correctamente inicializada');
      // Mostrar mensaje al usuario
    }
  });
}, []);
```

**Tiempo**: 30 minutos

---

#### 3.2 Consolidar Esquemas Zod
**Ubicación**: Consolidar en `src/types/supabase.ts`

**Cambio**:
```typescript
// MOVER de src/lib/schemas.ts a src/types/supabase.ts
export const EquipoSchema = z.object({...});
export const EquipoMiembroSchema = z.object({...});

// En src/lib/schemas.ts, solo re-exportar:
export { EquipoSchema, EquipoMiembroSchema, ... } from '@/types/supabase';
```

**Beneficio**: Única fuente de verdad

**Tiempo**: 30 minutos

---

### FASE 4: Documentación

#### 4.1 Crear Archivo de Migraciones
**Crear**: `.migration_history.md`

```markdown
# Migration History

## v1.0 - Schema Base
- Tablas: clientes, proyectos, transacciones, actividades, presupuestos
- RLS: Políticas simples user_id only

## v1.1 - Equipos
- Tablas: equipos, equipo_miembros
- RLS: Políticas team-based (sin team_id en otras tablas)

## v2.0 - Consolidado (ACTUAL)
- Todas las tablas
- team_id en presupuestos (opcional)
- Políticas RLS simplificadas pero funcionales
```

**Ubicación**: Guardar en repo como referencia

**Tiempo**: 15 minutos

---

## RESUMEN DE ACCIONES REQUERIDAS

### Tabla de Prioridades

| # | Acción | Prioridad | Tiempo | Blocker |
|---|--------|-----------|--------|---------|
| 1 | Instalar @vitejs/plugin-react-swc | CRÍTICA | 5m | ✅ BUILD |
| 2 | Consolidar SQL migrations | ALTA | 30m | ✅ DATA |
| 3 | Agregar Equipos a AppContext | ALTA | 2h | ❌ FEATURE |
| 4 | Refactorizar TeamsScreen | MEDIA | 30m | ❌ FEATURE |
| 5 | Crear migrationValidator.ts | MEDIA | 30m | ⚠️ RUNTIME |
| 6 | Consolidar Zod schemas | BAJA | 30m | ⚠️ CODE QUALITY |
| 7 | Documentar migraciones | BAJA | 15m | ⚠️ MAINTENANCE |

### Orden Sugerido de Ejecución
```
1. Instalar @vitejs/plugin-react-swc          [5m]   → Verificar que compila
2. Consolidar SQL migrations                   [30m]  → Aplicar en Supabase
3. Agregar Equipos a AppContext                [2h]   → Core integration
4. Refactorizar TeamsScreen                    [30m]  → Usar AppContext
5. Crear migrationValidator.ts                 [30m]  → Runtime safety
6. Consolidar Zod schemas                      [30m]  → Code quality
7. Documentar migraciones                      [15m]  → Maintenance

TOTAL: ~5 horas de trabajo
```

---

## CONCLUSIONES

### Estado Actual
- ✅ **Core funcional**: Clientes, Proyectos, Transacciones, Actividades
- ✅ **Autenticación**: Supabase Auth funcionando
- ✅ **Realtime**: Listeners funcionando para 5 tablas
- ❌ **Build**: Error crítico de compilación
- ❌ **Equipos**: Desintegrados del contexto global
- ⚠️ **RLS**: Políticas conflictivas y potencialmente inseguras
- ⚠️ **SQL**: Migraciones desorganizadas sin historial

### Recomendación Final
**No desplegar a producción hasta resolver FASE 1 y 2.**

Las inconsistencias RLS pueden causar:
- Data loss (null user_id)
- Security vulnerabilities (acceso no autorizado)
- Silent failures (inserciones rechazadas sin aviso)

**Timeline Estimado para "Producción Ready"**: 5-7 horas

---

**Análisis realizado**: 25 de mayo de 2026  
**Versión de la App**: Vol. 5  
**Nivel de Riesgo**: ⚠️ ALTO (no listo para producción)
