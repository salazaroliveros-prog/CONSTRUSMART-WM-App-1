# 📋 AUDITORÍA GENERAL: INVENTARIO FUNCIONAL, OPERATIVO Y DE ALMACENAMIENTO DE CONSTRUSMART WM

Este documento contiene el desglose detallado de todos los módulos, componentes, funciones, lógica operativa y de almacenamiento (Base de Datos / Supabase) con los que cuenta actualmente la aplicación **Construsmart WM**.

---

## 🚦 RESUMEN DE LA ARQUITECTURA
- **Cliente:** Single Page Application (SPA) construida con React 18, Vite 8 y Tailwind CSS.
- **Rutas e Interfaz:** El enrutador de React Router sirve la ruta única `/`. La navegación interna e intercambio de pantallas ejecutivas se maneja reactivamente mediante el estado global `AppContext.view` (`ViewType`).
- **Base de Datos y Tiempo Real:** Servido por Supabase con políticas de RLS activas y sincronización por canales de tiempo real (`RealtimeChannel`).
- **Offline Sync:** Implementado en `offline.ts`, encola mutaciones pendientes en `localStorage` y las ejecuta en lotes automáticos al reconectar.

---

## 1. MÓDULO DE AUTENTICACIÓN (LOGIN)
* **Archivo de Vista:** `src/components/screens/LoginScreen.tsx`
* **Lógica en Contexto:** `AppContext.tsx` (Métodos de auth)
* **Persistencia:** Supabase Auth (`localStorage` automático)

### A. Lógica Funcional y Operativa
Controla el acceso seguro al ERP, validando credenciales de usuario y asegurando el aislamiento por sesión de datos sensibles con RLS en Supabase. El correo del administrador principal de obra es `salazaroliveros@gmail.com`.

### B. Campos y Validaciones del Formulario
- **Email:** Campo de texto (`type="email"`), obligatorio, validación de formato HTML5.
- **Contraseña:** Campo de contraseña (`type="password"`), longitud mínima de 6 caracteres.
- **Nombre:** Visible únicamente en la pestaña de Registro, requerido para dar de alta un usuario nuevo.
- **Manejo de Errores:** Intercepta excepciones de red y credenciales de Supabase y las despliega en un Banner de Alerta dinámico.

### C. Elementos Interactivos y Estado
- **Tabs de Selección ("Iniciar Sesión" / "Registrarse"):** ✅ *Operativo*. Intercambia la interfaz del formulario mediante estado de React.
- **Botón "Entrar" o "Registrarse":** ✅ *Operativo*. Incluye spinner de carga, deshabilitándose de forma adaptativa para evitar mutaciones duplicadas de red.
- **Botón "Iniciar con Google":** ✅ *Operativo*. Dispara `signInWithOAuth` con el proveedor correspondiente.

---

## 2. MÓDULO DE DASHBOARD (PANEL DE CONTROL)
* **Archivo de Vista:** `src/components/screens/Dashboard.tsx`
* **Servicios Lógicos:** `CoreEngineService.ts`, `AgenteInteligente.ts`
* **Persistencia:** Lectura agregada de presupuestos y transacciones con sincronización en tiempo real.

### A. Lógica Funcional y Operativa
Presenta la información consolidada de todas las obras mediante un panel interactivo de tres páginas paginadas con indicadores gráficos, cronograma de Gantt global e informes automatizados del Agente de Inteligencia Artificial.

