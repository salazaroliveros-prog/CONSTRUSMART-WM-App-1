# Configuración de Supabase - Guía Completa

## 🔗 Supabase Dashboard

**URL del proyecto:** https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv

---

## 📋 PASO 1: Configurar Dominios Permitidos

### 1.1 Site URL
1. Ve a: **Settings** → **General**
2. Busca la sección **"Project URL"** o **"Site URL"**
3. Configura:
   ```
   https://construsmart-wm-app-1.vercel.app
   ```

### 1.2 Redirect URLs
1. En la misma página, busca **"Redirect URLs"**
2. Agrega las siguientes URLs (una por línea):
   ```
   https://construsmart-wm-app-1.vercel.app/**
   http://localhost:8080/**
   https://arkemshnmyfokhmbsvpv.supabase.co/auth/v1/callback
   ```
3. Haz clic en **"Save"**

---

## 🔐 PASO 2: Configurar Autenticación

### 2.1 Email Auth Settings
1. Ve a: **Authentication** → **Providers** → **Email**
2. Verifica que **"Email Auth"** esté habilitado (toggle ON)
3. En la sección **"Confirm email"**:
   - **Deshabilita** el toggle (OFF)
   - Esto permite que los usuarios puedan iniciar sesión sin confirmar email
4. En **"Secure email change"**:
   - Puedes deshabilitarlo para pruebas (OFF)
5. Haz clic en **"Save"**

### 2.2 Habilitar otros providers (opcional)
Si en el futuro quieres habilitar Google OAuth:
1. Ve a: **Authentication** → **Providers** → **Google**
2. Habilita el toggle
3. Configura Client ID y Client Secret de Google Cloud Console

---

## 👤 PASO 3: Crear Usuario de Prueba

### Opción A: Desde el Dashboard
1. Ve a: **Authentication** → **Users**
2. Haz clic en **"Add user"** → **"Create new user"**
3. Ingresa los datos:
   - **Email:** `demo@construsmart.com`
   - **Password:** `Demo123456`
   - **Auto Confirm User:** ✅ (marcar esta casilla)
4. Haz clic en **"Create user"**

### Opción B: Desde la App
1. Ve a: https://construsmart-wm-app-1.vercel.app
2. Haz clic en **"Crear Cuenta"**
3. Ingresa:
   - Nombre: `Usuario Demo`
   - Email: `demo@construsmart.com`
   - Contraseña: `Demo123456`
4. Haz clic en **"Crear Cuenta"**
5. (Si confirmación de email está deshabilitada) Podrás iniciar sesión inmediatamente

---

## 🗄️ PASO 4: Verificar Esquema de Base de Datos

### 4.1 Verificar tablas existentes
1. Ve a: **Table Editor** (icono de tabla en el menú lateral)
2. Verifica que existen las siguientes tablas:
   - ✅ clientes
   - ✅ proyectos
   - ✅ presupuestos
   - ✅ transacciones
   - ✅ actividades
   - ✅ equipos
   - ✅ equipo_miembros
   - ✅ empleados
   - ✅ proveedores
   - ✅ ordenes_compra
   - ✅ notificaciones

### 4.2 Si faltan tablas
1. Ve a: **SQL Editor** (icono de terminal en el menú lateral)
2. Abre el archivo: `scripts/SUPABASE_SCHEMA_DEFINITIVO.sql`
3. Copia y ejecuta el contenido del archivo SQL

---

## 🔒 PASO 5: Configurar RLS (Row Level Security)

### 5.1 Verificar políticas RLS
1. Ve a: **Authentication** → **Policies**
2. Para cada tabla, verifica que existan políticas:
   - **Usuarios solo pueden ver sus propios datos**
   - **Usuarios solo pueden insertar sus propios datos**
   - **Usuarios solo pueden actualizar sus propios datos**
   - **Usuarios solo pueden eliminar sus propios datos**

### 5.2 Si las políticas no existen
1. Ve a: **SQL Editor**
2. Ejecuta el esquema SQL que incluye las políticas RLS

---

## 🧪 PASO 6: Probar la Configuración

### 6.1 Probar conexión desde la app
1. Ve a: https://construsmart-wm-app-1.vercel.app
2. Intenta crear cuenta con:
   - Email: `demo@construsmart.com`
   - Contraseña: `Demo123456`
3. Si funciona, inicia sesión
4. Verifica que:
   - ✅ Dashboard carga
   - ✅ Puedes navegar entre pantallas
   - ✅ La sesión persiste al recargar (localStorage)

### 6.2 Probar desde consola del navegador
1. Abre la app en el navegador
2. Presiona F12 para abrir DevTools
3. Ve a la pestaña **Console**
4. Ejecuta:
   ```javascript
   // Verificar sesión
   const { data } = await supabase.auth.getSession();
   console.log('Sesión:', data.session);

   // Verificar localStorage
   console.log('LocalStorage:', localStorage.getItem('sb-arkemshnmyfokhmbsvpv-auth-token'));
   ```

---

## 📊 PASO 7: Verificar Configuración de Dominios en Vercel

### 7.1 Variables de entorno en Vercel
1. Ve a: https://vercel.com/proyectoswm/construsmart-wm-app-1/settings/environment-variables
2. Verifica que existan:
   - ✅ `VITE_SUPABASE_URL` = `https://arkemshnmyfokhmbsvpv.supabase.co`
   - ✅ `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 7.2 Dominio personalizado
1. Verifica que el dominio esté configurado:
   - ✅ https://construsmart-wm-app-1.vercel.app

---

## 🔧 PASO 8: Solución de Problemas

### Problema: "Invalid email or password"
- **Causa:** Usuario no existe o contraseña incorrecta
- **Solución:** Crea el usuario desde Supabase Dashboard con "Auto Confirm User"

### Problema: "Email not confirmed"
- **Causa:** Confirmación de email está habilitada
- **Solución:** Deshabilita "Confirm email" en Authentication → Providers → Email

### Problema: "redirect_uri_mismatch"
- **Causa:** Dominios no configurados en Supabase
- **Solución:** Agrega dominios en Settings → General → Redirect URLs

### Problema: La sesión no persiste
- **Causa:** localStorage no habilitado o bloqueado
- **Solución:** Verifica que el navegador permita localStorage

---

## ✅ Checklist Final

- [ ] Site URL configurado en Supabase
- [ ] Redirect URLs configurados (Vercel y localhost)
- [ ] Email Auth habilitado
- [ ] Confirm email deshabilitado
- [ ] Usuario de prueba creado (demo@construsmart.com)
- [ ] Tablas de base de datos existen
- [ ] Políticas RLS configuradas
- [ ] Variables de entorno en Vercel correctas
- [ ] App desplegada en Vercel
- [ ] Login funciona con email/contraseña
- [ ] Sesión persiste en localStorage
- [ ] CRUD de datos funciona correctamente

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs en Supabase Dashboard → Logs
3. Verifica que las variables de entorno sean correctas
4. Asegúrate de que el dominio esté configurado en Supabase
