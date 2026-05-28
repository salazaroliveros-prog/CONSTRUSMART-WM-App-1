-- MIGRATE_SINGLE_PRESUPUESTO.sql
-- Función para migrar un solo presupuesto identificado por UUID desde su JSON `lineas` hacia tablas normalizadas.
-- Uso: SELECT public.migrate_presupuesto('<presupuesto_uuid>');

CREATE OR REPLACE FUNCTION public.migrate_presupuesto(p_presupuesto_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  pres RECORD;
  linea jsonb;
  sub jsonb;
  mat jsonb;
  mano jsonb;
  eq jsonb;
  subr_id uuid;
BEGIN
  SELECT id, lineas INTO pres FROM public.presupuestos WHERE id = p_presupuesto_id;
  IF NOT FOUND OR pres.lineas IS NULL THEN
    RAISE NOTICE 'Presupuesto % not found or has no lineas', p_presupuesto_id;
    RETURN;
  END IF;

  -- borrar previos subrenglones del presupuesto (y cascade child rows)
  DELETE FROM public.subrenglones WHERE presupuesto_id = p_presupuesto_id;

  FOR linea IN SELECT * FROM jsonb_array_elements(pres.lineas) LOOP
    sub := linea->'subrenglones';

    INSERT INTO public.subrenglones(
      presupuesto_id, renglon_id, codigo, descripcion, unidad, cantidad, rendimiento, costo_material_total, costo_mano_obra_total, costo_equipos_total, created_at, updated_at
    ) VALUES (
      p_presupuesto_id,
      CASE WHEN (linea->>'renglonId') ~ '^[0-9a-fA-F\-]{36}$' THEN (linea->>'renglonId')::uuid ELSE NULL END,
      COALESCE(linea->>'codigo', linea->>'codigoRenglon', ''),
      COALESCE(linea->>'descripcion', ''),
      COALESCE(linea->>'unidad', 'pza'),
      COALESCE((linea->>'cantidad')::numeric, 1),
      CASE WHEN (linea->>'rendimiento') IS NOT NULL THEN (linea->>'rendimiento')::numeric ELSE NULL END,
      0,0,0, now(), now()
    ) RETURNING id INTO subr_id;

    IF sub ? 'materiales' THEN
      FOR mat IN SELECT * FROM jsonb_array_elements(COALESCE(sub->'materiales', '[]'::jsonb)) LOOP
        INSERT INTO public.subrenglon_materiales(subrenglon_id, nombre, unidad, cantidad, costo_unitario, created_at)
        VALUES (subr_id, COALESCE(mat->>'nombre',''), COALESCE(mat->>'unidad','unidad'), COALESCE((mat->>'cantidad')::numeric,0), COALESCE((mat->>'costoUnitario')::numeric,0), now());
      END LOOP;
    END IF;

    IF sub ? 'manoObra' THEN
      FOR mano IN SELECT * FROM jsonb_array_elements(COALESCE(sub->'manoObra','[]'::jsonb)) LOOP
        INSERT INTO public.subrenglon_mano_obra(subrenglon_id, descripcion, cantidad_personas, jornal, rendimiento_especifico, costo_unidad, created_at)
        VALUES (subr_id, COALESCE(mano->>'descripcion',''), COALESCE((mano->>'cantidadPersonas')::numeric, COALESCE((mano->>'cantidad')::numeric,1)), COALESCE((mano->>'jornal')::numeric,0), CASE WHEN (mano->>'rendimientoEspecifico') IS NOT NULL THEN (mano->>'rendimientoEspecifico')::numeric ELSE NULL END, 0, now());
      END LOOP;
    END IF;

    IF sub ? 'equipos' THEN
      FOR eq IN SELECT * FROM jsonb_array_elements(COALESCE(sub->'equipos','[]'::jsonb)) LOOP
        INSERT INTO public.subrenglon_equipos(subrenglon_id, descripcion, cantidad, costo_hora, horas_uso, subtotal, created_at)
        VALUES (subr_id, COALESCE(eq->>'descripcion',''), COALESCE((eq->>'cantidad')::numeric,0), COALESCE((eq->>'costoHora')::numeric,0), COALESCE((eq->>'horasUso')::numeric,0), COALESCE((eq->>'cantidad')::numeric,0) * COALESCE((eq->>'costoHora')::numeric,0) * COALESCE((eq->>'horasUso')::numeric,1), now());
      END LOOP;
    END IF;

  END LOOP;

  RAISE NOTICE 'Migrated presupuesto %', p_presupuesto_id;
END;
$$;

-- Puedes ejecutar la migración para un presupuesto específico:
-- SELECT public.migrate_presupuesto('PUT-PRESUPUESTO-UUID-HERE');