### B. Elementos Interactivos, Filtros y Gráficas
- **Selector de Proyecto General:** Lista desplegable (`<select className="select-standard">`) que filtra de manera reactiva e instantánea todos los datos de las tres páginas en base al `proyectoId` seleccionado.
- **Paginador Ejecutivo (Dots + Arrows):** ✅ *Operativo*. Controla de forma reactiva la página visualizada (`pagina` 0, 1 o 2). En móviles, transforma el grid complejo en una lista vertical fluida de fácil lectura.
- **Tarjetas KPI Interactivas (7 métricas):** ✅ *Operativo*. Despliegan montos financieros, utilidades y estados de compras formateados automáticamente a Quetzales (`fmtQ()`) con animaciones de entrada fluidas.
- **Gráfico "Avance Físico vs Financiero" (Pág. 1):** ✅ *Operativo*. `BarChart` de Recharts que compara el presupuesto ejecutado vs el avance físico de obra.
- **Gantt General Integrado (`GanttView` - Pág. 1):** ✅ *Operativo*. Traza visualmente el cronograma de ejecución del proyecto.
- **Gráfica de Líneas "Flujo de Caja Mensual" (Pág. 2):** ✅ *Operativo*. `LineChart` con tooltip interactivo que detalla la liquidez mensual histórica.
- **Gráfica de Torta "Gastos por Categoría" (Pág. 2):** ✅ *Operativo*. `PieChart` interactivo que lee directamente la clasificación de las transacciones para visualizar costos operativos, administrativos y personales.
- **Project HeatMap / Mapa de Rentabilidad (Pág. 3):** ✅ *Operativo*. Permite la comparación visual interactiva de los márgenes de ganancia entre obras.
- **Alertas Inteligentes (Pág. 3):** ✅ *Operativo*. Ejecuta en segundo plano `AgenteInteligente.diagnosticarProyecto` para inyectar alertas en tarjetas dinámicas con nivel de severidad (Crítico, Advertencia, Info) si detecta desvíos presupuestarios o exceso de costos.

---

## 3. MÓDULO DE PRESUPUESTOS (APU / MOTOR DE COSTOS)
* **Archivo de Vista:** `src/features/presupuestos/components/` (PresupuestoScreen)
* **Sub-Componentes:** `RenglonCard.tsx`, `PanelAPUPredictor.tsx`
* **Servicios Lógicos:** `PresupuestosService.ts`, `RenglonesService.ts`, `CoreEngineService.ts`, `MaterialesService.ts`
* **Persistencia:** Tabla `presupuestos` en Supabase con RLS y soporte offline.

### A. Lógica Funcional y Operativa
Permite la formulación avanzada de presupuestos con base en el sistema APU (Análisis de Precios Unitarios). Ofrece una base de 40 renglones constructivos estandarizados que se escalan según factores y tipología de proyecto.

### B. Formularios de Entrada y Lógica Reactiva
- **Sidebar de Factores Financieros:** Campos editables para *Indirectos (%)*, *Administrativos (%)*, *Imprevistos (%)*, e *Utilidad (%)*. Al modificarse, actualizan instantáneamente el subtotal y el gran total del presupuesto.
- **Accordion de Edición APU (inline en cada partida):**
  - Permite modificar insumos del renglón en tablas de edición rápida:
    - *Materiales:* Nombre, unidad, cantidad, costo unitario, desperdicio.
    - *Mano de Obra:* Descripción, jornal, cantidad de personas.
    - *Equipo/Herramientas:* Descripción, cantidad, costo hora.
  - **Lógica de Autorecalculo:** Integra el hook reactivo `useDeepCalc(lineas)` que recalcula instantáneamente los costos unitarios y totales de materiales, mano de obra (`(personas * jornal) / rendimiento`), y herramientas de fondo.
- **Almacenamiento:** El método `PresupuestosService.actualizarPresupuesto` persiste en la tabla de presupuestos de Supabase y de forma local en caché.

### C. Elementos Interactivos
- **Selector de Tipología:** ✅ *Operativo*. Aplica un multiplicador de escala sobre el costo del APU según el tipo de obra (comercial, residencial, civil, etc.).
- **Buscador Dinámico de Catálogo:** ✅ *Operativo*. Filtra los renglones base por palabras clave o agrupador en tiempo real.
- **Panel de Predicciones y Anomalías:** ✅ *Conectado*. Muestra anomalías de desvíos de precios (`validacionPresupuesto.ts`) y un botón para sugerir costos históricos (`predictorAPU.ts`).
- **Botón "Exportar CSV" / "Imprimir PDF":** ✅ *Operativo*. Formateadores robustos de exportación e impresión corporativa.

---

## 4. MÓDULO DE SEGUIMIENTO (GANTT, CPM Y BITÁCORA)
* **Archivo de Vista:** `src/components/screens/SeguimientoScreen.tsx`
* **Sub-Componentes:** `GanttView.tsx`, `BitacoraAvancePanel.tsx`
* **Servicios Lógicos:** `GanttService.ts`, `PlanillaService.ts`, `BitacoraAvanceService.ts`
* **Persistencia:** Tablas `bitacora_avance` y `transacciones` en Supabase.

