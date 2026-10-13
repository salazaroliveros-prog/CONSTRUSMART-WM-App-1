-- =====================================================================
-- SUPABASE_SCHEMA_CORREGIDO.sql
-- CONSTRUSMART WM - Esquema Simplificado y Corregido
--
-- Este SQL está optimizado para ejecutarse en un proyecto nuevo de Supabase
-- Sin DROP statements - solo CREATE
-- =====================================================================

-- =====================================================================
-- FASE 1: EXTENSIONES
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- FASE 2: FUNCIONES BASE
-- =====================================================================

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- FASE 3: TABLAS PRINCIPALES (orden correcto de dependencias)
-- =====================================================================

-- 3.1. clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono text,
  email text,
  direccion text,
  tipo_proyecto text DEFAULT 'Residencial',
  estado text DEFAULT 'Potencial',
  notas text,
  fecha date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.2. proyectos
CREATE TABLE IF NOT EXISTS public.proyectos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  cliente text,
  tipo text,
  estado text DEFAULT 'Planeación',
  presupuesto_total numeric DEFAULT 0,
  avance_fisico numeric DEFAULT 0,
  avance_financiero numeric DEFAULT 0,
  ingresos numeric DEFAULT 0,
  gastos numeric DEFAULT 0,
  pendiente_aportar numeric DEFAULT 0,
  fecha_inicio date,
  fecha_fin date,
  fase text,
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_proyectos_updated_at BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.3. proveedores
CREATE TABLE IF NOT EXISTS public.proveedores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  contacto text,
  telefono text,
  email text,
  direccion text,
  rfc text,
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_proveedores_updated_at BEFORE UPDATE ON public.proveedores FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.4. empleados
CREATE TABLE IF NOT EXISTS public.empleados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  documento text,
  telefono text,
  correo text,
  cargo text,
  salario_diario numeric,
  estado text DEFAULT 'activo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_empleados_updated_at BEFORE UPDATE ON public.empleados FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.5. renglones
CREATE TABLE IF NOT EXISTS public.renglones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo text NOT NULL UNIQUE,
  descripcion text NOT NULL,
  tipo_renglon text CHECK (tipo_renglon IN ('material','mano_obra','herramienta','transporte','otro')),
  unidad text,
  rendimiento numeric DEFAULT 1,
  costo_material numeric DEFAULT 0,
  costo_mano_obra numeric DEFAULT 0,
  costo_herramienta numeric DEFAULT 0,
  subrenglones jsonb DEFAULT '[]'::jsonb,
  materiales jsonb DEFAULT '[]'::jsonb,
  mano_obra jsonb DEFAULT '[]'::jsonb,
  equipos jsonb DEFAULT '[]'::jsonb,
  categoria text,
  etiquetas jsonb DEFAULT '[]'::jsonb,
  tipologia text,
  estimacion_tiempo numeric,
  dificultad text CHECK (dificultad IN ('baja','media','alta')),
  equipo_requerido jsonb DEFAULT '[]'::jsonb,
  notas text,
  favorito boolean DEFAULT false,
  frecuencia_uso numeric DEFAULT 0,
  ultimo_uso timestamptz,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_renglones_updated_at BEFORE UPDATE ON public.renglones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.6. presupuestos
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE CASCADE,
  proyecto text NOT NULL,
  cliente text,
  ubicacion text,
  tipologia text,
  fase text,
  factor_indirectos numeric,
  factor_administrativos numeric,
  factor_imprevistos numeric,
  factor_utilidad numeric,
  lineas jsonb,
  avance_fisico numeric,
  avance_financiero numeric,
  ingresos numeric,
  gastos numeric,
  pendiente_aportar numeric,
  total numeric,
  costo_directo numeric,
  area_construccion numeric DEFAULT 0,
  nivel_calidad text DEFAULT 'basico',
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_presupuestos_updated_at BEFORE UPDATE ON public.presupuestos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.7. equipos
CREATE TABLE IF NOT EXISTS public.equipos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  descripcion text,
  miembros_count integer DEFAULT 0,
  estado text DEFAULT 'activo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_equipos_updated_at BEFORE UPDATE ON public.equipos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.8. equipo_miembros
