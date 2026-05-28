-- EMBED_SUBRENGLONES_FROM_TABLES.sql
-- Script to re-embed normalized subrenglones back into presupuestos.lineas JSON for a presupuesto.
-- Use with caution. Run in staging first.

CREATE OR REPLACE FUNCTION public.embed_subrenglones_into_presupuesto(p_presupuesto_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  sub RECORD;
  mat RECORD;
  mo RECORD;
  eq RECORD;
  new_lineas jsonb := '[]'::jsonb;
  linea jsonb;
BEGIN
  FOR sub IN SELECT * FROM public.subrenglones WHERE presupuesto_id = p_presupuesto_id ORDER BY created_at LOOP
    -- build materials array
    linea := jsonb_build_object(
      'codigo', COALESCE(sub.codigo, ''),
      'descripcion', COALESCE(sub.descripcion, ''),
      'unidad', COALESCE(sub.unidad, 'pza'),
      'cantidad', COALESCE(sub.cantidad, 1),
      'rendimiento', COALESCE(sub.rendimiento, NULL)
    );

    -- materiales
    linea := linea || jsonb_build_object('subrenglones', jsonb_build_object('materiales', '[]'::jsonb));
    FOR mat IN SELECT * FROM public.subrenglon_materiales WHERE subrenglon_id = sub.id ORDER BY created_at LOOP
      linea := jsonb_set(linea, '{subrenglones,materiales}', COALESCE(linea->'subrenglones'->'materiales','[]'::jsonb) || jsonb_build_object(
        'nombre', mat.nombre,
        'unidad', mat.unidad,
        'cantidad', mat.cantidad,
        'costoUnitario', mat.costo_unitario
      ));
    END LOOP;

    -- mano de obra
    linea := linea || jsonb_build_object('subrenglones', COALESCE(linea->'subrenglones','{}'::jsonb) || jsonb_build_object('manoObra','[]'::jsonb));
    FOR mo IN SELECT * FROM public.subrenglon_mano_obra WHERE subrenglon_id = sub.id ORDER BY created_at LOOP
      linea := jsonb_set(linea, '{subrenglones,manoObra}', COALESCE(linea->'subrenglones'->'manoObra','[]'::jsonb) || jsonb_build_object(
        'descripcion', mo.descripcion,
        'cantidadPersonas', mo.cantidad_personas,
        'jornal', mo.jornal,
        'rendimientoEspecifico', mo.rendimiento_especifico
      ));
    END LOOP;

    -- equipos
    linea := linea || jsonb_build_object('subrenglones', COALESCE(linea->'subrenglones','{}'::jsonb) || jsonb_build_object('equipos','[]'::jsonb));
    FOR eq IN SELECT * FROM public.subrenglon_equipos WHERE subrenglon_id = sub.id ORDER BY created_at LOOP
      linea := jsonb_set(linea, '{subrenglones,equipos}', COALESCE(linea->'subrenglones'->'equipos','[]'::jsonb) || jsonb_build_object(
        'descripcion', eq.descripcion,
        'cantidad', eq.cantidad,
        'costoHora', eq.costo_hora,
        'horasUso', eq.horas_uso
      ));
    END LOOP;

    new_lineas := new_lineas || linea;
  END LOOP;

  -- Update presupuesto.lineas
  UPDATE public.presupuestos SET lineas = new_lineas, updated_at = now() WHERE id = p_presupuesto_id;
END;
$$;

-- Uso:
-- SELECT public.embed_subrenglones_into_presupuesto('PUT-PRESUPUESTO-UUID-HERE');
