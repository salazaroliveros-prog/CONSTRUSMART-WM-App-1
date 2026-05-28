-- MIGRATE_MATERIALS_TO_PROJECT.sql
-- Aggregate materials from subrenglones into `materiales_proyecto` per presupuesto.
-- This helps the Bodega and Movimientos features that expect project-level material rows.

BEGIN;

-- Insert aggregated materials per presupuesto if not already present
WITH agg AS (
  SELECT
    s.presupuesto_id,
    sm.nombre,
    COALESCE(sm.unidad, 'unidad') AS unidad,
    SUM(sm.cantidad) AS cantidad_total,
    AVG(sm.costo_unitario) AS costo_unitario_avg
  FROM public.subrenglones s
  JOIN public.subrenglon_materiales sm ON sm.subrenglon_id = s.id
  GROUP BY s.presupuesto_id, sm.nombre, COALESCE(sm.unidad, 'unidad')
)
INSERT INTO public.materiales_proyecto(presupuesto_id, nombre, unidad, cantidad_estimada, cantidad_utilizada, costo_unitario, proveedor, created_at)
SELECT
  agg.presupuesto_id,
  agg.nombre,
  agg.unidad,
  agg.cantidad_total,
  0,
  COALESCE(ROUND(agg.costo_unitario_avg::numeric,2), 0),
  NULL,
  now()
FROM agg
LEFT JOIN public.materiales_proyecto mp ON mp.presupuesto_id = agg.presupuesto_id AND mp.nombre = agg.nombre
WHERE mp.id IS NULL;

COMMIT;

-- Post-migration checks:
-- SELECT COUNT(*) FROM materiales_proyecto WHERE presupuesto_id = '<some-uuid>';
-- Compare sums against subrenglon_materiales for a given presupuesto to validate.
