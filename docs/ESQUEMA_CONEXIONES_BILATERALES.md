# 📊 ESQUEMA DE CONEXIONES BILATERALES — AUDITORÍA DE COMUNICACIÓN

**Fecha:** 29 Mayo 2026  
**Commit:** `0a7b9c3`  
**Build:** ✅ 1.52s | **TypeCheck:** ✅ 0 errores

---

## 1. MAPA DE ARQUITECTURA

```
SUBSYSTEM LAYER
  Supabase DB ─── Realtime Channels ─── Offline Cache ─── PWA SW
       │               │                      │
       ▼               ▼                      ▼
SERVICE LAYER (35 servicios)
  ClientesSvc  ProyectosSvc  PresupuestosSvc  BodegaSvc  FinancieroSvc
  OCSvc        EquiposSvc    RenglonesSvc     ProveedSvc  CoreEngine
       │               │                      │
       ▼               ▼                      ▼
APP CONTEXT LAYER (26 métodos CRUD + 10 estados + ~20 Realtime channels)
       │               │                      │
       ▼               ▼                      ▼
UI COMPONENT LAYER (12 screens)
  Dashboard(RO)  Bodega(CRUD)  Compras(CRUD)  Presupuesto(CRUD)
  Financiero(RO) Clientes(CRUD) Proyectos(CRUD) Seguimiento(RO)
  Equipos(CRUD)  Aprobacion(CRUD) Cotizacion(RO) Login(Auth)
```

---

## 2. AUDITORÍA BILATERAL POR MÓDULO

| # | Módulo | Lee Context | Escribe Context | Usa Servicios CRUD | Forms Guardan | Build | **%** |
|---|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Dashboard** | ✅ | ⚠️ transición | ✅ CoreEngine (RO) | — | ✅ | **70%** |
| 2 | **ClientesScreen** | ✅ | ✅ add/update/delete | ✅ ClientesService | ✅ CRUD | ✅ | **95%** |
| 3 | **ProyectosScreen** | ✅ | ✅ add/update | ✅ ProyectosService | ✅ CRUD | ✅ | **90%** |
| 4 | **PresupuestoScreen** | ✅ | ✅ add/update/delete | ✅ Materiales/Renglones | ✅ CRUD | ✅ | **95%** |
| 5 | **SeguimientoScreen** | ✅ | ⚠️ transición | ⚠️ GanttService (RO) | ❌ No forms | ✅ | **60%** |
| 6 | **FinancieroScreen** | ✅ | ❌ read-only | ⚠️ CoreEngine (RO) | ❌ No forms de entrada | ✅ | **55%** |
| 7 | **EquiposScreen** | ✅ | ✅ add/update/delete | ✅ EquiposService | ✅ CRUD | ✅ | **95%** |
| 8 | **BodegaScreen** | ✅ | ❌ (usa services) | ✅ Bodega/Materiales | ✅ compra/uso | ✅ | **90%** |
| 9 | **CotizacionScreen** | ✅ | ❌ read-only | ✅ PresupuestosService | ⚠️ exporta PDF | ✅ | **65%** |
| 10 | **ComprasScreen** | ✅ | ❌ refreshOC | ✅ Proveedores/OC | ✅ CRUD + recepción | ✅ | **90%** |
| 11 | **AprobacionScreen** | ✅ | ❌ (usa services) | ✅ Ocr/Aprobacion | ✅ approve/reject | ✅ | **85%** |
| 12 | **LoginScreen** | ✅ | ✅ auth context | — | — | ✅ | **100%** |

---

## 3. INCONSISTENCIAS DETECTADAS (Grano Fino)

### 🔴 CRÍTICAS (0)

| # | Tipo | Módulo | Detalle |
|---|------|--------|---------|
| — | — | — | Ninguna |

### 🟡 MEDIAS (4)

| # | Módulo | Problema | Impacto |
|---|--------|----------|---------|
| 1 | **SeguimientoScreen** | Función `registrarPago` en PlanillaService inserta en transacciones pero no refresca el contexto. Los pagos se guardan en DB pero Dashboard/Financiero no ven el cambio hasta recargar. | ⬇️ 20% |
| 2 | **FinancieroScreen** | Todos los cálculos son `useMemo` read-only sobre `transacciones`. No hay formulario para crear/editar transacciones desde Financiero (depende de otro lado o DB directa). Sin `updateTransaccion` en AppContext. | ⬇️ 30% |
| 3 | **Dashboard** | No escribe NADA al contexto — es 100% visual. Las alertas del AgenteInteligente no se registran como notificaciones. | ⬇️ 20% |
| 4 | **OrdenesCompra** | AppContext solo expone `refreshOrdenesCompra`. No hay `addOrdenCompra`/`updateOrdenCompra`/`deleteOrdenCompra` en el contexto — ComprasScreen usa servicios directamente y el contexto no se refresca automáticamente tras crear una OC. | ⬇️ 15% |

### 🟢 MENORES (3)

| # | Módulo | Problema |
|---|--------|----------|
| 5 | **CotizacionScreen** | Lee presupuestos pero no escribe — es export-only. Los cambios de cotización no persisten. |
| 6 | **ProyectosScreen** | No tiene `deleteProyecto` en AppContext (usa `deletePresupuesto` en su lugar). |
| 7 | **Dashboard** | Dashboard-Financiero duplican lógica de cálculo (CoreEngineService unifica pero FinancieroScreen aún calcula inline). |

---

## 4. ESTADO GLOBAL DE COMUNICACIÓN BILATERAL

### Cálculo por Categoría

| Categoría | Peso | % | Justificación |
|-----------|:---:|:---:|---------------|
| Pantallas conectadas en AppLayout | 15% | 100% | 12/12 incluyendo aprobacion |
| ViewType consistente | 10% | 100% | 'aprobacion' + 'compras' incluidos |
| AppContext CRUD completo | 20% | 80% | 26 métodos, falta updateTransaccion, updateActividad, deleteProyecto, addOC |
| Servicios → UI correctos | 15% | 95% | Todos usados excepto AuditoriaService, CalculoService |
| Sin supabase.from() en UI | 10% | 100% | 0 llamadas directas |
| Formularios guardan datos | 10% | 85% | Bodega, Compras, Clientes, Proyectos, Equipos OK. Financiero NO tiene forms de entrada |
| Realtime actualiza UI | 10% | 90% | ~20 canales activos, pero Seguimiento no refresca tras registrarPago |
| Build + TypeCheck | 5% | 100% | 0 errores, 1.52s |
| Scroll automático | 5% | 100% | overflow-y-auto en AppLayout |

### ✅ Resultado Final

```
COMUNICACIÓN BILATERAL GLOBAL:  ✅ 92%
```

**Resumen:** La aplicación tiene una base sólida (92%). Las 4 inconsistencias medias son principalmente en Seguimiento (falta refresco post-pago), Financiero (sin formulario de entrada de datos) y Dashboard (100% read-only). Estos son los puntos a priorizar si se desea alcanzar el 100%.