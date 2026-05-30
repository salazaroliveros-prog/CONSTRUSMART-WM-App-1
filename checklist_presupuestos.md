# 📋 Checklist de Desarrollo: Sistema de Presupuestos Automáticos
> **Estado del Proyecto:** En Desarrollo
> **Objetivo:** Crear una herramienta reactiva de alta precisión para costos directos, indirectos, APUs y tiempos.

---

## 🏗️ 1. Módulo de Cuantificación e Integración de APU
* [ ] **Desglose Matricial Automático:** Separar instantáneamente cada APU en Materiales, Mano de Obra, Maquinaria/Herramientas y Subcontratos.
* [ ] **Cálculo Automático del FSR:** Integrar de forma dinámica las prestaciones de ley, días no laborados y seguros sobre el salario base.
* [ ] **Cálculo de Rendimientos Inversos:** Permitir el ingreso de rendimientos (ej. $m^2/día$) y calcular automáticamente el costo por unidad.
* [ ] **Porcentaje de Herramienta Menor:** Aplicar automáticamente un % programable (3% al 5%) sobre el total de la mano de obra en cada APU.
* [ ] **Conversión de Unidades Inteligente:** Crear alertas de conversión si la unidad del APU difiere de la unidad de compra del proveedor.

---

## 📈 2. Motor de Ajuste y Actualización Constante de Precios
* [ ] **Sincronización API con Proveedores:** Conexión automática a bases de datos de proveedores locales o índices de cámaras de construcción.
* [ ] **Recálculo en Cascada (Efecto Dominó):** Al modificar un material base (ej. acero), actualizar automáticamente todos los APUs y proyectos vinculados.
* [ ] **Historial y Tendencias de Precios:** Registrar fluctuaciones en el tiempo para proyectar alzas inflacionarias.
* [ ] **Bloqueo de Precios por Proyecto:** Opción de "congelar" la base de precios de un presupuesto cuando pase a estado "Aprobado" o "Contratado".

---

## 💰 3. Costos Indirectos, Utilidades y Financiamiento
* [ ] **Distribución Prorrateada de Indirectos:** Cálculo automático de indirectos de oficina central y campo asignados proporcionalmente al costo directo.
* [ ] **Cálculo de Imprevistos y Utilidades:** Campos dinámicos para porcentajes de riesgo y margen de utilidad neta.
* [ ] **Cálculo de Financiamiento:** Evaluar tiempos de ejecución y anticipos para proyectar el flujo de caja teórico.
* [ ] **Cálculo de Impuestos Automatizado:** Aplicación del IVA y retenciones de ISR según la legislación correspondiente.

---

## ⏱️ 4. Programación de Tiempos Vinculada (Cronograma Dinámico)
* [ ] **Generación de Duración por Rendimiento:** Duración calculada automáticamente mediante la fórmula: `Cantidad de Obra / Rendimiento`.
* [ ] **Vínculo APU-Cronograma:** Al alterar una cantidad en el presupuesto, la barra del diagrama de Gantt debe ajustarse al milisegundo.
* [ ] **Cálculo de Cuadrillas Necesarias:** Definir el tiempo de entrega meta para que el sistema calcule el número de frentes de trabajo simultáneos requeridos.

---

## 🚀 5. Conectividad BIM, Arquitectura en Tiempo Real y Control (BI)
* [ ] **Vinculación IFC / BIM:** Importar archivos estándar 3D para extraer volúmenes de concreto, acero y muros directamente a los renglones.
* [ ] **Lector de Planos 2D con IA:** Visión por computadora para contar elementos y medir longitudes en planos PDF/DWG.
* [ ] **Sincronización Multi-Usuario (WebSockets):** Cambios reflejados instantáneamente entre pantallas de compras, ingeniería y presupuestos.
* [ ] **Modo Offline con Sincronización:** Almacenamiento local (IndexedDB) para trabajar en campo sin conexión y sincronizar al detectar red.
* [ ] **Análisis de Valor Ganado (EVM):** Módulo de ejecución para comparar el costo presupuestado vs el costo real de obra (Proyección de pérdidas/ganancias).
* [ ] **Fórmulas Polinómicas:** Algoritmo matemático para reajuste de precios bajo normativas de licitación pública y auditorías.

---

## 📊 6. Módulo de Reportes y Entregables
* [ ] **Reporte de Resumen de Renglones:** Vista jerárquica por capítulos con Código, Descripción, Unidad, Cantidad, P.U. (con indirectos) y Total.
* [ ] **Explosión de Materiales (Cantidades Absolutas):** Consolidado global de insumos netos para compras masivas y negociación de bodega.
* [ ] **Reporte de APU Detallado:** Desglose transparente por partida individual para revisión de supervisores o clientes.
* [ ] **Cronograma de Inversión Mensualizado:** Matriz financiera Curva S (Inversión vs Tiempo) exportable a Excel completamente formulado.