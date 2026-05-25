-- Asegurar que la tabla equipos exista y tenga los campos necesarios
CREATE TABLE IF NOT EXISTS public.equipos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    creador_id uuid REFERENCES auth.users(id),
    user_id uuid DEFAULT auth.uid(),
    created_at timestamptz DEFAULT now()
);

-- Asegurar que la tabla equipo_miembros exista
CREATE TABLE IF NOT EXISTS public.equipo_miembros (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    equipo_id uuid REFERENCES public.equipos(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    rol text CHECK (rol IN ('admin', 'miembro', 'visor')),
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en estas nuevas tablas
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo_miembros ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para Equipos
DROP POLICY IF EXISTS "Acceso propietario equipos" ON public.equipos;
CREATE POLICY "Acceso propietario equipos" ON public.equipos 
FOR ALL TO authenticated 
USING (auth.uid() = user_id OR id IN (SELECT equipo_id FROM public.equipo_miembros WHERE user_id = auth.uid()));

-- Políticas de Seguridad para Miembros
DROP POLICY IF EXISTS "Acceso propietario equipo_miembros" ON public.equipo_miembros;
CREATE POLICY "Acceso propietario equipo_miembros" ON public.equipo_miembros 
FOR ALL TO authenticated 
USING (auth.uid() = user_id OR equipo_id IN (SELECT id FROM public.equipos WHERE user_id = auth.uid()));
