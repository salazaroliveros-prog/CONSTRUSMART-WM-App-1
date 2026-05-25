# 🚀 PHASE 3 - SUPABASE SETUP GUIDE

## 📋 Resumen Ejecutivo

Este documento guía la configuración completa de la base de datos Phase 3 en Supabase. Incluye 7 nuevas tablas, Row-Level Security (RLS), triggers de auditoría y funciones auxiliares.

**Tiempo estimado:** 10-15 minutos  
**Complejidad:** Media  
**Requisitos:** Acceso a Supabase SQL Editor

---

## 🗂️ Estructura de Tablas Phase 3

```
cambios_presupuesto (Change Orders)
    ├─ Auditoría de cambios
    ├─ Workflow de aprobación
    └─ Impacto financiero

consumo_materiales (Material Traceability)
    ├─ Presupuestado vs. Real
    ├─ Detección de desperdicios
    └─ Variación de costos

caja_proyecto (Cash Management)
    ├─ Saldo del proyecto
    └─ Auditoría por movimiento

movimientos_caja (Movement Log)
    ├─ Ingresos/Egresos
    ├─ Reconciliación
    └─ Timestamps

checklists_proyecto (Quality Assurance)
    ├─ Por fase
    ├─ Tipología del proyecto
    └─ Bloqueo de avances

items_checklist (QA Items)
    ├─ Evidencia (fotos, firmas)
    ├─ Completación
    └─ Auditoría

transacciones_recurrentes (Cash Flow)
    ├─ Ingresos/Gastos recurrentes
    ├─ Frecuencia
    └─ Proyección
```

---

## 📝 INSTRUCCIONES DE EJECUCIÓN

### ⚠️ IMPORTANTE

1. **Ejecutar SECUENCIALMENTE** - No ejecutar todo de una vez
2. **Verificar cada sección** - Asegurar que no hay errores
3. **Hacer BACKUP** antes de iniciar (si es producción)
4. **Usar nueva sesión** - Abre una ventana SQL nueva en Supabase

---

## 🔧 PASO A PASO

### PASO 1️⃣: Abrir SQL Editor en Supabase

