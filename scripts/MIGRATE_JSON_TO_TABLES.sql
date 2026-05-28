-- MIGRATE_JSON_TO_TABLES.sql
-- Script to migrate embedded JSON `presupuestos.lineas` into normalized tables:
-- - Inserts into public.subrenglones, subrenglon_materiales, subrenglon_mano_obra, subrenglon_equipos
-- - Adds supplemental uuid columns to `transacciones` to preserve typed relationships
-- Run this after applying `ERP_SCHEMA_FINAL.sql` and backing up the DB.

BEGIN;

-- 1) Add supplemental UUID columns to transacciones (safe, non-destructive)
ALTER TABLE public.transacciones
  ADD COLUMN IF NOT EXISTS presupuesto_id_uuid uuid;

ALTER TABLE public.transacciones
  ADD COLUMN IF NOT EXISTS proyecto_id_uuid uuid;

ALTER TABLE public.transacciones
  ADD COLUMN IF NOT EXISTS empleado_id_uuid uuid;

-- 2) Populate new UUID columns where existing text columns contain valid UUID strings
UPDATE public.transacciones
SET presupuesto_id_uuid = (CASE WHEN proyecto_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN proyecto_id::uuid ELSE NULL END)
WHERE presupuesto_id_uuid IS NULL AND proyecto_id IS NOT NULL;

UPDATE public.transacciones
SET proyecto_id_uuid = (CASE WHEN proyecto_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN proyecto_id::uuid ELSE NULL END)
WHERE proyecto_id_uuid IS NULL AND proyecto_id IS NOT NULL;

UPDATE public.transacciones
SET empleado_id_uuid = (CASE WHEN empleado_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN empleado_id::uuid ELSE NULL END)
WHERE empleado_id_uuid IS NULL AND empleado_id IS NOT NULL;

-- 3) Function to migrate presupuestos.lineas JSON into normalized rows
CREATE OR REPLACE FUNCTION public.migrate_presupuestos_lineas()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  pres RECORD;
  linea jsonb;
  sub jsonb;
  mat jsonb;
  mano jsonb;
  eq jsonb;
  subr_id uuid;
  costo_mat numeric := 0;
  costo_mo numeric := 0;
  costo_eq numeric := 0;
