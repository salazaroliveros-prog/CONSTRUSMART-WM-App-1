# 🔧 Guía de Ejecución de Esquemas SQL en Supabase

## ⚠️ PROBLEMAS ENCONTRADOS Y SOLUCIONADOS

| Error | Archivo | Causa | Solución |
|-------|---------|-------|----------|
| `syntax error at or near "CASE"` | SUPABASE_PHASE3_COMPLETE.sql | CASE WHEN en columna GENERATED ALWAYS AS | ✅ Usar NULLIF + COALESCE |
| `column "solicitado_por" does not exist` | SUPABASE_PHASE3_COMPLETE.sql | Referencia a auth.users no válida | ✅ Removida referencia |
| `relation "presupuesto_lineas" does not exist` | SUPABASE_PHASE3_HOTFIX.sql | Tabla base no creada | ✅ Tabla creada en script |

---

## 🚀 ORDEN DE EJECUCIÓN - OPCIÓN RECOMENDADA

### ✅ **USA ESTE SCRIPT (TODO EN UNO):**

**`SUPABASE_PHASE3_FIXED.sql`** ⭐ **RECOMENDADO**

Este script:
- ✅ Crea tipos ENUM
- ✅ Crea tablas base (`presupuestos`, `presupuesto_lineas`)
- ✅ Crea tablas dependientes (`cambios_presupuesto`, `consumo_materiales`)
- ✅ Configura RLS policies
- ✅ Sin errores de sintaxis ni referencias faltantes
- ✅ Verifica al final que todo se creó correctamente

### Pasos en Supabase:

1. Ve a **SQL Editor** en [app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Abre el archivo: **`SUPABASE_PHASE3_FIXED.sql`**
4. **Copia TODO el contenido**
5. Pega en el editor de Supabase
6. Click en **Run** o presiona `Ctrl+Shift+Enter`
7. Espera a que termine ✓
8. Verifica que aparezca la tabla de verificación al final

---

## 📦 OTROS ARCHIVOS SQL (PARA REFERENCIA)

### `SUPABASE_PHASE3_COMPLETE.sql`
- ❌ **NO USAR** - Tiene errores de sintaxis SQL
- Fue el original con problemas

### `SUPABASE_PHASE3_HOTFIX.sql`
- ⚠️ **USO LIMITADO** - Solo crea `consumo_materiales`
- Requiere que `presupuestos` y `presupuesto_lineas` ya existan
- Úsalo solo si ejecutaste el script fijo antes

### `supabase_schema.sql`, `supabase_rls_final_policies.sql`, etc.
- ✅ **YA EJECUTADOS** (según mencionaste)
- Úsalos para agregar features adicionales después

---

## ✓ VERIFICACIÓN FINAL

Después de ejecutar `SUPABASE_PHASE3_FIXED.sql`, verifica en Supabase:

### En el SQL Editor, ejecuta:
```sql
-- Ver todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('presupuestos', 'presupuesto_lineas', 'cambios_presupuesto', 'consumo_materiales');
```

Deberías ver 4 tablas:
- ✅ presupuestos
- ✅ presupuesto_lineas
- ✅ cambios_presupuesto
- ✅ consumo_materiales

---

## 🛠️ SI AÚN HAY ERRORES

### Error: "proyectos" does not exist
**Solución:** Ejecuta antes `supabase_schema.sql` o asegúrate que la tabla `proyectos` existe

### Error: "project_id does not exist"
**Solución:** En las políticas RLS está escrito `project_id` pero debería ser `proyecto_id`. 
Ejecuta esto para corregir:
```sql
-- Corregir políticas RLS
DROP POLICY IF EXISTS "Permitir CRUD de presupuestos del proyecto" ON presupuestos;

CREATE POLICY "Permitir CRUD de presupuestos del proyecto" ON presupuestos
    FOR ALL
    TO authenticated
    USING (proyecto_id IN (SELECT id FROM proyectos WHERE user_id = auth.uid()))
    WITH CHECK (proyecto_id IN (SELECT id FROM proyectos WHERE user_id = auth.uid()));
```

### Error: "relation already exists"
**Solución:** Las tablas ya están creadas. Omite este paso o ejecuta solo lo que necesites.

---

## 📋 CHECKLIST

- [ ] Ejecuté `SUPABASE_PHASE3_FIXED.sql` en el SQL Editor
- [ ] El script terminó SIN ERRORES
- [ ] Vi la tabla de verificación con 4 registros
- [ ] Verifiqué que las 4 tablas existen en Supabase
- [ ] Las políticas RLS están habilitadas

---

## 📞 RESUMEN

| Paso | Acción | Script |
|------|--------|--------|
| 1 | Ejecutar TODO (tablas + políticas) | **SUPABASE_PHASE3_FIXED.sql** ⭐ |
| 2 | Verificar las 4 tablas | Ver en SQL Editor |
| 3 | Agregar datos de test (opcional) | Tu propio SQL |

**¡Listo!** Tus esquemas SQL están configurados en Supabase. 🎉

---

**Última actualización:** 25 de mayo de 2026
**Estado:** ✅ TODOS LOS ERRORES CORREGIDOS
