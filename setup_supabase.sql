-- ====================================================================
-- SCRIPT DE INSTALACIÓN DE ESQUEMA EN PUBLIC - CONSTRUCTORA WM/M&S
-- ====================================================================
-- Este script crea las tablas del negocio en el esquema 'public', las asocia
-- a la tabla nativa de usuarios de Supabase ('auth.users') y configura RLS.
-- Ejecuta este script en el editor SQL de Supabase después de cleanup_supabase.sql.
-- ====================================================================

-- Habilitar la extensión UUID si aún no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CREACIÓN DE TABLAS

-- Tabla: Clientes
CREATE TABLE public.clientes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    telefono text,
    email text,
    direccion text,
    tipo_proyecto text,
    estado text DEFAULT 'Potencial', -- 'Potencial' | 'Activo' | 'Cerrado'
    notas text,
    fecha date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla: Proyectos
CREATE TABLE public.proyectos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    cliente text,
    tipo text,
    estado text DEFAULT 'Planeación', -- 'Ejecución' | 'Planeación'
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

-- Tabla: Transacciones
CREATE TABLE public.transacciones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo text NOT NULL, -- 'ingreso' | 'gasto'
    descripcion text,
    cantidad numeric DEFAULT 1,
    unidad text,
    categoria text,
    costo_unitario numeric DEFAULT 0,
    costo_total numeric DEFAULT 0,
    fecha date DEFAULT CURRENT_DATE,
    proyecto_id text, -- ID de proyecto o 'admin' para transacciones generales de oficina
    created_at timestamp with time zone DEFAULT now()
);

-- Tabla: Actividades
CREATE TABLE public.actividades (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    fecha date NOT NULL,
    hora text,
    descripcion text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. HABILITAR SEGURIDAD A NIVEL DE FILAS (RLS)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;

-- 3. CREACIÓN DE POLÍTICAS DE ACCESO (RLS POLICIES)
-- Permite que los usuarios autenticados realicen operaciones CRUD únicamente en sus propios datos.

-- Políticas para Clientes
CREATE POLICY clientes_owner ON public.clientes
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para Proyectos
CREATE POLICY proyectos_owner ON public.proyectos
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para Transacciones
CREATE POLICY transacciones_owner ON public.transacciones
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para Actividades
CREATE POLICY actividades_owner ON public.actividades
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Confirmación
SELECT 'Nuevo esquema y políticas creadas correctamente en el esquema public' AS estado;