### A. Lógica Funcional y Operativa
Controla la ejecución del proyecto a nivel temporal (diagrama de Gantt), ruta de avance crítico (CPM) e incidencias físicas cotidianas de la construcción.

### B. Formulario de Avance y Bitácora
- **Campos:** *Actividad vinculada, % Avance real (Numérico), Clima/Condición (Select), Descripción de labores (Texto largo), Registro fotográfico (Archivo)*.
- **Validaciones:** % de avance limitado obligatoriamente de 0 a 100. Descripción obligatoria.
- **Persistencia:** Registra entradas en `bitacora_avance`, actualizando dinámicamente el progreso global del proyecto en la tabla `proyectos`.

### C. Elementos Interactivos
- **Gantt CPM Interactivo:** ✅ *Operativo*. Gráfica interactiva con barra temporal de Gantt. Ejecuta el algoritmo CPM calculando holguras y pintando en color rojo brillante las tareas críticas sin holgura (Ruta Crítica) y en azul las actividades no críticas con margen temporal de retraso.
- **Panel de Planilla:** ⚠️ *Parcial*. Muestra egresos por mano de obra. El servicio `PlanillaService.registrarPago` realiza el insert en transacciones pero carece de un paso intermedio de validación que asegure la existencia física de la ID del empleado en la base de datos (Deuda técnica menor identificada).

---

## 5. MÓDULO DE BODEGA (INVENTARIO Y MATERIALES)
* **Archivo de Vista:** `src/components/screens/BodegaScreen.tsx`
* **Servicios Lógicos:** `BodegaService.ts`, `MovimientosMaterialesService.ts`
* **Persistencia:** Tablas `materiales_proyecto` y `movimientos_materiales` en Supabase.

### A. Lógica Funcional y Operativa
Controla el almacén de obra. Mapea qué materiales se han ingresado, cuáles se han consumido en el terreno y las desviaciones físicas de material (merma/desperdicio).

### B. Formulario de Movimiento de Inventario
- **Campos:** *Material (Select), Tipo de movimiento (Entrada / Uso en Obra / Desperdicio), Cantidad (Numérico), Responsable, Notas*.
- **Validaciones:**
  - Evita egresos o registros de uso superiores al stock real remanente en bodega (impide stock físico negativo en base de datos).
  - Cantidad obligatoriamente superior a cero.
- **Almacenamiento:** Invoca los servicios de `BodegaService.ts` (100% libre de consultas directas `supabase.from()` en la vista) para persistir las operaciones de forma estructurada.

### C. Elementos Interactivos
- **Filtro de Proyecto:** ✅ *Operativo*. Filtra los materiales cargados en bodega para corresponder solo a la obra activa elegida.
- **Tabla de Existencias Reactiva:** ✅ *Operativo*. Visualiza stocks con códigos de colores semáforo y badges interactivos de alerta si se alcanza el stock mínimo configurado.

---

## 6. MÓDULO DE COMPRAS (PROVEEDORES Y ÓRDENES DE COMPRA)
* **Archivo de Vista:** `src/components/screens/ComprasScreen.tsx`
* **Servicios Lógicos:** `ProveedoresService.ts`, `OrdenesCompraService.ts`
* **Persistencia:** Tablas `proveedores`, `ordenes_compra`, `orden_compra_items`, `recepcion_oc`, `recepcion_oc_items` en Supabase.

### A. Lógica Funcional y Operativa
Garantiza el flujo logístico cerrado de adquisiciones. Desde el CRUD del proveedor, pasando por la creación de la Orden de Compra (OC), hasta el ingreso detallado y recepción de mercancías.

### B. Formularios de Gestión de Compras
- **Formulario de Proveedores:** Campos de NIT/RUT, razón social, dirección, teléfono y categoría. Valida formatos mediante expresiones regulares antes de persistir en `proveedores`.
- **Formulario de Orden de Compra (OC):** Permite ingresar proveedor, proyecto de entrega y un listado dinámico de ítems a cotizar con cantidad y costo de compra acordado. Genera de forma predeterminada folios automatizados únicos bajo el patrón `OC-YYYYMM-XXXXX` y persiste en `ordenes_compra` y sus registros relacionados.

