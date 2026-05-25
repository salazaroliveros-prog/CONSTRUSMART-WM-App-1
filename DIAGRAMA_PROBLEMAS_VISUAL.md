# 🎨 DIAGRAMA VISUAL - ARQUITECTURA VS REALIDAD

## Componente 1: FLUJO DE DATOS - ESTADO ACTUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                    APLICACIÓN FUNCIONAL                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  React Components (Clientes, Proyectos, Transacciones, etc)   │
│           ↓                                                     │
│  ✅ AppContext.tsx  (Estado global + CRUD)                    │
│           ↓                                                     │
│  ✅ Supabase Client                                            │
│           ↓                                                     │
│  ✅ PostgreSQL (Clientes, Proyectos, Transacciones)           │
│           ↓                                                     │
│  ✅ RLS Policies (user_id only)                               │
│           ↓                                                     │
│  ✅ Realtime Listeners                                         │
│           ↓                                                     │
│  ✅ UI Re-renders                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    MÓDULO EQUIPOS - ROTO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TeamsScreen.tsx (Estado LOCAL)                               │
│           ↓                                                     │
│  ❌ NO está en AppContext                                      │
│           ↓                                                     │
│  ⚠️  Supabase Client (llamadas diretas)                       │
│           ↓                                                     │
│  ✅ PostgreSQL (equipos, equipo_miembros)                     │
│           ↓                                                     │
│  ⚠️  RLS Policies (equipo_id check - ¿ejecutado?)            │
│           ↓                                                     │
│  ❌ NO hay realtime listeners                                  │
│           ↓                                                     │
│  ❌ UI NO se sincroniza entre usuarios                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componente 2: ESTADO DE CONSISTENCIA

```
┌─────────────────────────────────────────────────────────────────┐
│              CHECKLIST: CADA ENTIDAD                            │
├─────────────────────────────────────────────────────────────────┤

CLIENTES
  ✅ Tabla SQL existe
  ✅ Tipos TypeScript definidos
  ✅ CRUD en AppContext
  ✅ Realtime listeners
  ✅ RLS policies
  → STATUS: ✅ FULLY FUNCTIONAL

PROYECTOS
  ✅ Tabla SQL existe
  ✅ Tipos TypeScript definidos
  ✅ CRUD en AppContext
  ✅ Realtime listeners
  ✅ RLS policies
  → STATUS: ✅ FULLY FUNCTIONAL

TRANSACCIONES
  ✅ Tabla SQL existe
  ✅ Tipos TypeScript definidos
  ✅ CRUD en AppContext
  ✅ Realtime listeners
  ✅ RLS policies
  → STATUS: ✅ FULLY FUNCTIONAL

PRESUPUESTOS
  ✅ Tabla SQL existe
  ✅ Tipos TypeScript definidos
  ✅ CRUD en AppContext
  ✅ Realtime listeners
  ⚠️  RLS policies (Esperan team_id que NO existe)
  → STATUS: ⚠️ PARTIALLY BROKEN

EQUIPOS
  ✅ Tabla SQL existe
  ✅ Tipos TypeScript definidos
  ❌ CRUD en AppContext
  ❌ Realtime listeners
  ⚠️  RLS policies (Requieren equipo_id)
  → STATUS: ❌ BROKEN

EQUIPO_MIEMBROS
  ✅ Tabla SQL existe
  ✅ Tipos TypeScript definidos
  ❌ CRUD en AppContext
  ❌ Realtime listeners
  ⚠️  RLS policies
  → STATUS: ❌ BROKEN

CHECKLIST_ITEMS
  ✅ Tabla SQL existe
  ❌ Tipos TypeScript definidos
  ❌ CRUD en AppContext
  ❌ Realtime listeners
  ✅ RLS policies
  → STATUS: ⚠️ ORPHANED

└─────────────────────────────────────────────────────────────────┘
```

---

## Componente 3: PROBLEMAS DE SEGURIDAD RLS

```
┌─────────────────────────────────────────────────────────────────┐
│            RLS POLICY VERSIONS IN CONFLICT                      │
├─────────────────────────────────────────────────────────────────┤

supabase_rls_migration.sql (Original)
  USING (auth.uid() = user_id)
  → Simple, works, but no team support

supabase_rls_final_policies.sql (Latest v1)
  USING (auth.uid() = user_id OR team_id IN (...))
  → ❌ FAILS: team_id column doesn't exist!

supabase_rls_final_v2.sql (Latest v2)
  USING (auth.uid() = user_id OR user_id IS NULL)
  → ⚠️ SECURITY RISK: Allows NULL user_id to be visible

supabase_rls_migration_extra.sql (Patch)
  Attempts to ADD team_id column
  → ❌ Circular dependency: policy expects column, column doesn't exist

QUESTION: Which one is actually in Supabase?
  ❓ Unknown - need to check Supabase dashboard

CONSEQUENCES:
  ❌ RLS may be silently bypassed
  ❌ Data may leak between users  
  ❌ Inserts may fail without error message
  ❌ Inconsistent behavior between dev/prod

└─────────────────────────────────────────────────────────────────┘
```

---

## Componente 4: COMPILACIÓN & BUILD

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUILD STATUS                                 │
├─────────────────────────────────────────────────────────────────┤

$ npm run build

  vite build

  Error: Cannot find package '@vitejs/plugin-react-swc'
  
  Location: vite.config.ts:2
  
  Root Cause: Package listed in vite.config but NOT in package.json
  
  RESULT: ❌ BUILD FAILS
  
  $ npm install --save-dev @vitejs/plugin-react-swc
  
  ✅ BUILD SHOULD WORK AFTER THIS

