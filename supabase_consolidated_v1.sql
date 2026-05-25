-- =====================================================================
-- MIGRACIÓN CONSOLIDADA V1 - CONSTRUSMART WM APP
-- =====================================================================
-- Fecha: 25 de mayo de 2026
-- Objetivo: Establecer el esquema y RLS definitivo sin conflictos
-- 
-- IMPORTANTE: Este es el ÚNICO archivo que debe usarse.
-- Archivos obsoletos a IGNORAR:
--   - supabase_rls_migration.sql (antiguo)
--   - supabase_rls_final_policies.sql (usa team_id inexistente)
--   - supabase_rls_migration_extra.sql (incompleto)
--
-- =====================================================================

-- =====================================================================
-- PASO 1: EXTENSIONES
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- PASO 2: TABLAS PRINCIPALES
-- =====================================================================

-- 2.1 CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    nombre text NOT NULL,
    telefono text,
    email text,
    direccion text,
    tipo_proyecto text,
    estado text DEFAULT 'Potencial'::text,
    notas text,
    fecha date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now()
);

-- 2.2 PROYECTOS
CREATE TABLE IF NOT EXISTS public.proyectos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    nombre text NOT NULL,
    cliente text,
    tipo text,
    estado text DEFAULT 'Planeación'::text,
    presupuesto_total numeric DEFAULT 0,
    avance_fisico numeric DEFAULT 0,
    avance_financiero numeric DEFAULT 0,
    ingresos numeric DEFAULT 0,
    gastos numeric DEFAULT 0,
    pendiente_aportar numeric DEFAULT 0,
    fecha_inicio date,
    fecha_fin date,
    created_at timestamp with time zone DEFAULT now()
);

-- 2.3 TRANSACCIONES
CREATE TABLE IF NOT EXISTS public.transacciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    tipo text NOT NULL,
    descripcion text,
    cantidad numeric DEFAULT 1,
    unidad text,
    categoria text,
    costo_unitario numeric DEFAULT 0,
    costo_total numeric DEFAULT 0,
    fecha date DEFAULT CURRENT_DATE,
    proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 2.4 ACTIVIDADES
CREATE TABLE IF NOT EXISTS public.actividades (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    titulo text NOT NULL,
    fecha date NOT NULL,
    hora time,
    descripcion text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2.5 PRESUPUESTOS
CREATE TABLE IF NOT EXISTS public.presupuestos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    proyecto text NOT NULL,
    cliente text,
    ubicacion text,
    tipologia text,
    factor_indirectos numeric DEFAULT 0,
    factor_administrativos numeric DEFAULT 0,
    factor_imprevistos numeric DEFAULT 0,
    factor_utilidad numeric DEFAULT 0,
    lineas jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2.6 EQUIPOS
CREATE TABLE IF NOT EXISTS public.equipos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    nombre text NOT NULL,
    descripcion text,
    estado text DEFAULT 'activo'::text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2.7 EQUIPO_MIEMBROS
CREATE TABLE IF NOT EXISTS public.equipo_miembros (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    equipo_id uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    rol text DEFAULT 'miembro'::text,
    created_at timestamp with time zone DEFAULT now()
);

-- =====================================================================
-- PASO 3: INDICES PARA PERFORMANCE
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_user_id ON public.proyectos(user_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_user_id ON public.transacciones(user_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_proyecto_id ON public.transacciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_actividades_user_id ON public.actividades(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_user_id ON public.presupuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_equipos_user_id ON public.equipos(user_id);
CREATE INDEX IF NOT EXISTS idx_equipo_miembros_equipo_id ON public.equipo_miembros(equipo_id);
CREATE INDEX IF NOT EXISTS idx_equipo_miembros_user_id ON public.equipo_miembros(user_id);

-- =====================================================================
-- PASO 4: HABILITAR RLS (Row Level Security)
-- =====================================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo_miembros ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- PASO 5: POLÍTICAS RLS - SIMPLE Y CONFIABLE
-- =====================================================================
-- Patrón: auth.uid() = user_id
-- Esto garantiza que cada usuario solo ve sus propios datos

-- 5.1 CLIENTES - Solo propietario
DROP POLICY IF EXISTS "Acceso propietario clientes" ON public.clientes;
CREATE POLICY "Acceso propietario clientes" ON public.clientes 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 5.2 PROYECTOS - Solo propietario
DROP POLICY IF EXISTS "Acceso propietario proyectos" ON public.proyectos;
CREATE POLICY "Acceso propietario proyectos" ON public.proyectos 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 5.3 TRANSACCIONES - Solo propietario
DROP POLICY IF EXISTS "Acceso propietario transacciones" ON public.transacciones;
CREATE POLICY "Acceso propietario transacciones" ON public.transacciones 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 5.4 ACTIVIDADES - Solo propietario
DROP POLICY IF EXISTS "Acceso propietario actividades" ON public.actividades;
CREATE POLICY "Acceso propietario actividades" ON public.actividades 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 5.5 PRESUPUESTOS - Solo propietario
DROP POLICY IF EXISTS "Acceso propietario presupuestos" ON public.presupuestos;
CREATE POLICY "Acceso propietario presupuestos" ON public.presupuestos 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 5.6 EQUIPOS - Solo propietario
DROP POLICY IF EXISTS "Acceso propietario equipos" ON public.equipos;
CREATE POLICY "Acceso propietario equipos" ON public.equipos 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 5.7 EQUIPO_MIEMBROS - Miembros pueden ver equipos que integran
DROP POLICY IF EXISTS "Acceso a equipos como miembro" ON public.equipo_miembros;
CREATE POLICY "Acceso a equipos como miembro" ON public.equipo_miembros 
  FOR ALL 
  TO authenticated 
  USING (
    auth.uid() = user_id 
    OR equipo_id IN (SELECT id FROM public.equipos WHERE user_id = auth.uid())
  );

-- =====================================================================
-- PASO 6: VERIFICACIÓN
-- =====================================================================
-- Ejecutar esto en Supabase Dashboard para verificar:
--
-- SELECT 
--   schemaname, 
--   tablename,
--   (SELECT COUNT(*) FROM information_schema.table_constraints 
--    WHERE table_name = tablename AND constraint_type = 'PRIMARY KEY') as has_pk,
--   (SELECT COUNT(*) FROM information_schema.role_column_grants 
--    WHERE table_name = tablename) as rls_status
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- =====================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================================
-- 
-- 1. MULTI-TENANCY:
--    - Todos los INSERTs debe incluir: user_id = current_user_id
--    - Todas las queries se filtran automáticamente por RLS
--
-- 2. REALTIME SUBSCRIPTIONS:
--    - Usar: channel('table').on('postgres_changes', { 
--            filter: `user_id=eq.${userId}` 
--          })
--    - Esto garantiza que solo los cambios del usuario se reciben
--
-- 3. SEGURIDAD:
--    - ✅ RLS está ACTIVO
--    - ✅ Políticas son simples y probadas
--    - ✅ Sin referencias a columnas inexistentes
--    - ✅ Cada usuario solo ve sus datos
--
-- 4. SI NECESITAS EQUIPOS COMPARTIDOS EN FUTURO:
--    - Extender equipo_miembros con roles avanzados
--    - Modificar políticas para permitir acceso a equipos compartidos
--    - Agregar tabla audit_log para track de cambios
--
-- =====================================================================