### C. Elementos Interactivos
- **Grid de Ítems Dinámico:** ✅ *Operativo*. Permite crear, modificar y eliminar renglones de compra inline de forma interactiva al formular la OC.
- **Modal de Recepción Física (Entradas Parciales/Totales):** ✅ *Operativo*. Cuadrícula de recepción que permite ingresar las cantidades físicas que van llegando del proveedor, actualizando el estatus de la OC en cascada (`pendiente`, `recibida_parcial`, `recibida`) de manera autónoma e incrementando automáticamente el stock en bodega de fondo a través del servicio transaccional.

---

## 7. MÓDULO FINANCIERO (CAJA, TRANSACCIONES Y GANANCIA)
* **Archivo de Vista:** `src/components/screens/FinancieroScreen.tsx`
* **Sub-Componentes:** `ProfitReport.tsx`, `CashFlowProjection.tsx`
* **Servicios Lógicos:** `FinancieroService.ts`, `ConciliacionService.ts`, `CoreEngineService.ts`
* **Persistencia:** Tabla `transacciones` en Supabase con realtime.

### A. Lógica Funcional y Operativa
Lleva el control de cobros y pagos bancarios reales. Ofrece una proyección de flujos mensuales, reportes de ganancia real depurando gastos por categorías y utilidades operativas.

### B. Formulario de Registro de Transacciones
- **Campos:** *Proyecto Vinculado (Select), Tipo de Transacción (Ingreso/Gasto), Categoría, Monto (Numérico), Concepto, Fecha, Cuenta*.
- **Validaciones:** Monto requerido positivo mayor a cero. Validación de alerta automatizada para transacciones personales que puedan violar la regla de desvío del 80% de la utilidad bruta total.
- **Persistencia:** Tabla `transacciones`.

### C. Elementos Interactivos
- **Selector de Rango de Fechas / Filtros de Categoría:** ✅ *Operativo*. Filtra dinámicamente las gráficas financieras.
- **Proyección de Flujo Mensual (Pág. 1):** ✅ *Operativo / Unificado*. Lógica de proyección de caja a 30/60/90 días unificada en el `CoreEngineService.ts`.
- **Profit Report Interactivo (Pág. 2):** ✅ *Operativo*. Genera desglose de gastos en categorías operativas (materiales, MO, herramientas, subcontratos, transporte), administrativos (gastos fijos, oficina) y personales (retiros personales, gastos hogar). Calcula de forma interactiva el margen bruto y neto real del proyecto.
- **Panel de Conciliación Bancaria (Pág. 3):** ✅ *Operativo*. Checklist interactivo de transacciones que permite conciliar los montos con estados bancarios reales guardando el estado en BD mediante `ConciliacionService.ts`.

---

## 8. MÓDULO DE COTIZACIONES (LOCAL ANTEPROYECTOS)
* **Archivo de Vista:** `src/components/screens/CotizacionScreen.tsx`
* **Persistencia:** Almacenamiento local serializado JSON (`localStorage`).

### A. Lógica Funcional y Operativa
Permite formular cotizaciones de anteproyectos preliminares (topografía, planos, bosquejos) con precios globales y factores de descuento, permitiendo imprimirlos formalmente para presentación corporativa.

### B. Formulario de Cotización
- **Campos:** *Proyecto base (Select de presupuestos existentes), Cliente, Nombre del Proyecto, Descuento (%), Validez de cotización, Notas generales*.
- **Tabla Dinámica:** Permite rellenar un listado de ítems con categoría ( dropdown con 8 categorías predeterminadas), descripción personalizada, cantidad, unidad (default: 'Global') y precio unitario acordado.
- **Validaciones:** Campo "Cliente" obligatorio. Debe contener al menos un ítem con descripción para poder persistir.
- **Lógica de Persistencia:** Los datos se guardan serializados localmente en `localStorage` bajo la llave `'cotizaciones'` usando IDs dinámicos formateados con el patrón `COT-[Timestamp]-[Aleatorio]`.

### C. Elementos Interactivos
- **Botón "Nueva Cotización":** ✅ *Operativo*. Limpia y restablece los inputs del formulario a los 8 ítems base por categoría de anteproyecto estándar.
- **Botón de Impresión/PDF:** ✅ *Operativo*. Genera un formato imprimible con logotipos institucionales, desgloses financieros limpios y firmas autorizadas mediante el motor de impresión nativo de navegador.

---

## 9. MÓDULO DE APROBACIONES DE COMPRA (OCR)
* **Archivo de Vista:** `src/components/screens/AprobacionScreen.tsx`
* **Servicios Lógicos:** `OcrService.ts`, `AprobacionService.ts`
* **Persistencia:** Tabla `ocr_documentos` de Supabase.