└─────────────────────────────────────────────────────────────────┘
```

---

## Componente 5: DATA PERSISTENCE FLOW

```
┌──────────────────────────────────────────────────────────────────────┐
│                  HAPPY PATH (Clientes, Proyectos)                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ User Input → addCliente() → Validate (Zod)                          │
│                              ↓                                        │
│                        Supabase Insert                               │
│                              ↓                                        │
│                        Database Insert                               │
│                              ↓                                        │
│                        RLS Check: PASS                               │
│                              ↓                                        │
│                        Row Inserted ✅                               │
│                              ↓                                        │
│                        Postgres Trigger                              │
│                              ↓                                        │
│                        Realtime Event Sent                           │
│                              ↓                                        │
│                        All Clients Receive Event                     │
│                              ↓                                        │
│                        Local State Updated                           │
│                              ↓                                        │
│                        UI Re-renders ✅                              │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│           BROKEN PATH (Equipos - No Realtime)                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ User A: Input → addEquipo() → DB Insert                             │
│                              ↓                                        │
│                        Row Inserted ✅                               │
│                              ↓                                        │
│                        Postgres Trigger (exists)                     │
│                              ↓                                        │
│                        Realtime Event Sent                           │
│                              ↓                                        │
│ User B: ❌ NO LISTENERS CONFIGURED                                   │
│         ❌ Event Ignored                                             │
│         ❌ TeamsScreen.state NOT updated                             │
│         ❌ User B still sees OLD list                                │
│                                                                       │
│ Result: User B and User A see different data                         │
│         DATA INCONSISTENCY ❌                                         │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│    DANGEROUS PATH (Presupuestos - RLS team_id doesn't exist)         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ User Input → addPresupuesto() → Validate                            │
│                                   ↓                                  │
│                             Supabase Insert                          │
│                                   ↓                                  │
│                             Database Insert                          │
│                                   ↓                                  │
│                       RLS Check: team_id IN (...)                   │
│                                   ↓                                  │
│                       ❌ Column 'team_id' doesn't exist              │
│                                   ↓                                  │
│    Scenario A: Policy FAILS                                          │
│       → SQL Error: column doesn't exist                              │
│       → Insert REJECTED ❌                                            │
│       → User gets error                                              │
│                                   OR                                  │
│    Scenario B: Policy is SKIPPED                                     │
│       → Insert ALLOWED                                               │
│       → No user_id validation                                        │
│       → Data inserted without proper isolation ❌                    │
│                                                                       │
│ RESULT: Unpredictable behavior                                       │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Componente 6: RECOVERY TIMELINE

```
┌──────────────────────────────────────────────────────────────────────┐
│                    WORK BREAKDOWN                                     │
├──────────────────────────────────────────────────────────────────────┤

PHASE 1: Emergency Fixes (35 min)
├─ 5m:  npm install @vitejs/plugin-react-swc
├─ 5m:  npm run build (verify)
├─ 25m: Review SQL migrations & select correct one
└─ [Total: 35 min]

PHASE 2: SQL Consolidation (30 min)
├─ 10m: Create supabase_consolidated_v1.sql
├─ 10m: Drop conflicting policies
├─ 10m: Apply consolidated script to Supabase
└─ [Total: 30 min]

PHASE 3: Equipos Integration (120 min)
├─ 60m: Add equipos CRUD to AppContext
├─ 30m: Add realtime listeners for equipos
├─ 30m: Refactor TeamsScreen to use context
└─ [Total: 120 min]

PHASE 4: Validation & Testing (30 min)
├─ 15m: Create migrationValidator.ts
├─ 15m: Manual testing & verification
└─ [Total: 30 min]

────────────────────────────────────
TOTAL TIME: 215 minutes (~3.5 hours)

✅ App should be production-ready after this

└──────────────────────────────────────────────────────────────────────┘
```

---

## Componente 7: RISK MATRIX

```
┌──────────────────────────────────────────────────────────────────┐
│                    ISSUE SEVERITY                                 │
├──────────────────────────────────────────────────────────────────┤

CRITICAL (Deploy Blocker)
  ❌ Build error (@vitejs/plugin-react-swc)
  ❌ RLS team_id column mismatch
  Recommendation: DO NOT DEPLOY

HIGH (Major Issues)
  ❌ Equipos module broken (no realtime)
  ⚠️  Multiple conflicting SQL migrations
  Recommendation: Fix before deploy

MEDIUM (Functional Issues)
  ⚠️  Presupuestos state split (app + component)
  ⚠️  Schema validation missing
  Recommendation: Fix in next sprint

LOW (Code Quality)
  ⚠️  Duplicate Zod schemas
  ⚠️  Inconsistent documentation
  Recommendation: Refactor when time allows

└──────────────────────────────────────────────────────────────────┘
```

---

## Componente 8: GO/NO-GO DECISION

```
┌──────────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT READINESS                           │
├──────────────────────────────────────────────────────────────────┤

Current Status: ❌ NO-GO

Blockers:
  ❌ App does not compile
  ❌ RLS policies conflict with schema
  ❌ Equipos module non-functional
  ❌ Multiple SQL migrations (unknown state)

Recommendation: 
  🚫 HOLD deployment
  ⏰ Complete 3.5-hour remediation plan
  ✅ Then: Re-test and redeploy

Timeline:
  Today:   3.5 hours work
  Tomorrow: Deploy with confidence ✅

└──────────────────────────────────────────────────────────────────┘
```

---

Generated: 25 de mayo de 2026 | CONSTRUSMART WM App Vol.5
