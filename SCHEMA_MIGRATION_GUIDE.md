# 🚀 Supabase Schema Migration Guide - Phase 3

## ✅ Problema Resuelto

Los scripts anteriores fallaban porque:
- ❌ Intentaban recriar tablas que ya existen
- ❌ Referenciaban estructuras que no coincidían con el schema actual
- ❌ Usaban sintaxis SQL no compatible con Supabase

## ✅ Solución

**`SUPABASE_IMPROVEMENTS.sql`** ⭐ **USA ESTE AHORA**

Este script:
- ✅ Agrega mejoras a tablas EXISTENTES sin eliminar datos
- ✅ Crea SOLO nuevas tablas complementarias
- ✅ Es compatible con tu schema actual
- ✅ Agrega enumeraciones, índices y RLS correctamente
- ✅ Crea vistas útiles para queries complejas

---

## 📋 Qué Hace Este Script

### **Tablas Mejoradas (agregan columnas):**
1. **cambios_presupuesto** - Mejores campos de auditoría
2. **materiales_proyecto** - Trazabilidad de consumo y desperdicio
3. **checklist_items** - Mejor control de calidad
4. **presupuestos** - Mejor seguimiento de estado
5. **bitacora_avance** - Mejor auditoría de avance
6. **conciliaciones** - Campos adicionales para reconciliación
7. **notificaciones** - Prioridades y referencias

### **Nuevas Tablas (complementarias):**
1. **caja_proyecto** - Gestión de saldos de proyecto
2. **movimientos_caja** - Detalle de movimientos de caja
3. **transacciones_recurrentes** - Para proyecciones de cash flow

### **Nuevas Vistas (para queries útiles):**
1. **v_presupuestos_resumen** - Resumen completo de presupuestos
2. **v_caja_resumen** - Resumen de saldos
3. **v_materiales_alertas** - Materiales con alertas activas

### **Mejoras Adicionales:**
- ✅ Enumeraciones (ENUM types)
- ✅ Índices optimizados para performance
- ✅ Políticas RLS de seguridad
- ✅ Triggers automáticos para auditoría

---

## 🚀 Cómo Ejecutar

### **Opción 1: Vía Supabase UI (Recomendado)**

