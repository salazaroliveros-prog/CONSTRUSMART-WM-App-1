# ⚠️ URGENTE: Actualizar Variables en Vercel

El error 401 ocurre porque Vercel aún usa las credenciales del proyecto antiguo (`arkemshnmyfokhmbsvpv`).

## 🔧 PASO INMEDIATO (2 minutos)

1. Ve a: https://vercel.com/proyectoswm/construsmart-wm-app-1/settings/environment-variables

2. **Actualizar VITE_SUPABASE_URL:**
   - Busca la variable `VITE_SUPABASE_URL`
   - Haz clic en editar (✏️)
   - Cambia a:
     ```
     https://eypwnpcaxcxvptsfcqvy.supabase.co
     ```
   - Selecciona: Development, Preview, Production
   - Guarda

3. **Actualizar VITE_SUPABASE_ANON_KEY:**
   - Busca la variable `VITE_SUPABASE_ANON_KEY`
   - Haz clic en editar (✏️)
   - Cambia a:
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHducGNheGN4dnB0c2ZjcXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDc0NTcsImV4cCI6MjEwNzQyMzQ1N30.N8bR0_pJOwCUUgEmyOK4ANIQcD6xhLfbb02NExr-Xvw
     ```
   - Selecciona: Development, Preview, Production
   - Guarda

4. **Forzar Redespliegue:**
   - Ve a: https://vercel.com/proyectoswm/construsmart-wm-app-1/deployments
   - Haz clic en "Redeploy"

5. **Espera 2 minutos** para que se despliegue

6. **Prueba nuevamente:**
   - Ve a: https://construsmart-wm-app-1.vercel.app
   - Intenta iniciar sesión

## 🔐 Usuarios Disponibles

### Usuario de Prueba (recomendado)
- Email: `demo@construsmart.com`
- Password: `Demo123456`

### Usuario Real (si existe en el nuevo proyecto)
- Email: `salazaroliveros@gmail.com`
- Password: (la que usaste al crearlo)

## ⚠️ Nota sobre salazaroliveros@gmail.com

Si creaste este usuario en el **nuevo proyecto** (`eypwnpcaxcxvptsfcqvy`), funcionará. Si lo creaste en el **proyecto antiguo** (`arkemshnmyfokhmbsvpv`), no funcionará porque está en el proyecto incorrecto.

**Recomendación:** Usa `demo@construsmart.com` / `Demo123456` para pruebas.
