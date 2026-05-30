-- ==============================================
-- SCRIPT: Insertar 4 Proyectos de Prueba
-- Fecha: 30/05/2026
-- Propósito: Verificar comportamiento de la app
-- IMPORTANTE: Reemplazar el user_id con el usuario real antes de ejecutar
-- ==============================================

-- 1. Proyecto en PLANEACIÓN (sin avance)
INSERT INTO proyectos (
  user_id, nombre, cliente, tipo, estado,
  presupuesto_total, avance_fisico, avance_financiero,
  ingresos, gastos, pendiente_aportar,
  fecha_inicio, fecha_fin
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'CONSTRUCCIÓN RESIDENCIAL VISTA AL LAGO',
  'Carlos Méndez',
  'Residencial',
  'Planeación',
  250000.00,
  0, 0,
  0, 0, 250000,
  '2026-06-15', '2026-12-30'
);

-- 2. Proyecto en EJECUCIÓN (avance físico 70%, financiero 60%)
INSERT INTO proyectos (
  user_id, nombre, cliente, tipo, estado,
  presupuesto_total, avance_fisico, avance_financiero,
  ingresos, gastos, pendiente_aportar,
  fecha_inicio, fecha_fin
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'OFICINAS COMERCIALES ZONA 10',
  'Empresa Constructora XYZ',
  'Comercial',
  'Ejecución',
  500000.00,
  70, 60,
  300000, 250000, 200000,
  '2026-01-10', '2026-09-30'
);

-- 3. Proyecto en PAUSA (avance físico 80%, financiero 82%)
INSERT INTO proyectos (
  user_id, nombre, cliente, tipo, estado,
  presupuesto_total, avance_fisico, avance_financiero,
  ingresos, gastos, pendiente_aportar,
  fecha_inicio, fecha_fin
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'CENTRO COMERCIAL SAN MIGUEL',
  'Inversiones del Sur',
  'Comercial',
  'Parado',
  800000.00,
  80, 82,
  656000, 500000, 144000,
  '2025-11-01', '2026-08-15'
);

-- 4. Proyecto FINALIZADO (avance 100% ambos)
INSERT INTO proyectos (
  user_id, nombre, cliente, tipo, estado,
  presupuesto_total, avance_fisico, avance_financiero,
  ingresos, gastos, pendiente_aportar,
  fecha_inicio, fecha_fin
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'BODEGA INDUSTRIAL ZONA 14',
  'Logística Express',
  'Industrial',
  'Finalizado',
  350000.00,
  100, 100,
  350000, 320000, 0,
  '2025-06-01', '2026-02-28'
);