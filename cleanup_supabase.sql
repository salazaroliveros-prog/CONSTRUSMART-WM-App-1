-- ====================================================================
-- SCRIPT DE LIMPIEZA PARA SUPABASE - CONSTRUCTORA WM/M&S
-- ====================================================================
-- Este script elimina de forma segura tablas, políticas, RLS, esquemas 
-- y dependencias anteriores para dejar la base de datos limpia.
-- ====================================================================

-- 1. Deshabilitar temporalmente restricciones si es necesario y eliminar tablas en esquema public
DROP TABLE IF EXISTS public.actividades CASCADE;
DROP TABLE IF EXISTS public.transacciones CASCADE;
DROP TABLE IF EXISTS public.proyectos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;

-- 2. Eliminar tablas en el esquema legado/custom (si existe)
DROP TABLE IF EXISTS "prj_XGifn2wdU7K9".actividades CASCADE;
DROP TABLE IF EXISTS "prj_XGifn2wdU7K9".transacciones CASCADE;
DROP TABLE IF EXISTS "prj_XGifn2wdU7K9".proyectos CASCADE;
DROP TABLE IF EXISTS "prj_XGifn2wdU7K9".clientes CASCADE;

-- 3. Eliminar esquemas legados creados por herramientas externas
DROP SCHEMA IF EXISTS "prj_XGifn2wdU7K9" CASCADE;
DROP SCHEMA IF EXISTS "prj_XGifn2wdU7K9_auth" CASCADE;
DROP SCHEMA IF EXISTS "prj_XGifn2wdU7K9_storage" CASCADE;

-- 4. Confirmación de limpieza
SELECT 'Base de datos limpia y lista para recibir el nuevo esquema en el esquema public' AS estado;