### A. Lógica Funcional y Operativa
Recibe la colación de facturas procesadas con el motor OCR que están pendientes de validación administrativa. Al aprobarse, los montos y datos del emisor se consolidan formalmente como gastos oficiales del ERP.

### B. Campos y Control de Aprobación
- Muestra el listado de facturas en estado `'pendiente'`.
- Detalla el proveedor detectado, monto en Quetzales, fecha e introduce un panel desplegable de notas de rechazo de uso opcional/obligatorio según la acción a tomar.

### C. Elementos Interactivos
- **Acción "Aprobar" (Icono Check):** ✅ *Operativo*. Dispara confirmación visual, invoca `AprobacionService.approveDocument` e ingresa la factura procesada como transacción válida en base de datos.
- **Acción "Rechazar" (Icono XCircle):** ✅ *Operativo*. Despliega diálogo de retroalimentación donde se ingresa la justificación y cambia el estado del documento OCR a rechazado.

---

## 10. MÓDULO DE EQUIPOS Y COLABORADORES (TEAMS)
* **Archivo de Vista:** `src/components/screens/TeamsScreen.tsx`
* **Servicios Lógicos:** `EquiposService.ts`, `EmpleadoService.ts`
* **Persistencia:** Tablas `equipos` y `equipo_miembros` de Supabase con RLS estricto.

### A. Lógica Funcional y Operativa
Permite estructurar las cuadrillas de trabajo de los proyectos, conformando equipos, asignándoles encargados de obra, roles y controlando la plantilla.

### B. Elementos Interactivos y Formularios
- **Creador de Equipos:** Formulario interactivo mediante diálogos flotantes (`Dialog` de Shadcn).
- **Control de Miembros:** ✅ *Operativo*. Permite arrastrar, buscar y asignar miembros de la tabla de empleados como badges interactivos con botón de eliminación instantánea.

---

## 11. SISTEMAS TRANSVERSALES (SINCRO, PUSH Y NOTIFICACIONES)
* **Componentes UI:** `OfflineBanner.tsx`, `UpdateNotification.tsx`, `NotificationBell.tsx`, `OCRFactura.tsx`
* **Servicios Lógicos:** `offline.ts`, `PushService.ts`, `NotificacionesService.ts`

### A. Cola de Sincronización Fuera de Línea (`offline.ts`)
- ✅ *Operativo*. Monitorea la presencia de conexión a red en el navegador. Cuando se detecta desconexión, intercepta las mutaciones (C, U, D) y las encola de forma segura en `localStorage` (`addPendingMutation`). Al retornar la red, las procesa por lotes hacia Supabase de forma automatizada mediante el `SyncAggregator.ts` y despliega banners visuales con el estatus del volcado.

### B. Notificaciones Push y Alertas en Tiempo Real
- ✅ *Operativo*. Registra service workers en `main.tsx` para interceptar avisos push procedentes de transacciones de inventario, solicitudes de aprobación de compras o caídas de rentabilidad detectadas por el ERP.

---

## 🚥 DEUDA TÉCNICA E INVENTARIO DE REFINAMIENTO (Foco de Calidad)
Para iniciar nuestra fase de mejoras de estilo y estabilidad a grano fino, se tienen los siguientes focos identificados:

1. **Garantizar Integridad Referencial en Planilla (`PlanillaService`):**
   - Actualmente `registrarPago` hace un insert directo en transacciones financieras por el egreso de mano de obra, pero no comprueba que el `empleado_id` que se está enviando pertenezca a un colaborador real registrado en el ERP local.
2. **Encapsulamiento del Panel de Avance (`BitacoraAvancePanel.tsx`):**
   - Existen llamadas manuales dispersas que invocan `supabase.from()` en el componente visual para consultar registros diarios. Se deben mover en su totalidad hacia el `BitacoraAvanceService.ts` para cumplir el estándar de servicios definido en el `AGENTS.md`.
3. **Consolidación Estética de Formularios:**
   - Estandarizar inputs de validación, colores de advertencia de error y transiciones de animación CSS (`animate-fade-in-up`) en las vistas de creación secundaria (Proveedores, Equipos, Movimientos de Bodega) para garantizar una experiencia visual uniforme clase ejecutiva.
