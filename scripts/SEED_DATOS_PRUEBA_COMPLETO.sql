-- =====================================================================
-- SEED_DATOS_PRUEBA_COMPLETO.sql
-- Inserta datos de prueba en TODAS las tablas de la aplicación
-- Ejecutar en el SQL Editor de Supabase
-- Fecha: 30/05/2026
-- =====================================================================

-- Obtener el user_id una sola vez
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users LIMIT 1;

  -- =============================================
  -- 1. PROVEEDORES
  -- =============================================
  INSERT INTO public.proveedores (user_id, nombre, contacto, telefono, email, direccion, rfc, notas) VALUES
    (uid, 'Cementos Progreso', 'Juan Carlos Méndez', '502-2345-6789', 'ventas@cementosprogreso.com', 'Zona 4, Ciudad de Guatemala', 'CP89012345', 'Proveedor principal de cemento y concreto'),
    (uid, 'Ferretería Industrial', 'María López', '502-4567-8901', 'pedidos@ferreteria.com', 'Zona 7, Ciudad de Guatemala', 'FI90123456', 'Herramientas y ferretería general'),
    (uid, 'Acero y Materials SA', 'Pedro García', '502-7890-1234', 'ventas@acerymaterials.com', 'Zona 12, Ciudad de Guatemala', 'AM01234567', 'Acero de refuerzo, varillas, mallas'),
    (uid, 'Pinturas Vulcan', 'Ana Martínez', '502-3456-7890', 'distribuidores@vulcan.com', 'Zona 9, Ciudad de Guatemala', 'PV23456789', 'Pinturas, selladores y acabados'),
    (uid, 'Hidráulicos del Norte', 'Carlos Ramírez', '502-6789-0123', 'ventas@hidraulicosnorte.com', 'Zona 18, Ciudad de Guatemala', 'HN34567890', 'Tubos, conexiones y accesorios hidráulicos'),
    (uid, 'Eléctricos Express', 'Luis Hernández', '502-9012-3456', 'pedidos@electricosexpress.com', 'Zona 5, Ciudad de Guatemala', 'EE45678901', 'Cableado, breakers, tableros eléctricos');

  -- =============================================
  -- 2. EMPLEADOS
  -- =============================================
  INSERT INTO public.empleados (user_id, nombre, puesto, telefono, salario_diario, activo) VALUES
    (uid, 'Roberto Méndez', 'Maestro de Obra', '502-5501-1001', 450.00, true),
    (uid, 'Francisco López', 'Albañil', '502-5501-1002', 350.00, true),
    (uid, 'Miguel Ángel García', 'Albañil', '502-5501-1003', 350.00, true),
    (uid, 'José Carlos Martínez', 'Electricista', '502-5501-1004', 400.00, true),
    (uid, 'Pedro Pablo Ramírez', 'Plomero', '502-5501-1005', 380.00, true),
    (uid, 'Andrés Gutiérrez', 'Soldador', '502-5501-1006', 420.00, true),
    (uid, 'Manuel Torres', 'Peón', '502-5501-1007', 200.00, true),
    (uid, 'Juan Pablo Herrera', 'Peón', '502-5501-1008', 200.00, true),
    (uid, 'Sandra Isabel Díaz', 'Administrativa', '502-5501-1009', 300.00, true),
    (uid, 'Carlos Eduardo Vásquez', 'Topógrafo', '502-5501-1010', 500.00, false);

  -- =============================================
  -- 3. PRESUPUESTOS (4 proyectos de prueba)
  -- =============================================
  INSERT INTO public.presupuestos (
    user_id, proyecto, cliente, tipologia, fase, total,
    avance_fisico, avance_financiero, ingresos, gastos, pendiente_aportar,
    factor_indirectos, factor_administrativos, factor_imprevistos, factor_utilidad,
    fecha_inicio, fecha_fin, ubicacion
  ) VALUES
    (uid, 'CONSTRUCCIÓN RESIDENCIAL VISTA AL LAGO', 'Carlos Méndez', 'residencial', 'planeación', 250000,
     0, 0, 0, 0, 250000, 15, 10, 5, 10, '2026-06-15', '2026-12-30', 'Lago de Atitlán, Sololá'),
    (uid, 'OFICINAS COMERCIALES ZONA 10', 'Empresa Constructora XYZ', 'comercial', 'ejecución', 500000,
     70, 60, 300000, 250000, 200000, 15, 10, 5, 10, '2026-01-10', '2026-09-30', 'Zona 10, Ciudad de Guatemala'),
    (uid, 'CENTRO COMERCIAL SAN MIGUEL', 'Inversiones del Sur', 'comercial', 'pausa', 800000,
     80, 82, 656000, 500000, 144000, 15, 10, 5, 10, '2025-11-01', '2026-08-15', 'San Miguel, Escuintla'),
    (uid, 'BODEGA INDUSTRIAL ZONA 14', 'Logística Express', 'industrial', 'finalizado', 350000,
     100, 100, 350000, 320000, 0, 15, 10, 5, 10, '2025-06-01', '2026-02-28', 'Zona 14, Ciudad de Guatemala');

  -- =============================================
  -- 4. MATERIALES POR PROYECTO
  -- =============================================
  -- Materiales para Proyecto 1: Residencial (Planeación)
  INSERT INTO public.materiales_proyecto (presupuesto_id, nombre, codigo, unidad, cantidad_estimada, costo_unitario, proveedor)
  SELECT p.id, v.nombre, v.codigo, v.unidad, v.cantidad, v.costo, v.proveedor
  FROM public.presupuestos p, (VALUES
    ('Cemento Portland 50kg', 'CEM-001', 'bolsa', 200, 120.00, 'Cementos Progreso'),
    ('Varilla #4 (12m)', 'VAR-004', 'pieza', 150, 285.00, 'Acero y Materials SA'),
    ('Arena de río', 'ARE-001', 'm³', 50, 850.00, 'Cementos Progreso'),
    ('Grava 3/4"', 'GRA-001', 'm³', 40, 900.00, 'Cementos Progreso'),
    ('Bloques de concreto 15x20x40', 'BLO-001', 'pieza', 3000, 18.50, 'Cementos Progreso'),
    ('Madera para cimbra 2x4', 'MAD-001', 'pieza', 100, 180.00, 'Ferretería Industrial'),
    ('Pintura vinílica blanca 19L', 'PIN-001', 'bote', 30, 850.00, 'Pinturas Vulcan'),
    ('Tubo PVC 4"', 'TUB-004', 'pieza', 60, 280.00, 'Hidráulicos del Norte'),
    ('Cable THW #12 (100m)', 'CAB-012', 'rollo', 20, 1800.00, 'Eléctricos Express'),
    ('Switch térmico 20A', 'SWE-020', 'pieza', 40, 185.00, 'Eléctricos Express')
  ) AS v(nombre, codigo, unidad, cantidad, costo, proveedor)
  WHERE p.proyecto = 'CONSTRUCCIÓN RESIDENCIAL VISTA AL LAGO';

  -- Materiales para Proyecto 2: Oficinas (Ejecución)
  INSERT INTO public.materiales_proyecto (presupuesto_id, nombre, codigo, unidad, cantidad_estimada, costo_unitario, proveedor)
  SELECT p.id, v.nombre, v.codigo, v.unidad, v.cantidad, v.costo, v.proveedor
  FROM public.presupuestos p, (VALUES
    ('Cemento Portland 50kg', 'CEM-001', 'bolsa', 500, 120.00, 'Cementos Progreso'),
    ('Varilla #3 (12m)', 'VAR-003', 'pieza', 200, 195.00, 'Acero y Materials SA'),
    ('Varilla #4 (12m)', 'VAR-004', 'pieza', 250, 285.00, 'Acero y Materials SA'),
    ('Malla electrosoldada 4x4', 'MAL-404', 'pieza', 80, 450.00, 'Acero y Materials SA'),
    ('Ventana de aluminio 1.20x1.20', 'VEN-ALU', 'pieza', 25, 3500.00, 'Ferretería Industrial'),
    ('Puerta interior de madera', 'PUE-MAD', 'pieza', 30, 2200.00, 'Ferretería Industrial'),
    ('Pintura epóxica 19L', 'PIN-EPO', 'bote', 15, 1200.00, 'Pinturas Vulcan'),
    ('Tubo conduit 3/4"', 'TUB-CON', 'pieza', 200, 85.00, 'Eléctricos Express'),
    ('Tomacorriente doble', 'TOM-DOB', 'pieza', 60, 120.00, 'Eléctricos Express'),
    ('Piso porcelánico 60x60', 'PIS-POR', 'm²', 800, 180.00, 'Ferretería Industrial')
  ) AS v(nombre, codigo, unidad, cantidad, costo, proveedor)
  WHERE p.proyecto = 'OFICINAS COMERCIALES ZONA 10';

  -- Materiales para Proyecto 3: CC San Miguel (Pausa)
  INSERT INTO public.materiales_proyecto (presupuesto_id, nombre, codigo, unidad, cantidad_estimada, costo_unitario, proveedor)
  SELECT p.id, v.nombre, v.codigo, v.unidad, v.cantidad, v.costo, v.proveedor
  FROM public.presupuestos p, (VALUES
    ('Cemento Portland 50kg', 'CEM-001', 'bolsa', 800, 120.00, 'Cementos Progreso'),
    ('Varilla #4 (12m)', 'VAR-004', 'pieza', 400, 285.00, 'Acero y Materials SA'),
    ('Perfil structural H-150', 'EST-H150', 'pieza', 60, 2800.00, 'Acero y Materials SA'),
    ('Panel SATE 120mm', 'PAN-SAT', 'm²', 2000, 95.00, 'Ferretería Industrial'),
    ('Mampara de vidrio 10mm', 'AMP-VID', 'm²', 500, 450.00, 'Ferretería Industrial'),
    ('Pintura látex exterior 19L', 'PIN-LAT', 'bote', 40, 780.00, 'Pinturas Vulcan')
  ) AS v(nombre, codigo, unidad, cantidad, costo, proveedor)
  WHERE p.proyecto = 'CENTRO COMERCIAL SAN MIGUEL';

  -- =============================================
  -- 5. TRANSACCIONES (ingresos y gastos)
  -- =============================================
  INSERT INTO public.transacciones (user_id, tipo, descripcion, cantidad, unidad, categoria, costo_unitario, costo_total, fecha, proyecto_id)
  SELECT uid, t.tipo, t.descripcion, t.cantidad, t.unidad, t.categoria, t.costo_unitario, t.costo_total, t.fecha::date, p.id
  FROM public.presupuestos p, (VALUES
    ('ingreso', 'Anticipo Cliente Oficinas', 1, 'global', 'administrativo', 150000, 150000, '2026-01-15', 'OFICINAS COMERCIALES ZONA 10'),
    ('ingreso', 'Pago Parcial Cliente Oficinas', 1, 'global', 'administrativo', 150000, 150000, '2026-03-15', 'OFICINAS COMERCIALES ZONA 10'),
    ('gasto', 'Compra de cemento proyecto oficinas', 500, 'bolsa', 'materiales', 120, 60000, '2026-01-20', 'OFICINAS COMERCIALES ZONA 10'),
    ('gasto', 'Compra de acero proyecto oficinas', 200, 'pieza', 'materiales', 285, 57000, '2026-02-01', 'OFICINAS COMERCIALES ZONA 10'),
    ('gasto', 'Planilla quincenal enero', 10, 'personas', 'mano-obra', 5700, 57000, '2026-01-31', 'OFICINAS COMERCIALES ZONA 10'),
    ('gasto', 'Planilla quincenal febrero', 10, 'personas', 'mano-obra', 5700, 57000, '2026-02-15', 'OFICINAS COMERCIALES ZONA 10'),
    ('gasto', 'Alquiler de grúa torre', 1, 'mes', 'herramienta', 15000, 15000, '2026-02-01', 'OFICINAS COMERCIALES ZONA 10'),
    ('gasto', 'Transporte de materiales', 5, 'viaje', 'transporte', 2500, 12500, '2026-02-10', 'OFICINAS COMERCIALES ZONA 10'),
    ('ingreso', 'Anticipo Centro Comercial', 1, 'global', 'administrativo', 400000, 400000, '2025-11-15', 'CENTRO COMERCIAL SAN MIGUEL'),
    ('ingreso', 'Pago 2 Centro Comercial', 1, 'global', 'administrativo', 256000, 256000, '2026-02-01', 'CENTRO COMERCIAL SAN MIGUEL'),
    ('gasto', 'Compra de materiales estructura CC', 1, 'lote', 'materiales', 200000, 200000, '2025-12-01', 'CENTRO COMERCIAL SAN MIGUEL'),
    ('gasto', 'Planilla general CC', 1, 'global', 'mano-obra', 180000, 180000, '2026-01-15', 'CENTRO COMERCIAL SAN MIGUEL'),
    ('gasto', 'Equipos y herramientas CC', 1, 'lote', 'herramienta', 120000, 120000, '2025-12-15', 'CENTRO COMERCIAL SAN MIGUEL'),
    ('ingreso', 'Pago completo Bodega Industrial', 1, 'global', 'administrativo', 350000, 350000, '2025-10-01', 'BODEGA INDUSTRIAL ZONA 14'),
    ('gasto', 'Materiales bodega', 1, 'lote', 'materiales', 150000, 150000, '2025-07-01', 'BODEGA INDUSTRIAL ZONA 14'),
    ('gasto', 'Mano de obra bodega', 1, 'global', 'mano-obra', 120000, 120000, '2025-09-01', 'BODEGA INDUSTRIAL ZONA 14'),
    ('gasto', 'Herramientas bodega', 1, 'lote', 'herramienta', 50000, 50000, '2025-07-15', 'BODEGA INDUSTRIAL ZONA 14')
  ) AS t(tipo, descripcion, cantidad, unidad, categoria, costo_unitario, costo_total, fecha, proyecto)
  WHERE p.proyecto = t.proyecto;

  -- =============================================
  -- 6. ÓRDENES DE COMPRA
  -- =============================================
  INSERT INTO public.ordenes_compra (user_id, folio, proveedor_id, fecha_emision, fecha_entrega, estatus, subtotal, iva, total, notas)
  SELECT uid, o.folio, pr.id, o.fecha_emision::date, o.fecha_entrega::date, o.estatus, o.subtotal, o.iva, o.total, o.notas
  FROM (VALUES
    ('OC-202601-00001', '2026-01-18', '2026-01-25', 'recibida', 60000, 7200, 67200, 'Cemento para proyecto oficinas'),
    ('OC-202602-00002', '2026-02-05', '2026-02-12', 'recibida', 57000, 6840, 63840, 'Acero y varillas proyecto oficinas'),
    ('OC-202602-00003', '2026-02-15', '2026-02-22', 'aprobada', 45000, 5400, 50400, 'Ventanas de aluminio'),
    ('OC-202603-00004', '2026-03-01', '2026-03-08', 'pendiente', 35000, 4200, 39200, 'Pinturas y acabados')
  ) AS o(folio, fecha_emision, fecha_entrega, estatus, subtotal, iva, total, notas)
  CROSS JOIN public.proveedores pr
  WHERE pr.user_id = uid
    AND pr.nombre = CASE
      WHEN o.folio = 'OC-202601-00001' THEN 'Cementos Progreso'
      WHEN o.folio = 'OC-202602-00002' THEN 'Acero y Materials SA'
      WHEN o.folio = 'OC-202602-00003' THEN 'Ferretería Industrial'
      WHEN o.folio = 'OC-202603-00004' THEN 'Pinturas Vulcan'
    END;

  -- =============================================
  -- 7. ITEMS DE ÓRDENES DE COMPRA
  -- =============================================
  INSERT INTO public.orden_compra_items (orden_compra_id, descripcion, cantidad, unidad, precio_unitario, importe, cantidad_recibida)
  SELECT oc.id, i.descripcion, i.cantidad, i.unidad, i.precio, i.importe, i.recibida
  FROM public.ordenes_compra oc, (VALUES
    ('OC-202601-00001', 'Cemento Portland 50kg', 500, 'bolsa', 120, 60000, 500),
    ('OC-202602-00002', 'Varilla #4 (12m)', 200, 'pieza', 285, 57000, 200),
    ('OC-202602-00003', 'Ventana de aluminio 1.20x1.20', 25, 'pieza', 1800, 45000, 0),
    ('OC-202603-00004', 'Pintura vinílica blanca 19L', 30, 'bote', 850, 25500, 0),
    ('OC-202603-00004', 'Pintura epóxica 19L', 10, 'bote', 950, 9500, 0)
  ) AS i(folio, descripcion, cantidad, unidad, precio, importe, recibida)
  WHERE oc.folio = i.folio;

  -- =============================================
  -- 8. ACTIVIDADES
  -- =============================================
  INSERT INTO public.actividades (user_id, titulo, fecha, hora, descripcion, presupuesto_id)
  SELECT uid, a.titulo, a.fecha::date, a.hora, a.descripcion, p.id
  FROM public.presupuestos p, (VALUES
    ('Reunión de planificación Residencial', '2026-06-10', '09:00', 'Definir alcance y cronograma del proyecto', 'CONSTRUCCIÓN RESIDENCIAL VISTA AL LAGO'),
    ('Entrega de planos ejecutivos', '2026-06-12', '14:00', 'Recibir planos del arquitecto', 'CONSTRUCCIÓN RESIDENCIAL VISTA AL LAGO'),
    ('Inspección de avance Oficinas', '2026-04-15', '10:00', 'Revisión de avance estructural nivel 3', 'OFICINAS COMERCIALES ZONA 10'),
    ('Reunión con cliente Oficinas', '2026-04-20', '11:00', 'Presentar avance y siguientes pasos', 'OFICINAS COMERCIALES ZONA 10'),
    ('Evaluación técnica CC San Miguel', '2026-03-15', '09:30', 'Evaluar estado de la obra suspendida', 'CENTRO COMERCIAL SAN MIGUEL'),
    ('Reunión con inversionistas CC', '2026-03-20', '15:00', 'Discutir reanudación del proyecto', 'CENTRO COMERCIAL SAN MIGUEL'),
    ('Entrega final Bodega', '2026-02-28', '10:00', 'Entrega formal del proyecto completado', 'BODEGA INDUSTRIAL ZONA 14'),
    ('Revisión post-venta Bodega', '2026-03-15', '09:00', 'Inspección de garantía', 'BODEGA INDUSTRIAL ZONA 14')
  ) AS a(titulo, fecha, hora, descripcion, proyecto)
  WHERE p.proyecto = a.proyecto;

  -- =============================================
  -- 9. BITÁCORA DE AVANCE
  -- =============================================
  INSERT INTO public.bitacora_avance (user_id, presupuesto_id, fecha, avance, notas)
  SELECT uid, p.id, b.fecha::date, b.avance, b.notas
  FROM public.presupuestos p, (VALUES
    ('OFICINAS COMERCIALES ZONA 10', '2026-01-31', 5, 'Inicio de cimentación'),
    ('OFICINAS COMERCIALES ZONA 10', '2026-02-28', 15, 'Estructura nivel 1 completada'),
    ('OFICINAS COMERCIALES ZONA 10', '2026-03-31', 35, 'Estructura niveles 2-3 en proceso'),
    ('OFICINAS COMERCIALES ZONA 10', '2026-04-30', 55, 'Estructura completada, iniciando acabados'),
    ('OFICINAS COMERCIALES ZONA 10', '2026-05-15', 70, 'Acabados interiores 70% completados'),
    ('CENTRO COMERCIAL SAN MIGUEL', '2025-12-31', 40, 'Estructura steel frame completada'),
    ('CENTRO COMERCIAL SAN MIGUEL', '2026-01-31', 65, 'Mamparas y muros completados'),
    ('CENTRO COMERCIAL SAN MIGUEL', '2026-02-28', 80, 'Obras complementarias en proceso. PROYECTO SUSPENDIDO.'),
    ('BODEGA INDUSTRIAL ZONA 14', '2025-08-31', 30, 'Estructura metálica montada'),
    ('BODEGA INDUSTRIAL ZONA 14', '2025-10-31', 70, 'Cubierta y muros completados'),
    ('BODEGA INDUSTRIAL ZONA 14', '2025-12-31', 95, 'Acabados y servicios completados'),
    ('BODEGA INDUSTRIAL ZONA 14', '2026-02-28', 100, 'Proyecto finalizado y entregado')
  ) AS b(proyecto, fecha, avance, notas)
  WHERE p.proyecto = b.proyecto;

  -- =============================================
  -- 10. CHECKLIST ITEMS
  -- =============================================
  INSERT INTO public.checklist_items (presupuesto_id, fase, item, completado)
  SELECT p.id, c.fase, c.item, c.completado
  FROM public.presupuestos p, (VALUES
    ('OFICINAS COMERCIALES ZONA 10', 'ejecución', 'Planos aprobados por municipio', true),
    ('OFICINAS COMERCIALES ZONA 10', 'ejecución', 'Licencia de construcción vigente', true),
    ('OFICINAS COMERCIALES ZONA 10', 'ejecución', 'Instalaciones sanitarias aprobadas', true),
    ('OFICINAS COMERCIALES ZONA 10', 'ejecución', 'Instalaciones eléctricas aprobadas', false),
    ('OFICINAS COMERCIALES ZONA 10', 'ejecución', 'Inspección estructural final', false),
    ('CENTRO COMERCIAL SAN MIGUEL', 'pausa', 'Revisión de seguridad actualizada', false),
    ('CENTRO COMERCIAL SAN MIGUEL', 'pausa', 'Actualización de planos as-built', false),
    ('BODEGA INDUSTRIAL ZONA 14', 'finalizado', 'Entrega de llaves al cliente', true),
    ('BODEGA INDUSTRIAL ZONA 14', 'finalizado', 'Manuales de mantenimiento entregados', true),
    ('BODEGA INDUSTRIAL ZONA 14', 'finalizado', 'Garantía registrada', true)
  ) AS c(proyecto, fase, item, completado)
  WHERE p.proyecto = c.proyecto;

  -- =============================================
  -- 11. NOTIFICACIONES
  -- =============================================
  INSERT INTO public.notificaciones (user_id, tipo, titulo, mensaje, leido) VALUES
    (uid, 'info', 'Bienvenido a CONSTRUSMART WM', 'Sistema configurado correctamente. Empieza creando tu primer proyecto.', true),
    (uid, 'exito', 'Proyecto finalizado', 'Bodega Industrial Zona 14 ha sido marcado como finalizado.', false),
    (uid, 'alerta', 'Proyecto pausado', 'Centro Comercial San MIGUEL está en pausa desde el 28/02/2026.', false),
    (uid, 'warning', 'OC pendiente de recepción', 'OC-202603-00004 (Pinturas Vulcan) está pendiente de recibir.', false),
    (uid, 'info', 'Nuevo proveedor registrado', 'Eléctricos Express agregado al catálogo de proveedores.', true),
    (uid, 'exito', 'Avance actualizado', 'Oficinas Comerciales Zona 10 alcanzó 70% de avance físico.', false);

END $$;

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'Seed completado exitosamente' AS resultado,
  (SELECT COUNT(*) FROM public.proveedores) AS proveedores,
  (SELECT COUNT(*) FROM public.empleados) AS empleados,
  (SELECT COUNT(*) FROM public.presupuestos) AS presupuestos,
  (SELECT COUNT(*) FROM public.materiales_proyecto) AS materiales,
  (SELECT COUNT(*) FROM public.transacciones) AS transacciones,
  (SELECT COUNT(*) FROM public.ordenes_compra) AS ordenes_compra,
  (SELECT COUNT(*) FROM public.orden_compra_items) AS oc_items,
  (SELECT COUNT(*) FROM public.actividades) AS actividades,
  (SELECT COUNT(*) FROM public.bitacora_avance) AS bitacora,
  (SELECT COUNT(*) FROM public.checklist_items) AS checklist,
  (SELECT COUNT(*) FROM public.notificaciones) AS notificaciones;