# Instrucciones de Configuración - Supabase Remoto

⚠️ **IMPORTANTE:** Tu entorno local tiene problemas de DNS para conectar a Supabase remoto. Sigue estas instrucciones manuales en el Dashboard de Supabase.

---

## 🌐 URL del Proyecto Supabase

**Dashboard:** https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv
**Project ID:** arkemshnmyfokhmbsvpv
**Database URL:** postgresql://postgres.arkemshnmyfokhmbsvpv:***@aws-1-us-west-2.pooler.supabase.com:6543/postgres

---

## 📋 PASO 1: Configurar Dominios (Site URL y Redirect URLs)

### 1.1 Acceder a Settings
1. Ve a: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv/settings/general
2. Busca la sección **"Project URL"**

### 1.2 Configurar Site URL
- **Site URL:** `https://construsmart-wm-app-1.vercel.app`
- Haz clic en **"Save"**

### 1.3 Configurar Redirect URLs
En la misma sección, busca **"Redirect URLs"** y agrega estas URLs (una por línea):

```
https://construsmart-wm-app-1.vercel.app/**
http://localhost:8080/**
https://arkemshnmyfokhmbsvpv.supabase.co/auth/v1/callback
```

Haz clic en **"Save"**

---

## 🔐 PASO 2: Configurar Autenticación

### 2.1 Email Auth
1. Ve a: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv/auth/providers
2. Busca **"Email"** provider
3. Verifica que esté **habilitado** (toggle verde ON)
4. Despliega las opciones de Email

### 2.2 Deshabilitar Confirmación de Email
- Busca **"Confirm email"**
- **Deshabilita** el toggle (debe quedar en gris/OFF)
- Esto es CRUCIAL para que el usuario de prueba pueda iniciar sesión sin confirmar email
- Haz clic en **"Save"**

### 2.3 Otros ajustes (opcional)
- **Secure email change:** Deshabilitar para pruebas (OFF)
- **Enable email templates:** Habilitar si quieres emails personalizados (ON)

---

## 👤 PASO 3: Crear Usuario de Prueba

### 3.1 Crear Usuario desde Dashboard
1. Ve a: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv/auth/users
2. Haz clic en el botón **"Add user"** (arriba a la derecha)
3. Selecciona **"Create new user"**

### 3.2 Datos del Usuario
Completa el formulario:
- **Email:** `demo@construsmart.com`
- **Password:** `Demo123456`
- **Auto Confirm User:** ✅ **MARCAR ESTA CASILLA** (muy importante)
- Haz clic en **"Create user"**

### 3.3 Verificar Usuario
Una vez creado, verás al usuario en la lista:
- Email: demo@construsmart.com
- Status: Confirmed (gracias a Auto Confirm User)
- Created At: fecha actual

---

## 🗄️ PASO 4: Verificar Esquema de Base de Datos

### 4.1 Verificar Tablas
1. Ve a: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv/editor
2. En el panel izquierdo, verás las tablas

Deben existir estas tablas:
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

### 4.2 Si Faltan Tablas
1. Ve a: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv/sql/new
2. Abre el archivo local: `scripts/SUPABASE_SCHEMA_DEFINITIVO.sql`
3. Copia todo el contenido del archivo
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"** (botón verde)

---

## 🔒 PASO 5: Verificar Políticas RLS

### 5.1 Verificar Políticas
1. Ve a: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpp/auth/policies
2. Para cada tabla, verifica que existan políticas:
   - **SELECT:** Usuarios pueden ver sus propios datos
   - **INSERT:** Usuarios pueden insertar sus propios datos
   - **UPDATE:** Usuarios pueden actualizar sus propios datos
   - **DELETE:** Usuarios pueden eliminar sus propios datos

### 5.2 Políticas Esperadas
Cada tabla debe tener políticas similares a:
```sql
-- Usuarios solo pueden ver sus propios datos
CREATE POLICY "Users can view own data"
ON tabla FOR SELECT
USING (auth.uid() = user_id);

-- Usuarios solo pueden insertar sus propios datos
CREATE POLICY "Users can insert own data"
ON tabla FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuarios solo pueden actualizar sus propios datos
CREATE POLICY "Users can update own data"
ON tabla FOR UPDATE
USING (auth.uid() = user_id);

-- Usuarios solo pueden eliminar sus propios datos
CREATE POLICY "Users can delete own data"
ON tabla FOR DELETE
USING (auth.uid() = user_id);
```

---

## 🧪 PASO 6: Probar la Configuración

