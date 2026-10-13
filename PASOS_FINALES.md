# Pasos Finales de Configuración

## ✅ Usuario de Prueba Creado

Usuario: `demo@construsmart.com`
Contraseña: `Demo123456`

---

## 📋 PASOS RESTANTES (MANUALES)

### PASO 1: Configurar Dominios en Supabase

1. Ve a: https://supabase.com/dashboard/project/eypwnpcaxcxvptsfcqvy/settings/general
2. **Site URL:**
   ```
   https://construsmart-wm-app-1.vercel.app
   ```
3. **Redirect URLs:**
   ```
   https://construsmart-wm-app-1.vercel.app/**
   http://localhost:8080/**
   https://eypwnpcaxcxvptsfcqvy.supabase.co/auth/v1/callback
   ```
4. Haz clic en **"Save"**

### PASO 2: Deshabilitar Confirmación de Email

1. Ve a: https://supabase.com/dashboard/project/eypwnpcaxcxvptsfcqvy/auth/providers
2. Busca **"Email"** provider
3. Deshabilita **"Confirm email"** (toggle OFF)
4. Haz clic en **"Save"**

### PASO 3: Ejecutar Esquema SQL (si no lo has hecho)

1. Ve a: https://supabase.com/dashboard/project/eypwnpcaxcxvptsfcqvy/sql/new
2. Abre el archivo: `scripts/SUPABASE_SCHEMA_DEFINITIVO.sql`
3. Copia TODO el contenido
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"**

### PASO 4: Actualizar Variables en Vercel

1. Ve a: https://vercel.com/proyectoswm/construsmart-wm-app-1/settings/environment-variables
2. Actualiza `VITE_SUPABASE_URL`:
   ```
   https://eypwnpcaxcxvptsfcqvy.supabase.co
   ```
3. Actualiza `VITE_SUPABASE_ANON_KEY`:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHducGNheGN4dnB0c2ZjcXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDc0NTcsImV4cCI6MjEwNzQyMzQ1N30.N8bR0_pJOwCUUgEmyOK4ANIQcD6xhLfbb02NExr-Xvw
   ```
4. Selecciona todos los entornos
5. Haz clic en **"Save"**

### PASO 5: Desplegar a Vercel

Vercel desplegará automáticamente cuando detecte el push, pero puedes forzar el despliegue:

1. Ve a: https://vercel.com/proyectoswm/construsmart-wm-app-1/deployments
2. Haz clic en **"Redeploy"** si es necesario

### PASO 6: Probar la App

1. Ve a: https://construsmart-wm-app-1.vercel.app
2. Ingresa:
   - Email: `demo@construsmart.com`
   - Contraseña: `Demo123456`
3. Haz clic en **"Ingresar"**
4. Verifica que el dashboard cargue
5. Verifica que la sesión persista al recargar (F5)

---

## ✅ Checklist Final

- [ ] Dominios configurados en Supabase
- [ ] Confirm email deshabilitado
- [ ] Esquema SQL ejecutado
- [ ] Variables de entorno actualizadas en Vercel
- [ ] App desplegada en Vercel
- [ ] Login funciona con demo@construsmart.com
- [ ] Sesión persiste en localStorage
- [ ] CRUD funciona correctamente

---

## 🎯 Una vez completado

La app estará completamente funcional con:
- Nuevo proyecto de Supabase (eypwnpcaxcxvptsfcqvy)
- Usuario de prueba configurado
- Dominios correctamente configurados
- Autenticación sin confirmación de email
- Sesión persistente en localStorage
- Todas las tablas y políticas RLS configuradas
