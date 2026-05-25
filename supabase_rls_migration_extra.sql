-- 1. Asegurar la existencia de user_id y team_id en tablas adicionales faltantes
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS team_id uuid DEFAULT auth.uid();
ALTER TABLE equipo_miembros ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- 2. Habilitar RLS en tablas adicionales
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipo_miembros ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para acceso de usuario (Owner-based access)
-- Equipos
DROP POLICY IF EXISTS "Acceso propietario equipos" ON equipos;
CREATE POLICY "Acceso propietario equipos" ON equipos FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Equipo Miembros
DROP POLICY IF EXISTS "Acceso propietario equipo_miembros" ON equipo_miembros;
CREATE POLICY "Acceso propietario equipo_miembros" ON equipo_miembros FOR ALL TO authenticated USING (auth.uid() = user_id);