1. Inicia sesión en [supabase.com](https://supabase.com)
2. Selecciona tu proyecto CONSTRUSMART
3. Ve a **SQL Editor** (lado izquierdo)
4. Haz clic en **New Query**

---

### PASO 2️⃣: Crear Enumeraciones (ENUM Types)

**Archivo:** `SUPABASE_PHASE3_COMPLETE.sql` - SECCIÓN 1

```sql
-- Copiar SECCIÓN 1 completa
-- Incluye 5 ENUM types:
-- - cambio_estado
-- - checklist_estado
-- - fase_proyecto
-- - movimiento_subtipo
-- - frecuencia_transaccion
-- - frecuencia_pago
```

**Pasos:**
1. Abre [SUPABASE_PHASE3_COMPLETE.sql](./SUPABASE_PHASE3_COMPLETE.sql)
2. Selecciona **SECCIÓN 1** (líneas de ENUM)
3. Copia y pega en Supabase SQL Editor
4. Haz clic **Run** (botón azul)
5. **Espera confirmación:** "Query executed successfully" ✅

**Tiempo:** ~30 segundos

---

### PASO 3️⃣: Crear Tablas Principales

**Archivo:** `SUPABASE_PHASE3_COMPLETE.sql` - SECCIONES 2-8

Ejecutar en este ORDEN (una sección a la vez):

| Orden | Sección | Tabla | Comando |
|-------|---------|-------|---------|
| 1 | 2 | `cambios_presupuesto` | Copiar líneas 60-120 |
| 2 | 3 | `consumo_materiales` | Copiar líneas 140-200 |
| 3 | 4 | `caja_proyecto` | Copiar líneas 220-250 |
| 4 | 5 | `movimientos_caja` | Copiar líneas 270-330 |
| 5 | 6 | `checklists_proyecto` | Copiar líneas 350-400 |
| 6 | 7 | `items_checklist` | Copiar líneas 420-480 |
| 7 | 8 | `transacciones_recurrentes` | Copiar líneas 500-530 |

**Pasos para cada tabla:**
1. Copia la sección en el SQL Editor
2. Haz clic **Run**
3. Verifica: "Query executed successfully" ✅
4. Espera 5 segundos
5. Pasa a la siguiente tabla

**Tiempo:** ~2-3 minutos (todas las tablas)

---

### PASO 4️⃣: Crear Índices para Performance

**Archivo:** `SUPABASE_PHASE3_COMPLETE.sql` - SECCIÓN 9

```sql
-- Copia SECCIÓN 9 completa
-- Crea índices en todas las tablas para queries rápidas
```

**Pasos:**
1. Selecciona SECCIÓN 9
2. Copia y pega
3. Haz clic **Run**
4. Verifica: "Query executed successfully" ✅

**Tiempo:** ~30 segundos

---

### PASO 5️⃣: Habilitar Row-Level Security (RLS)

**Archivo:** `SUPABASE_PHASE3_COMPLETE.sql` - SECCIÓN 10

```sql
-- Habilita RLS en las 7 tablas nuevas
ALTER TABLE cambios_presupuesto ENABLE ROW LEVEL SECURITY;
-- ... más tablas
```

**Pasos:**
1. Selecciona SECCIÓN 10
2. Copia y pega
3. Haz clic **Run**
4. Verifica: "Query executed successfully" ✅

**Importancia:** Sin esto, CUALQUIERA puede ver datos de otros usuarios.

**Tiempo:** ~30 segundos

---

### PASO 6️⃣: Crear Políticas de Seguridad (RLS Policies)

**Archivo:** `SUPABASE_PHASE3_COMPLETE.sql` - SECCIONES 11-15

Ejecutar en orden (una sección a la vez):

| Sección | Tabla(s) |
|---------|----------|
| 11 | `cambios_presupuesto` |
| 12 | `consumo_materiales` |
| 13 | `caja_proyecto` + `movimientos_caja` |
| 14 | `checklists_proyecto` + `items_checklist` |
| 15 | `transacciones_recurrentes` |

**Pasos para cada sección:**
1. Copia la sección
2. Pega en SQL Editor
3. Haz clic **Run**
4. Espera confirmación ✅
5. Pasa a siguiente sección

**⚠️ Advertencia:** Si saltas este paso, el RLS no funcionará.

**Tiempo:** ~2-3 minutos

---

### PASO 7️⃣: Crear Funciones Auxiliares

**Archivo:** `SUPABASE_PHASE3_COMPLETE.sql` - SECCIÓN 16

```sql
-- Funciones para:
-- 1. Calcular saldo de caja en tiempo real
-- 2. Verificar si un checklist puede avanzar
```

**Pasos:**
1. Selecciona SECCIÓN 16
2. Copia y pega
3. Haz clic **Run**
4. Verifica: "Query executed successfully" ✅

**Tiempo:** ~30 segundos

---

### PASO 8️⃣: Crear Triggers de Auditoría

**Archivo:** `SUPABASE_PHASE3_COMPLETE.sql` - SECCIÓN 17

```sql
-- Triggers para actualizar automatically el campo updated_at
-- en todas las tablas
```

**Pasos:**
1. Selecciona SECCIÓN 17
2. Copia y pega
3. Haz clic **Run**
4. Verifica: "Query executed successfully" ✅

**Tiempo:** ~30 segundos

---

### PASO 9️⃣: Verificación Final

**Archivo:** `SUPABASE_PHASE3_COMPLETE.sql` - SECCIÓN 18

```sql
-- Verifica que todas las tablas fueron creadas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (...);
```

**Pasos:**
1. Selecciona SECCIÓN 18
2. Copia y pega
3. Haz clic **Run**
4. **Resultado esperado:** 7 filas
   - ✅ cambios_presupuesto
   - ✅ consumo_materiales
   - ✅ caja_proyecto
   - ✅ movimientos_caja
   - ✅ checklists_proyecto
   - ✅ items_checklist
   - ✅ transacciones_recurrentes

Si ves todas 7 tablas, ¡felicidades! 🎉

**Tiempo:** ~30 segundos

---

## ✅ Checklist de Verificación

Después de ejecutar todo, verifica:

- [ ] No hay errores rojos en la consola
- [ ] Las 7 tablas aparecen en **Database** → **Tables**
- [ ] Las enumeraciones aparecen en **Database** → **Types**
- [ ] RLS está habilitado (checkbox verde)
- [ ] Las políticas aparecen en cada tabla
- [ ] Verificación final muestra 7 tablas

---

## 🔗 Próximos Pasos

Después de crear las tablas en Supabase:

### 1️⃣ Regenerar tipos TypeScript

```bash
cd "APP PRESUPUESTOS Y CONTROL DE OBRAS Vol.5"
supabase gen types typescript --local > src/types/supabase.ts
```

### 2️⃣ Actualizar AppContext

Los hooks y servicios ya importan de `src/types/supabase.ts`. Si regeneras los tipos, todo se actualiza automáticamente.

### 3️⃣ Probar en el app

1. Abre la app
2. Ve a **Seguimiento y Control**
3. Verifica que los paneles cargan sin errores
4. Crea órdenes de cambio de prueba

---

## 🐛 Solución de Problemas

### ❌ Error: "Duplicate key value violates unique constraint"

**Causa:** Ya existe la tabla o el ENUM  
**Solución:** Ejecuta con `IF NOT EXISTS`

```sql
CREATE TABLE IF NOT EXISTS cambios_presupuesto (...)
CREATE TYPE IF NOT EXISTS cambio_estado AS ENUM (...)
```

### ❌ Error: "relation does not exist"

**Causa:** Falta una tabla que otra referencia  
**Solución:** Ejecuta las secciones en orden (no saltees)

### ❌ Error: "permission denied"

**Causa:** No tienes permisos en Supabase  
**Solución:** 
- Usa cuenta de admin
- Verifica que no estás en modo "Viewer"

### ❌ Las políticas RLS no funcionan

**Causa:** RLS no está habilitado  
**Solución:** Ejecuta SECCIÓN 10 (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)

---

## 📊 Estadísticas de Ejecución

| Componente | Tablas | Políticas | Triggers | Tiempo |
|-----------|--------|-----------|----------|--------|
| ENUM types | 6 | — | — | 30s |
| Tablas | 7 | — | — | 2-3m |
| Índices | 10+ | — | — | 30s |
| RLS Enable | — | — | — | 30s |
| Políticas | — | 15 | — | 2-3m |
| Funciones | 2 | — | — | 30s |
| Triggers | — | — | 6 | 30s |
| **Total** | **7** | **15** | **6** | **~10-12m** |

---

## 📚 Documentación Adicional

- [Supabase SQL Docs](https://supabase.com/docs/reference/sql)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🎯 Resumen Rápido

```bash
# Si lo prefieres, copiar TODO el archivo SUPABASE_PHASE3_COMPLETE.sql
# y pegar en Supabase SQL Editor de una vez (si el servidor lo permite)
# Pero es MÁS SEGURO ejecutar sección por sección
```

---

**¡Listo! Tu base de datos Phase 3 está completamente configurada.** 🚀

Ahora puedes ejecutar la app y usar todos los paneles de control, seguimiento y análisis.

---

*Documento generado: 2026-05-25*  
*CONSTRUSMART WM - Sistema de Gestión Integral*
