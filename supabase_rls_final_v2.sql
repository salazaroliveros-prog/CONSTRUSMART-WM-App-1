-- Ejecutar manualmente las políticas para evitar errores de bucle PL/pgSQL
-- Eliminación de políticas antiguas
DROP POLICY IF EXISTS "Acceso propietario presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "Acceso propietario transacciones" ON transacciones;
DROP POLICY IF EXISTS "Acceso propietario clientes" ON clientes;
DROP POLICY IF EXISTS "Acceso propietario proyectos" ON proyectos;
DROP POLICY IF EXISTS "Acceso propietario equipos" ON equipos;
DROP POLICY IF EXISTS "Acceso propietario actividades" ON actividades;

-- Crear políticas simples que permiten acceso al dueño del user_id
CREATE POLICY "Acceso propietario presupuestos" ON presupuestos FOR ALL TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Acceso propietario transacciones" ON transacciones FOR ALL TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Acceso propietario clientes" ON clientes FOR ALL TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Acceso propietario proyectos" ON proyectos FOR ALL TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Acceso propietario equipos" ON equipos FOR ALL TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Acceso propietario actividades" ON actividades FOR ALL TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
