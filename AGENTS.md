# CONSTRUSMART WM — Agent Guide

## Dev commands
```bash
npm run dev          # Vite on port 8080 (NOT 5173)
npm run build        # production build
npm run lint         # eslint . --fix
npm run typecheck    # tsc --noEmit
npm run test         # vitest (add --run for single-run)
```

## Architecture & Data Flow
- **Framework**: React 18 SPA + Vite 8 + Tailwind 3.4 + Shadcn/ui. NOT a monorepo.
- **Entrypoint**: `index.html` → `src/main.tsx` → `src/App.tsx` (providers: ThemeProvider > QueryClientProvider > TooltipProvider > BrowserRouter) → `src/pages/Index.tsx` (AppProvider + AppLayout).
- **View routing**: React Router only serves `/` and `*` (404). Internal screen switching uses **`AppContext.view`** (state enum: `login | dashboard | clientes | presupuesto | seguimiento | financiero | proyectos | equipos`), not route paths.
- **Service Layer**: `src/services/` centralizes all Supabase interaction. **Always use these services instead of direct `supabase.from()` calls.** This rule applies especially to panels (Checklist, Materiales, ChangeOrder, Notifications).
- **Server state**: TanStack React Query 5 is used (see `src/App.tsx` for `QueryClientProvider`). Coordinate with services layer.
- **Offline**: `src/services/offline.ts` caches reads in localStorage and queues writes as `PendingMutation` objects. Data synced when connection restores.
- **PWA**: `vite-plugin-pwa` with `registerType: "autoUpdate"` and Workbox caching. Service worker registered in `src/main.tsx`.
- **Path alias**: `@/` maps to `./src/` (configured in both Vite and Vitest).

## Data conventions
- **DB**: snake_case. **TS/App**: camelCase. Direct object construction preferred over validate-then-transform where schema mismatch occurs.
- **Validation**: Zod schemas live in `src/types/supabase.ts` alongside DB↔App transformers (snake_case ↔ camelCase).

## Supabase
- **Master Schema**: `scripts/ERP_SCHEMA_FINAL.sql` (Authoritative Source of Truth). Apply schema changes there.
- **Cleanup**: `scripts/CLEANUP_ALL.sql` drops all 19 tables, policies, triggers, functions. Run BEFORE ERP_SCHEMA_FINAL.sql to reset.
- **19 Tables**: clientes, proyectos, presupuestos, transacciones, audit_log, bitacora_avance, actividades, equipos, equipo_miembros, renglones, renglon_usage, renglon_precios_historial, cambios_presupuesto, materiales_proyecto, movimientos_materiales, conciliaciones, partidas_conciliacion, checklist_items, notificaciones.
- **RLS**: Recursion in `equipos`/`equipo_miembros` solved via `SECURITY DEFINER` function `user_owns_equipo`. Helper: `fn_set_updated_at` trigger on presupuestos.
- **Realtime**: ~17 `RealtimeChannel` subscriptions for live updates across major tables. Expect live sync behavior.
- **Client**: Created in `src/lib/supabase.ts` from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## APU Engine (Presupuesto Module)
- **Data**: `src/data/renglones.ts` — 40 construction renglones with subrenglones (materiales, manoObra, equipos) with quantities and unit costs. Each `Renglon` has `subrenglones: { materiales: SubMaterial[], manoObra: SubManoObra[], equipos: SubEquipo[] }`.
- **Calculation**: `calcularAPU(linea)` in `renglones.ts` derives `costoMaterial`, `costoManoObra`, `costoHerramienta`, `costoUnitario`, `subtotal`, `dias`, `totalPersonasDia` from subrenglones. Use this instead of manual sum.
- **Auto-recalc**: Changing any material quantity/price, MO persons/jornal, or equipment hours triggers full recalculation via `updateSubMaterial`/`updateSubMO`/`updateSubEquipo` callbacks. `costoMaterial`, `costoManoObra`, `costoHerramienta` on Renglon are now derived (computed from subrenglones).
- **Backward compat**: Old lineas without subrenglones still work — `calcularAPU` and UI fall back to top-level cost fields.

## Migration status (partial → services layer)
- **Already migrated**: `presupuestos/`, `financiero/`, `proyectos/`, `auditoria/`, `equipos/`, `seguimiento/` services.
- **Still direct `supabase.from()` calls in AppContext**: clientes, proyectos, actividades, equipos CRUD needs migration.
- **Financials**: Use `FinancieroService` for all balance, income, expense, projections.
- **Dashboard**: Uses skeletons and `PresupuestosService.analizarDesviacion`.

## Testing
- **Framework**: Vitest 4 with jsdom, `@testing-library/jest-dom`, globals enabled (no imports needed for `describe`/`it`/`expect`/`vi`).
- **Existing tests**: 3 files in `src/utils/` (`predictorAPU.test.ts`, `reportesAutomaticos.test.ts`, `validacionPresupuesto.test.ts`).
- **Run**: `npm run test` (watches by default). Add `--run` for single run.

## Deployment
- **Target**: Vercel (auto-deploy from git). `vercel.json` configures SPA rewrites and PWA manifest headers.
- **TypeScript**: Strict mode (`tsconfig.json`). Run `npm run typecheck` before pushing.