### 6.1 Iniciar Sesión en la App
1. Ve a: https://construsmart-wm-app-1.vercel.app
2. Ingresa las credenciales:
   - Email: `demo@construsmart.com`
   - Contraseña: `Demo123456`
3. Haz clic en **"Ingresar"**

### 6.2 Verificar que Funciona
Deberías ver:
- ✅ Dashboard con estadísticas
- ✅ Menú lateral con navegación
- ✅ Sin errores en consola (F12)

### 6.3 Verificar Persistencia de Sesión
1. Inicia sesión
2. Presiona F5 para recargar la página
3. Deberías seguir logueado (sesión persiste en localStorage)
4. Abre DevTools (F12) → Application → Local Storage
5. Verifica que exista: `sb-arkemshnmyfokhmbsvpv-auth-token`

### 6.4 Probar CRUD
1. Ve a **Clientes**
2. Haz clic en **"+ Nuevo Cliente"**
3. Crea un cliente de prueba
4. Verifica que se guarde correctamente
5. Recarga la página
6. Verifica que el cliente aún exista

---

## ✅ Checklist Final

Marca cada paso cuando lo completes:

### Dominios y URLs
- [ ] Site URL configurado: https://construsmart-wm-app-1.vercel.app
- [ ] Redirect URLs agregados (3 URLs)
- [ ] Cambios guardados

### Autenticación
- [ ] Email Auth habilitado
- [ ] Confirm email deshabilitado (OFF)
- [ ] Cambios guardados

### Usuario de Prueba
- [ ] Usuario demo@construsmart.com creado
- [ ] Auto Confirm User marcado
- [ ] Contraseña: Demo123456

### Base de Datos
- [ ] Tablas verificadas (11 tablas)
- [ ] Si faltaban, esquema SQL ejecutado
- [ ] Políticas RLS verificadas

### Pruebas
- [ ] Login funciona con demo@construsmart.com
- [ ] Dashboard carga correctamente
- [ ] Sesión persiste al recargar
- [ ] CRUD de clientes funciona
- [ ] Sin errores en consola del navegador

---

## 🔧 Solución de Problemas

### Error: "Invalid email or password"
**Causa:** Usuario no existe o contraseña incorrecta
**Solución:**
1. Ve a Authentication → Users
2. Busca demo@construsmart.com
3. Si no existe, créalo con "Auto Confirm User"
4. Si existe, restablece la contraseña

### Error: "Email not confirmed"
**Causa:** Confirmación de email está habilitada
**Solución:**
1. Ve a Authentication → Providers → Email
2. Deshabilita "Confirm email"
3. Guarda cambios
4. Vuelve a intentar iniciar sesión

### Error: "redirect_uri_mismatch"
**Causa:** Dominios no configurados en Supabase
**Solución:**
1. Ve a Settings → General
2. Agrega los 3 Redirect URLs
3. Guarda cambios

### Error: La sesión no persiste
**Causa:** localStorage bloqueado o deshabilitado
**Solución:**
1. Verifica que el navegador permita localStorage
2. Verifica que no haya extensiones bloqueando cookies/storage
3. Prueba en modo incógnito

### Error: "RLS policy violation"
**Causa:** Políticas RLS demasiado restrictivas
**Solución:**
1. Ve a Authentication → Policies
2. Verifica que las políticas usen `auth.uid() = user_id`
3. Ajusta las políticas según sea necesario

---

## 📞 Obtener Credenciales de Supabase

Si quieres automatizar este proceso en el futuro, necesitas:

### Access Token
1. Ve a: https://supabase.com/dashboard/account/tokens
2. Haz clic en **"Create new token"**
3. Nombre: `CONSTRUSMART CLI`
4. Copia el token

### Service Role Key
1. Ve a: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv/settings/api
2. Busca **"service_role"** key
3. Haz clic en **"Copy"** para copiar
4. ⚠️ **GUARDA ESTA KEY DE FORMA SEGURA** (da acceso total a la DB)

Con estas credenciales, puedo configurar todo automáticamente vía Supabase CLI.

---

## 🎯 Resumen

Sigue los pasos 1-6 en orden. El paso más crítico es **deshabilitar "Confirm email"** y crear el usuario con **"Auto Confirm User"** marcado.

Una vez completado, la app debería funcionar perfectamente con:
- Login con email/contraseña
- Sesión persistente en localStorage
- CRUD de datos funcionando
- Sin errores ni warnings

¿Necesitas ayuda con algún paso específico?
