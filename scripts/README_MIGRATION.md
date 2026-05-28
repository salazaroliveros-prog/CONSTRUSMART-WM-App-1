Migración y verificación para `ERP_SCHEMA_FINAL.sql` y sincronización JSON→tablas

Resumen:
- `ERP_SCHEMA_FINAL.sql` crea tablas, índices y RLS para Supabase.
- `MIGRATE_JSON_TO_TABLES.sql` convierte `presupuestos.lineas` JSON embebido a filas normalizadas en:
  - `subrenglones`, `subrenglon_materiales`, `subrenglon_mano_obra`, `subrenglon_equipos`.
- El script añade columnas uuid suplementarias en `transacciones` (`presupuesto_id_uuid`, `proyecto_id_uuid`, `empleado_id_uuid`) y las popula cuando el value textual es un UUID válido.

Recomendaciones antes de ejecutar:
1. Hacer backup completo de la base de datos actual.
2. En Supabase SQL editor ejecutar `ERP_SCHEMA_FINAL.sql` si no está aplicado.
3. Revisar y, si procede, completar la implementación de funciones SECURITY DEFINER en el SQL (p. ej. `user_owns_presupuesto`).
4. Ejecutar `MIGRATE_JSON_TO_TABLES.sql` en un ambiente de staging primero.
5. Comprobar filas insertadas en tablas normalizadas y comparar sumas con los totales del presupuesto.
6. Regenerar tipos TypeScript: `supabase gen types typescript --local > src/types/supabase.ts`.
7. Ejecutar tests: `npm run test -- --run` y `npm run typecheck`.

Scripts adicionales disponibles:
  - `MIGRATE_PRESUPUESTOS_PROJECT_ID.sql` — agrega `proyecto_id_uuid` y popula desde `proyecto_id` textual cuando sea UUID.
  - `MIGRATE_MATERIALS_TO_PROJECT.sql` — agrega filas en `materiales_proyecto` agregando materiales desde `subrenglon_materiales`.
  - `VALIDATE_AND_APPLY_FK_TRANSACTIONS.sql` — validaciones y pasos para crear FKs en `transacciones` de forma segura.

Pasos sugeridos posteriores a la migración inicial:
 - 1) Ejecutar `scripts/MIGRATE_JSON_TO_TABLES.sql` en un ambiente de staging primero.
 - 2) Ejecutar `scripts/MIGRATE_PRESUPUESTOS_PROJECT_ID.sql` y `scripts/MIGRATE_MATERIALS_TO_PROJECT.sql` si procede.
 - 3) Ejecutar `scripts/VALIDATE_AND_APPLY_FK_TRANSACTIONS.sql` para validar y, tras inspección, aplicar FKs si procede.

Notas:
- El script `MIGRATE_JSON_TO_TABLES.sql` crea una función `migrate_presupuestos_lineas()` y por defecto no la ejecuta; ejecuta manualmente la llamada `SELECT public.migrate_presupuestos_lineas();` cuando estés listo.
- Si prefieres que ejecute la función automáticamente, descomenta la línea `SELECT public.migrate_presupuestos_lineas();` dentro del archivo `MIGRATE_JSON_TO_TABLES.sql`.

Contacto:
- Si quieres, puedo generar un script inverso para volver a embebir los subrenglones en el JSON del presupuesto.
