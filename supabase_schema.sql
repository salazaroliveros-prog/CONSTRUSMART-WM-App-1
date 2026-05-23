-- =====================================================================
-- ESQUEMA DE BASE DE DATOS OPTIMIZADO PARA SUPABASE
-- =====================================================================

-- Habilitar extensión para generar UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: clientes
CREATE TABLE public.clientes (
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

-- 2. TABLA: proyectos
CREATE TABLE public.proyectos (
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

-- 3. TABLA: transacciones
CREATE TABLE public.transacciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    tipo text NOT NULL, -- 'ingreso' o 'gasto'
    descripcion text,
    cantidad numeric DEFAULT 1,
    unidad text,
    categoria text,
    costo_unitario numeric DEFAULT 0,
    costo_total numeric DEFAULT 0,
    fecha date DEFAULT CURRENT_DATE,
    proyecto_id text, -- Se mantiene como text para soportar 'admin' o IDs de proyecto
    created_at timestamp with time zone DEFAULT now()
);

-- 4. TABLA: actividades
CREATE TABLE public.actividades (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL DEFAULT auth.uid(),
    titulo text NOT NULL,
    fecha date NOT NULL,
    hora text,
    descripcion text,
    created_at timestamp with time zone DEFAULT now()
);

-- =====================================================================
-- CONFIGURACIÓN DE SEGURIDAD A NIVEL DE FILA (RLS)
-- =====================================================================

-- Habilitar RLS en cada tabla
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir que cada usuario autenticado gestione SOLO sus propios datos

-- Políticas para 'clientes'
CREATE POLICY "Permitir CRUD de clientes propios" ON public.clientes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para 'proyectos'
CREATE POLICY "Permitir CRUD de proyectos propios" ON public.proyectos
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para 'transacciones'
CREATE POLICY "Permitir CRUD de transacciones propias" ON public.transacciones
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para 'actividades'
CREATE POLICY "Permitir CRUD de actividades propias" ON public.actividades
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
