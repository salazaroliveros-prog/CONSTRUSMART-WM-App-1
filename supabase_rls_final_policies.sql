-- 1. Políticas RLS avanzadas que consideran user_id y equipo (team_id)
-- Ejecutar en el SQL Editor de Supabase:

DO $$ 
BEGIN
    -- Presupuestos: Acceso si eres dueño o miembro del equipo
    DROP POLICY IF EXISTS "Acceso propietario presupuestos" ON presupuestos;
    CREATE POLICY "Acceso propietario presupuestos" ON presupuestos FOR ALL TO authenticated 
    USING (auth.uid() = user_id OR team_id IN (SELECT equipo_id FROM equipo_miembros WHERE user_id = auth.uid()));

    -- Transacciones
    DROP POLICY IF EXISTS "Acceso propietario transacciones" ON transacciones;
    CREATE POLICY "Acceso propietario transacciones" ON transacciones FOR ALL TO authenticated 
    USING (auth.uid() = user_id OR team_id IN (SELECT equipo_id FROM equipo_miembros WHERE user_id = auth.uid()));

    -- Clientes
    DROP POLICY IF EXISTS "Acceso propietario clientes" ON clientes;
    CREATE POLICY "Acceso propietario clientes" ON clientes FOR ALL TO authenticated 
    USING (auth.uid() = user_id OR team_id IN (SELECT equipo_id FROM equipo_miembros WHERE user_id = auth.uid()));

    -- Proyectos
    DROP POLICY IF EXISTS "Acceso propietario proyectos" ON proyectos;
    CREATE POLICY "Acceso propietario proyectos" ON proyectos FOR ALL TO authenticated 
    USING (auth.uid() = user_id OR team_id IN (SELECT equipo_id FROM equipo_miembros WHERE user_id = auth.uid()));

    -- Equipos
    DROP POLICY IF EXISTS "Acceso propietario equipos" ON equipos;
    CREATE POLICY "Acceso propietario equipos" ON equipos FOR ALL TO authenticated 
    USING (auth.uid() = user_id OR id IN (SELECT equipo_id FROM equipo_miembros WHERE user_id = auth.uid()));
END $$;