BEGIN
  FOR pres IN SELECT id, lineas FROM public.presupuestos WHERE lineas IS NOT NULL LOOP
    -- iterate each linea in the JSON array
    FOR linea IN SELECT * FROM jsonb_array_elements(pres.lineas) LOOP
      -- compute basic fields
      costo_mat := 0; costo_mo := 0; costo_eq := 0;
      sub := linea->'subrenglones';

      INSERT INTO public.subrenglones(
        presupuesto_id, renglon_id, codigo, descripcion, unidad, cantidad, rendimiento, costo_material_total, costo_mano_obra_total, costo_equipos_total, created_at, updated_at
      )
      VALUES (
        pres.id,
        CASE WHEN (linea->>'renglonId') ~ '^[0-9a-fA-F\-]{36}$' THEN (linea->>'renglonId')::uuid ELSE NULL END,
        COALESCE(linea->>'codigo', linea->>'codigoRenglon', ''),
        COALESCE(linea->>'descripcion', ''),
        COALESCE(linea->>'unidad', 'pza'),
        COALESCE((linea->>'cantidad')::numeric, 1),
        CASE WHEN (linea->>'rendimiento') IS NOT NULL THEN (linea->>'rendimiento')::numeric ELSE NULL END,
        0, 0, 0, now(), now()
      ) RETURNING id INTO subr_id;

      -- materials
      IF sub ? 'materiales' THEN
        FOR mat IN SELECT * FROM jsonb_array_elements(COALESCE(sub->'materiales', '[]'::jsonb)) LOOP
          BEGIN
            INSERT INTO public.subrenglon_materiales(subrenglon_id, nombre, unidad, cantidad, costo_unitario, created_at)
            VALUES (
              subr_id,
              COALESCE(mat->>'nombre', mat->>'nombreMaterial', ''),
              COALESCE(mat->>'unidad', 'un'),
              COALESCE((mat->>'cantidad')::numeric, 0),
              COALESCE((mat->>'costoUnitario')::numeric, 0),
              now()
            );
            costo_mat := costo_mat + COALESCE((mat->>'cantidad')::numeric, 0) * COALESCE((mat->>'costoUnitario')::numeric, 0);
          EXCEPTION WHEN others THEN
            RAISE NOTICE 'Error inserting material for presupuesto %, linea %: %', pres.id, linea, SQLERRM;
          END;
        END LOOP;
      END IF;

      -- mano de obra
      IF sub ? 'manoObra' THEN
        FOR mano IN SELECT * FROM jsonb_array_elements(COALESCE(sub->'manoObra', '[]'::jsonb)) LOOP
          BEGIN
            INSERT INTO public.subrenglon_mano_obra(subrenglon_id, descripcion, cantidad_personas, jornal, rendimiento_especifico, costo_unidad, created_at)
            VALUES (
              subr_id,
              COALESCE(mano->>'descripcion', ''),
              COALESCE((mano->>'cantidadPersonas')::numeric, COALESCE((mano->>'cantidad')::numeric, 1)),
              COALESCE((mano->>'jornal')::numeric, 0),
              CASE WHEN (mano->>'rendimientoEspecifico') IS NOT NULL THEN (mano->>'rendimientoEspecifico')::numeric ELSE NULL END,
              0,
              now()
            );
            costo_mo := costo_mo + COALESCE((mano->>'cantidadPersonas')::numeric, COALESCE((mano->>'cantidad')::numeric, 1)) * COALESCE((mano->>'jornal')::numeric, 0);
          EXCEPTION WHEN others THEN
            RAISE NOTICE 'Error inserting manoObra for presupuesto %, linea %: %', pres.id, linea, SQLERRM;
          END;
        END LOOP;
      END IF;

      -- equipos
      IF sub ? 'equipos' THEN
        FOR eq IN SELECT * FROM jsonb_array_elements(COALESCE(sub->'equipos', '[]'::jsonb)) LOOP
          BEGIN
            INSERT INTO public.subrenglon_equipos(subrenglon_id, descripcion, cantidad, costo_hora, horas_uso, subtotal, created_at)
            VALUES (
              subr_id,
              COALESCE(eq->>'descripcion', ''),
              COALESCE((eq->>'cantidad')::numeric, 0),
              COALESCE((eq->>'costoHora')::numeric, COALESCE((eq->>'costo_hora')::numeric, 0)),
              COALESCE((eq->>'horasUso')::numeric, COALESCE((eq->>'horas_uso')::numeric, 0)),
              COALESCE((eq->>'cantidad')::numeric, 0) * COALESCE((eq->>'costoHora')::numeric, 0) * COALESCE((eq->>'horasUso')::numeric, 1),
              now()
            );
            costo_eq := costo_eq + COALESCE((eq->>'cantidad')::numeric, 0) * COALESCE((eq->>'costoHora')::numeric, 0) * COALESCE((eq->>'horasUso')::numeric, 1);
          EXCEPTION WHEN others THEN
            RAISE NOTICE 'Error inserting equipo for presupuesto %, linea %: %', pres.id, linea, SQLERRM;
          END;
        END LOOP;
      END IF;

      -- update totals on subrenglones row
      UPDATE public.subrenglones SET costo_material_total = costo_material_total + costo_mat,
        costo_mano_obra_total = costo_mano_obra_total + costo_mo,
        costo_equipos_total = costo_equipos_total + costo_eq,
        updated_at = now()
      WHERE id = subr_id;

    END LOOP; -- linea
  END LOOP; -- pres
END;
$$;

-- Execute migration function (comment this out if you prefer to run manually)
-- SELECT public.migrate_presupuestos_lineas();

COMMIT;

-- NOTES:
-- 1) Review the inserted rows and run tests.
-- 2) After verification you may opt to drop old text-id columns or rename the new uuid columns.
-- 3) Backups are strongly recommended before running in production.
