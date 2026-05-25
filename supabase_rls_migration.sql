-- 1. Asegurar la existencia de user_id en tablas críticas (donde falte)
ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- 2. Habilitar RLS en tablas principales
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS para acceso de usuario (Owner-based access)
DROP POLICY IF EXISTS "Acceso propietario presupuestos" ON presupuestos;
CREATE POLICY "Acceso propietario presupuestos" ON presupuestos FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acceso propietario transacciones" ON transacciones;
CREATE POLICY "Acceso propietario transacciones" ON transacciones FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acceso propietario clientes" ON clientes;
CREATE POLICY "Acceso propietario clientes" ON clientes FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acceso propietario proyectos" ON proyectos;
CREATE POLICY "Acceso propietario proyectos" ON proyectos FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acceso propietario actividades" ON actividades;
CREATE POLICY "Acceso propietario actividades" ON actividades FOR ALL TO authenticated USING (auth.uid() = user_id);