CREATE TABLE IF NOT EXISTS public.equipo_miembros (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipo_id uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol text DEFAULT 'miembro',
  created_at timestamptz DEFAULT now(),
  UNIQUE(equipo_id, user_id)
);

-- 3.9. materiales_proyecto
CREATE TABLE IF NOT EXISTS public.materiales_proyecto (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  presupuesto_id uuid REFERENCES public.presupuestos(id) ON DELETE CASCADE,
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  unidad text,
  cantidad numeric DEFAULT 0,
  costo_unitario numeric DEFAULT 0,
  proveedor_id uuid,
  estado text DEFAULT 'disponible',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_materiales_proyecto_updated_at BEFORE UPDATE ON public.materiales_proyecto FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.10. transacciones
CREATE TABLE IF NOT EXISTS public.transacciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE CASCADE,
  tipo text CHECK (tipo IN ('ingreso','gasto','ajuste')),
  monto numeric NOT NULL,
  categoria text,
  descripcion text,
  fecha date DEFAULT CURRENT_DATE,
  referencia text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_transacciones_updated_at BEFORE UPDATE ON public.transacciones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.11. actividades
CREATE TABLE IF NOT EXISTS public.actividades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  fecha_inicio date,
  fecha_fin date,
  estado text DEFAULT 'pendiente',
  responsable text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_actividades_updated_at BEFORE UPDATE ON public.actividades FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 3.12. notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  mensaje text,
  tipo text DEFAULT 'info' CHECK (tipo IN ('info','alerta','exito','warning')),
  leido boolean DEFAULT false,
  accion_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_notificaciones_updated_at BEFORE UPDATE ON public.notificaciones FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- =====================================================================
-- FASE 4: POLÍTICAS RLS (Row Level Security)
-- =====================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renglones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
CREATE POLICY "Users can view own clientes" ON public.clientes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clientes" ON public.clientes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clientes" ON public.clientes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clientes" ON public.clientes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para proyectos
CREATE POLICY "Users can view own proyectos" ON public.proyectos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proyectos" ON public.proyectos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proyectos" ON public.proyectos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own proyectos" ON public.proyectos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para proveedores
CREATE POLICY "Users can view own proveedores" ON public.proveedores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proveedores" ON public.proveedores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proveedores" ON public.proveedores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own proveedores" ON public.proveedores
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para empleados
CREATE POLICY "Users can view own empleados" ON public.empleados
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own empleados" ON public.empleados
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own empleados" ON public.empleados
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own empleados" ON public.empleados
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para renglones
CREATE POLICY "Users can view own renglones" ON public.renglones
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own renglones" ON public.renglones
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own renglones" ON public.renglones
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own renglones" ON public.renglones
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Políticas para presupuestos
CREATE POLICY "Users can view own presupuestos" ON public.presupuestos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presupuestos" ON public.presupuestos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presupuestos" ON public.presupuestos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presupuestos" ON public.presupuestos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para equipos
CREATE POLICY "Users can view own equipos" ON public.equipos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own equipos" ON public.equipos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own equipos" ON public.equipos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own equipos" ON public.equipos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para equipo_miembros
CREATE POLICY "Users can view own equipo_miembros" ON public.equipo_miembros
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own equipo_miembros" ON public.equipo_miembros
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own equipo_miembros" ON public.equipo_miembros
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para materiales_proyecto
CREATE POLICY "Users can view own materiales_proyecto" ON public.materiales_proyecto
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own materiales_proyecto" ON public.materiales_proyecto
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own materiales_proyecto" ON public.materiales_proyecto
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own materiales_proyecto" ON public.materiales_proyecto
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Políticas para transacciones
CREATE POLICY "Users can view own transacciones" ON public.transacciones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transacciones" ON public.transacciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transacciones" ON public.transacciones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transacciones" ON public.transacciones
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para actividades
CREATE POLICY "Users can view own actividades" ON public.actividades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actividades" ON public.actividades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actividades" ON public.actividades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own actividades" ON public.actividades
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para notificaciones
CREATE POLICY "Users can view own notificaciones" ON public.notificaciones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notificaciones" ON public.notificaciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notificaciones" ON public.notificaciones
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notificaciones" ON public.notificaciones
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================================
-- FIN
-- =====================================================================
