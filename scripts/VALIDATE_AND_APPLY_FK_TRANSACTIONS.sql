-- VALIDATE_AND_APPLY_FK_TRANSACTIONS.sql
-- Validation script and optional FK creation for `transacciones` UUID columns.
-- The script performs safe checks and provides commented FK statements to apply after manual review.

BEGIN;

-- 1) Add indices to speed checks
CREATE INDEX IF NOT EXISTS idx_transacciones_presupuesto_id_uuid ON public.transacciones(presupuesto_id_uuid);
CREATE INDEX IF NOT EXISTS idx_transacciones_proyecto_id_uuid ON public.transacciones(proyecto_id_uuid);
CREATE INDEX IF NOT EXISTS idx_transacciones_empleado_id_uuid ON public.transacciones(empleado_id_uuid);

-- 2) Report counts for manual inspection
-- a) transacciones that have textual proyecto_id but no proyecto_id_uuid
SELECT COUNT(*) AS missing_proyecto_uuid
FROM public.transacciones
WHERE proyecto_id IS NOT NULL AND proyecto_id_uuid IS NULL;

-- b) transacciones with proyecto_id_uuid not matching any proyectos
SELECT t.proyecto_id_uuid
FROM public.transacciones t
LEFT JOIN public.proyectos p ON p.id = t.proyecto_id_uuid
WHERE t.proyecto_id_uuid IS NOT NULL AND p.id IS NULL
LIMIT 50;

-- c) transacciones with empleado_id_uuid not matching empleados
SELECT t.empleado_id_uuid
FROM public.transacciones t
LEFT JOIN public.empleados e ON e.id = t.empleado_id_uuid
WHERE t.empleado_id_uuid IS NOT NULL AND e.id IS NULL
LIMIT 50;

-- d) transacciones with presupuesto_id_uuid not matching presupuestos
SELECT t.presupuesto_id_uuid
FROM public.transacciones t
LEFT JOIN public.presupuestos pr ON pr.id = t.presupuesto_id_uuid
WHERE t.presupuesto_id_uuid IS NOT NULL AND pr.id IS NULL
LIMIT 50;

-- 3) After manual inspection, if everything is correct you can enable FK constraints (commented for safety):

-- ALTER TABLE public.transacciones
--   ADD CONSTRAINT fk_trans_proyecto FOREIGN KEY (proyecto_id_uuid) REFERENCES public.proyectos(id) ON DELETE SET NULL;
--
-- ALTER TABLE public.transacciones
--   ADD CONSTRAINT fk_trans_presupuesto FOREIGN KEY (presupuesto_id_uuid) REFERENCES public.presupuestos(id) ON DELETE SET NULL;
--
-- ALTER TABLE public.transacciones
--   ADD CONSTRAINT fk_trans_empleado FOREIGN KEY (empleado_id_uuid) REFERENCES public.empleados(id) ON DELETE SET NULL;

COMMIT;

-- After enabling FKs, run application tests and ensure no runtime errors.
