-- 1. Políticas RLS sólidas y alineadas con el esquema actual de la app
-- Usa user_id para acceso de dueño y evita condiciones recursivas en equipos / equipo_miembros
-- Ejecutar en el SQL Editor de Supabase:

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Acceso propietario presupuestos" ON presupuestos;
    CREATE POLICY "Acceso propietario presupuestos" ON presupuestos FOR ALL TO authenticated 
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Acceso propietario transacciones" ON transacciones;
    CREATE POLICY "Acceso propietario transacciones" ON transacciones FOR ALL TO authenticated 
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Acceso propietario clientes" ON clientes;
    CREATE POLICY "Acceso propietario clientes" ON clientes FOR ALL TO authenticated 
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Acceso propietario proyectos" ON proyectos;
    CREATE POLICY "Acceso propietario proyectos" ON proyectos FOR ALL TO authenticated 
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Acceso propietario equipos" ON equipos;
    CREATE POLICY "Acceso propietario equipos" ON equipos FOR ALL TO authenticated 
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Acceso propietario equipo_miembros" ON equipo_miembros;
    CREATE POLICY "Acceso propietario equipo_miembros" ON equipo_miembros FOR ALL TO authenticated 
    USING (
      auth.uid() = user_id OR
      equipo_id IN (SELECT id FROM public.equipos WHERE user_id = auth.uid())
    );
END $$;
