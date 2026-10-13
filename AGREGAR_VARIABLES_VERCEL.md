# ⚠️ Variables Eliminadas - Necesario Agregar Nuevas

He eliminado las variables antiguas de Vercel. Ahora necesitas agregar las nuevas manualmente.

## 🔧 PASO 1: Agregar Variables en Vercel (2 minutos)

1. Ve a: https://vercel.com/proyectoswm/construsmart-wm-app-1/settings/environment-variables

2. **Agregar VITE_SUPABASE_URL:**
   - Haz clic en el botón **"Add New"** o **"+ Add New"**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:**
     ```
     https://eypwnpcaxcxvptsfcqvy.supabase.co
     ```
   - **Environments:** Selecciona Development, Preview, Production (los 3)
   - Haz clic en **"Save"**

3. **Agregar VITE_SUPABASE_ANON_KEY:**
   - Haz clic en **"+ Add New"**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:**
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHducGNheGN4dnB0c2ZjcXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDc0NTcsImV4cCI6MjEwNzQyMzQ1N30.N8bR0_pJOwCUUgEmyOK4ANIQcD6xhLfbb02NExr-Xvw
     ```
   - **Environments:** Selecciona Development, Preview, Production (los 3)
   - Haz clic en **"Save"**

## 🚀 PASO 2: Forzar Redespliegue (1 minuto)

1. Ve a: https://vercel.com/proyectoswm/construsmart-wm-app-1/deployments
2. Haz clic en el botón **"Redeploy"**
3. Espera 2-3 minutos

## 🧪 PASO 3: Probar Login

1. Ve a: https://construsmart-wm-app-1.vercel.app
2. Usa:
   - Email: `demo@construsmart.com`
   - Password: `Demo123456`
3. Haz clic en "Ingresar"

## ✅ Estado Actual

- ✅ Variables antiguas eliminadas
- ❌ Variables nuevas por agregar (requiere acción manual)
- ✅ Base de datos configurada en nuevo proyecto
- ✅ Usuario de prueba creado
- ⏳ Esperando actualización de variables en Vercel
