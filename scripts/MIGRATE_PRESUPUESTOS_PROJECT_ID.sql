-- MIGRATE_PRESUPUESTOS_PROJECT_ID.sql
-- Add uuid column to `presupuestos` to store proyectos as UUIDs and populate from textual campo `proyecto_id` when valid.
-- Run after ERP_SCHEMA_FINAL.sql and after backups.

BEGIN;

ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS proyecto_id_uuid uuid;

-- Populate proyecto_id_uuid if proyecto_id is a valid UUID string
UPDATE public.presupuestos
SET proyecto_id_uuid = (CASE WHEN proyecto_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN proyecto_id::uuid ELSE NULL END)
WHERE proyecto_id IS NOT NULL AND proyecto_id_uuid IS NULL;

-- Optional: if you are sure all proyecto_id_uuid values are correct and every non-null maps to an existing proyectos.id,
-- you can add a FK constraint. This step is commented out for safety; enable after manual verification.

-- ALTER TABLE public.presupuestos
--   ADD CONSTRAINT fk_presupuestos_proyecto FOREIGN KEY (proyecto_id_uuid) REFERENCES public.proyectos(id) ON DELETE SET NULL;

COMMIT;

-- Post-migration checks:
-- 1) SELECT COUNT(*) FROM public.presupuestos WHERE proyecto_id IS NOT NULL AND proyecto_id_uuid IS NULL; -- should be low/zero
-- 2) SELECT p.id, p.proyecto_id, p.proyecto_id_uuid FROM public.presupuestos p LIMIT 50;
-- 3) If you add the FK, test your app flows thoroughly.