1. Ve a [app.supabase.com](https://app.supabase.com) → Tu Proyecto
2. Abre **SQL Editor** (botón izquierdo)
3. Click en **New Query**
4. Copia TODO el contenido de: **`SUPABASE_IMPROVEMENTS.sql`**
5. Pega en el editor
6. Click en **RUN** (o `Ctrl+Shift+Enter`)
7. Espera a que termine ✓

### **Opción 2: Vía CLI de Supabase**

```bash
cd "c:\Users\wilso\Documents\APPS\APP PRESUPUESTOS Y CONTROL DE OBRAS Vol.5"
supabase db push SUPABASE_IMPROVEMENTS.sql
```

### **Opción 3: Ejecución Parcial (si hay errores)**

Si el script falla en algún punto, ejecuta por secciones:
- Sección 1: Enumeraciones
- Sección 2-11: Mejoras tabla por tabla
- Sección 12: Vistas
- Sección 13-14: RLS y Triggers

---

## ✅ Verificación Post-Ejecución

Después de ejecutar, deberías ver al final una tabla con:

```
Tipo                  | Detalles
----------------------|----------------------------------
Tablas Creadas        | caja_proyecto, movimientos_caja, transacciones_recurrentes
Tablas Mejoradas      | cambios_presupuesto, materiales_proyecto, checklist_items, ...
Vistas Creadas        | v_presupuestos_resumen, v_caja_resumen, v_materiales_alertas
Enumeraciones         | cambio_estado, movimiento_subtipo, frecuencia_pago
Índices               | Optimizados para queries frecuentes
RLS Policies          | Habilitadas en nuevas tablas
Triggers              | Auditoría automática de updated_at
```

---

## 📊 Comparativa: Antes vs Después

### **Antes (sin mejoras):**
- ❌ Sin trazabilidad de consumo de materiales
- ❌ Sin gestión de cash flow
- ❌ Sin auditoría automática de cambios
- ❌ Sin alertas de desperdicio

### **Después (con mejoras):**
- ✅ Trazabilidad completa de materiales
- ✅ Gestión de cash flow y saldos
- ✅ Auditoría automática (updated_at)
- ✅ Alertas de desperdicio y costos
- ✅ Vistas para dashboards
- ✅ Mejor seguridad (RLS)

---

## 🔍 Nuevas Columnas Agregadas

### **En `materiales_proyecto`:**
```sql
cantidad_comprada           -- ¿Cuánto se compró?
cantidad_consumida          -- ¿Cuánto se usó?
cantidad_devuelta           -- ¿Cuánto se devolvió?
costo_unitario_real         -- Costo real de compra
costo_total_comprado        -- Total real gastado
variacion_costo_porcentaje  -- % de diferencia
alerta_desperdicio          -- ¿Hay desperdicio?
alerta_costo                -- ¿Hay diferencia de costo?
updated_at                  -- Última actualización
```

### **En `cambios_presupuesto`:**
```sql
numero_orden                -- Número secuencial
descripcion                 -- Detalles del cambio
impacto_total               -- Monto afectado
porcentaje_impacto          -- % del presupuesto
solicitado_fecha            -- Cuándo se solicitó
aprobado_fecha              -- Cuándo se aprobó
rechazado_fecha             -- Cuándo se rechazó
razon_rechazo               -- Por qué se rechazó
```

---

## 🆕 Nuevas Tablas: Cómo Usarlas

### **`caja_proyecto` - Gestión de Saldos**
```sql
-- Crear saldo inicial para un proyecto
INSERT INTO caja_proyecto (proyecto_id, user_id, saldo_inicial)
VALUES (uuid_proyecto, uuid_usuario, 10000.00);
```

### **`movimientos_caja` - Registrar Movimientos**
```sql
-- Registrar un ingreso
INSERT INTO movimientos_caja (
  caja_id, user_id, descripcion, subtipo, monto,
  saldo_sistema_antes, saldo_sistema_despues
) VALUES (
  uuid_caja, uuid_usuario, 'Pago cliente', 'deposito', 5000.00,
  10000.00, 15000.00
);
```

### **`transacciones_recurrentes` - Cash Flow**
```sql
-- Crear pago mensual recurrente
INSERT INTO transacciones_recurrentes (
  presupuesto_id, user_id, descripcion, tipo, monto, frecuencia
) VALUES (
  uuid_presupuesto, uuid_usuario, 'Pago nómina', 'egreso', 3000.00, 'mensual'
);
```

---

## 🎯 Nuevas Vistas: Cómo Usarlas

### **`v_presupuestos_resumen` - Dashboard Principal**
```sql
SELECT * FROM v_presupuestos_resumen
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### **`v_caja_resumen` - Resumen de Saldos**
```sql
SELECT * FROM v_caja_resumen
WHERE user_id = auth.uid();
```

### **`v_materiales_alertas` - Alertas Activas**
```sql
SELECT * FROM v_materiales_alertas
WHERE presupuesto_id = 'uuid-presupuesto';
```

---

## ⚠️ Si Hay Errores

### Error: `relation already exists`
- **Causa:** La tabla ya fue creada
- **Solución:** El script usa `CREATE TABLE IF NOT EXISTS`, es seguro ejecutar de nuevo

### Error: `column already exists`
- **Causa:** La columna ya existe
- **Solución:** El script usa `ADD COLUMN IF NOT EXISTS`, es seguro ejecutar de nuevo

### Error: `type already exists`
- **Causa:** El ENUM ya existe
- **Solución:** El script usa `CREATE TYPE IF NOT EXISTS`, es seguro ejecutar de nuevo

### Error: `policy already exists`
- **Causa:** La política RLS ya existe
- **Solución:** Ejecuta antes: `DROP POLICY IF EXISTS "nombre_policy" ON tabla;`

---

## 📞 Pasos Siguientes

1. ✅ Ejecuta `SUPABASE_IMPROVEMENTS.sql` en Supabase
2. ✅ Verifica que no hay errores
3. ✅ Regenera tipos TypeScript:
   ```bash
   supabase gen types typescript --local > src/types/supabase.ts
   ```
4. ✅ Actualiza componentes React para usar nuevas columnas
5. ✅ Despliega a producción

---

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Triggers y Functions](https://supabase.com/docs/guides/database/extensions)

---

**Última actualización:** 25 de mayo de 2026  
**Estado:** ✅ LISTO PARA PRODUCCIÓN
