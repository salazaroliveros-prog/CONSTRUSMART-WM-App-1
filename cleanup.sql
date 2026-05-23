-- =====================================================================
-- SCRIPT DE LIMPIEZA PARA EL PROYECTO DE SUPABASE
-- =====================================================================

-- OPCIÓN A: Limpieza selectiva (Recomendada)
-- Borra únicamente las tablas que utiliza esta aplicación de presupuestos si es que existen.
-- Esto evitará conflictos con instalaciones previas.

DROP TABLE IF EXISTS public.actividades CASCADE;
DROP TABLE IF EXISTS public.transacciones CASCADE;
DROP TABLE IF EXISTS public.proyectos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;

-- =====================================================================
-- OPCIÓN B: Limpieza total (¡CUIDADO! Borra todo en el esquema público)
-- Si estabas usando el proyecto para algo completamente diferente y quieres 
-- vaciarlo por completo antes de subir este esquema, puedes descomentar 
-- las siguientes líneas y ejecutarlas.
-- =====================================================================

/*
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restablecer los permisos estándar del esquema público en Supabase
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
*/
