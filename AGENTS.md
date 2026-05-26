# CONSTRUSMART WM — Agent Guide

## Dev commands

```bash
npm run dev          # Vite on port 8080 (NOT 5173)
npm run build        # production build
npm run build:dev    # build with --mode development
npm run lint         # eslint . --fix
npm run typecheck    # tsc --noEmit
npm test             # vitest
# Order: lint → typecheck → test
```

## Project architecture

- **React 18 SPA** with Vite 8, TypeScript, Tailwind CSS, Shadcn/ui.
- **State**: AppContext (`src/contexts/AppContext.tsx`) is the main data hub — CRUD, auth, and Realtime subscriptions.
- **TanStack Query** is imported but **not actually used** — all data flows through AppContext.
- **Supabase** (`@supabase/supabase-js` v2) for auth, DB, and Realtime.
- **Path alias**: `@/` → `src/` (configured in both vite.config.ts and vitest.config.ts).
- **PWA**: auto-updating service worker via `vite-plugin-pwa` — dev mode also enabled.
- **Vercel**: SPA rewrites in `vercel.json`.
- **Entrypoint chain**: `src/main.tsx` → `App.tsx` → `pages/Index.tsx` → `<AppProvider> <AppLayout />`.
- **Features** dir: `src/features/{clientes,financiero,presupuestos,proyectos}/`, each with own `components/` and `hooks/`.
- **Services** dir: `src/services/` (CalculoService, PresupuestoService, RenglonesService, ExportService, offline).
- **No CI workflows** exist (only dependabot for devcontainers). No automated PR checks besides local commands.

## Supabase — critical facts

### Env vars (required)
```
VITE_SUPABASE_URL=<url>
VITE_SUPABASE_ANON_KEY=<key>
```
`.env` has real creds (live Supabase project); `.env.example` has placeholders. **Do not commit `.env`.**

### 28 SQL files — only ONE matters
Use **`SYNC_SUPABASE_FINAL.sql`** as the authoritative schema (17 tables, fully idempotent). Ignore all other `.sql` files.

### 17 tables with full CRUD + RLS
`clientes`, `proyectos`, `presupuestos`, `transacciones`, `actividades`, `equipos`, `equipo_miembros`,
`renglones`, `renglon_usage`, `renglon_precios_historial`,
`cambios_presupuesto`, `materiales_proyecto`, `movimientos_materiales`,
`conciliaciones`, `partidas_conciliacion`, `checklist_items`,
`notificaciones`

### `costo_directo` added to `presupuestos`
Column already exists in `SYNC_SUPABASE_FINAL.sql` (CREATE + ALTER). `PresupuestoService.ts:191` writes it correctly.

### `transacciones.proyecto_id` type
Must stay `text` (not `uuid`) — the app writes `'admin'` as proyecto_id for office transactions.

### 4 feature modules connected to Supabase
| Module | Hook file | Tables used |
|---|---|---|
| Change Orders | `src/hooks/useChangeOrders.ts` | `cambios_presupuesto` |
| Materials tracking | `src/hooks/useTrazabilidadMateriales.ts` | `materiales_proyecto`, `movimientos_materiales` |
| Bank reconciliation | `src/hooks/useConciliacionBancaria.ts` | `conciliaciones`, `partidas_conciliacion` |
| Quality checklists | `src/hooks/useChecklistCalidad.ts` | `checklist_items` |

Each hook loads from Supabase on mount (useEffect) and writes on every mutation.

### RLS pattern
Simple tables: `{table}_owner` — FOR ALL TO authenticated, `auth.uid() = user_id`.
Child tables (cambios, materiales, movimientos, checklists): filter via `presupuesto_id IN (SELECT id FROM presupuestos WHERE user_id = auth.uid())`.
Equipos: additional SELECT access for team members via subquery.

## Notable config quirks

- **eslint**: `no-unused-vars` OFF, `no-explicit-any` OFF, `react-refresh/only-export-components` OFF.
- **Build chunks**: vendor-react, vendor-charts (recharts), vendor-icons (lucide), vendor-forms (zod/hook-form).
- **vitest**: jsdom environment, `@` alias, `./src/setupTests.ts` (imports `@testing-library/jest-dom`).
- **Tests**: 3 test files in `src/utils/` — `predictorAPU.test.ts`, `reportesAutomaticos.test.ts`, `validacionPresupuesto.test.ts`. No e2e tests.

## Two `usePresupuestos` hooks
- `src/hooks/usePresupuestos.ts` — wraps `PresupuestoService` (calculations, export, comparisons).
- `src/features/presupuestos/hooks/usePresupuestos.ts` — may differ; check which one a consumer imports.

## Offline-first system

Built into AppContext via `src/services/offline.ts`.

- **Cache**: every successful Supabase fetch saves to `localStorage` under key `offline_{table}_{userId}`. On fetch failure (offline or 500), each table loads independently from cache — one broken table never blocks others.
- **Pending queue**: mutations made while offline are saved as `PendingMutation` records in `localStorage` under `offline_pending_{userId}`. State updates are applied optimistically (immediate UI + cache save).
- **Auto-sync**: on `online` event, pending mutations replay in order against Supabase. After all sync, fresh data is fetched. Sync happens automatically via `useEffect` on `[isOnline, session?.user.id]`.
- **OfflineBanner** (`src/components/shared/OfflineBanner.tsx`): shows "Sin conexión" + pending count when offline; shows "Sincronizando..." during sync. Auto-hides when idle.
- **Cache cleared** on signOut. Pending queue drained after successful sync.
- **Edge case**: if the Supabase project lacks some tables (500), those tables load from cache or stay empty — the app still boots with whatever data is available.
