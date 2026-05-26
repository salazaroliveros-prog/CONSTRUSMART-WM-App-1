-- =====================================================================
-- ERP_SCHEMA_FINAL.sql
-- Integración completa de todos los módulos, normalización de RLS y 
-- migración oficial de bitacora_avance al core.
-- =====================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNCIÓN DE SEGURIDAD (Rompe recursión)
CREATE OR REPLACE FUNCTION public.user_owns_equipo(p_equipo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public, auth'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipos
    WHERE id = p_equipo_id AND user_id = auth.uid()
  );
$$;

-- 3. MÓDULO BASE (Tablas principales)
CREATE TABLE IF NOT EXISTS public.clientes (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre        text NOT NULL,
  telefono      text,
  email         text,
  direccion     text,
  tipo_proyecto text DEFAULT 'Residencial',
  estado        text DEFAULT 'Potencial',
  notas         text,
  fecha         date DEFAULT CURRENT_DATE,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proyectos (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre            text NOT NULL,
  cliente           text,
  tipo              text,
  estado            text DEFAULT 'Planeación',
  presupuesto_total numeric DEFAULT 0,
  avance_fisico     numeric DEFAULT 0,
  avance_financiero numeric DEFAULT 0,
  ingresos          numeric DEFAULT 0,
  gastos            numeric DEFAULT 0,
  pendiente_aportar numeric DEFAULT 0,
  fecha_inicio      date,
  fecha_fin         date,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.presupuestos (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto               text NOT NULL,
  cliente                text,
  ubicacion              text,
  tipologia              text,
  fase                   text DEFAULT 'planeación',
  proyecto_id            text,
  factor_indirectos      numeric DEFAULT 12,
  factor_administrativos numeric DEFAULT 8,
  factor_imprevistos     numeric DEFAULT 5,
  factor_utilidad        numeric DEFAULT 15,
  lineas                 jsonb DEFAULT '[]'::jsonb,
  avance_fisico          numeric DEFAULT 0,
  avance_financiero      numeric DEFAULT 0,
  ingresos               numeric DEFAULT 0,
  gastos                 numeric DEFAULT 0,
  pendiente_aportar      numeric DEFAULT 0,
  total                  numeric DEFAULT 0,
  costo_directo          numeric DEFAULT 0,
  fecha_inicio           date,
  fecha_fin              date,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- 4. MÓDULO FINANCIERO / AVANCE
CREATE TABLE IF NOT EXISTS public.transacciones (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo           text NOT NULL,
  descripcion    text,
  cantidad       numeric DEFAULT 1,
  unidad         text,
  categoria      text,
  costo_unitario numeric DEFAULT 0,
  costo_total    numeric DEFAULT 0,
  fecha          date DEFAULT CURRENT_DATE,
  proyecto_id    text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bitacora_avance (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id  uuid NOT NULL REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  fecha           date DEFAULT CURRENT_DATE,
  avance          numeric NOT NULL DEFAULT 0,
  notas           text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.renglones (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo            text NOT NULL,
  descripcion       text NOT NULL,
  unidad            text,
  rendimiento_mo    numeric DEFAULT 0,
  costo_mo          numeric DEFAULT 0,
  costo_eq          numeric DEFAULT 0,
  materiales        jsonb DEFAULT '[]'::jsonb,
  mano_obra         jsonb DEFAULT '[]'::jsonb,
  equipos           jsonb DEFAULT '[]'::jsonb,
  created_at        timestamptz DEFAULT now()
);

-- 5. HABILITAR RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_avance ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS (Ejemplo de robustez)
CREATE POLICY "owner_only" ON public.clientes
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "owner_only_presupuestos" ON public.presupuestos
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "owner_only_transacciones" ON public.transacciones
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "owner_bitacora" ON public.bitacora_avance
  FOR ALL TO authenticated USING (auth.uid() = user_id);
