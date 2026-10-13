# Configuración del Nuevo Proyecto Supabase

## 📋 Información del Nuevo Proyecto

**Project ID:** eypwnpcaxcxvptsfcqvy
**URL:** https://eypwnpcaxcxvptsfcqvy.supabase.co
**Dashboard:** https://supabase.com/dashboard/project/eypwnpcaxcxvptsfcqvy
**Nombre:** CONSTURSMART
**Región:** East US (North Virginia)

## 🔑 Credenciales

### Anon Key (para la app)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHducGNheGN4dnB0c2ZjcXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDc0NTcsImV4cCI6MjEwNzQyMzQ1N30.N8bR0_pJOwCUUgEmyOK4ANIQcD6xhLfbb02NExr-Xvw
```

### Service Role Key (para operaciones administrativas)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHducGNheGN4dnB0c2ZjcXZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg0NzQ1NywiZXhwIjoyMTA3NDIzNDU3fQ.XGvlUGARaf0QzKpoNBjQOp5hxksPx0zUox03-8UYWgU
```

---

## 📝 PASO 1: Ejecutar Esquema SQL (CRUCIAL)

Este es el paso más importante. Debes ejecutar el esquema completo en el SQL Editor.

### 1.1 Acceder al SQL Editor
1. Ve a: https://supabase.com/dashboard/project/eypwnpcaxcxvptsfcqvy/sql/new
2. Se abrirá el SQL Editor

### 1.2 Ejecutar el esquema
1. Abre el archivo local: `scripts/SUPABASE_SCHEMA_DEFINITIVO.sql`
2. Copia **TODO** el contenido del archivo (1181 líneas)
3. Pégalo en el SQL Editor del Dashboard
4. Haz clic en el botón **"Run"** (ícono de ▶️)
5. Espera a que se complete la ejecución
6. Deberías ver un mensaje de éxito

**El esquema creará:**
- 11 tablas principales (clientes, proyectos, presupuestos, etc.)
- Tablas adicionales (ordenes_compra, movimientos_materiales, etc.)
- Funciones y triggers
- Índices
- Políticas RLS (Row Level Security)

---

## 🔐 PASO 2: Configurar Autenticación

### 2.1 Configurar Email Auth
1. Ve a: https://supabase.com/dashboard/project/eypwnpcaxcxvptsfcqvy/auth/providers
2. Busca **"Email"** provider
3. Verifica que esté **habilitado** (toggle verde ON)
4. Despliega las opciones

### 2.2 Deshabilitar Confirmación de Email
- Busca **"Confirm email"**
- **Deshabilita** el toggle (debe quedar en gris/OFF)
- Esto es CRUCIAL para que el usuario de prueba pueda iniciar sesión sin confirmar email
- Haz clic en **"Save"**

---

## 🌐 PASO 3: Configurar Dominios

### 3.1 Site URL
1. Ve a: https://supabase.com/dashboard/project/eypwnpcaxcxvptsfcqvy/settings/general
2. Busca **"Project URL"** o **"Site URL"**
3. Configura:
   ```
   https://construsmart-wm-app-1.vercel.app
   ```
4. Haz clic en **"Save"**

### 3.2 Redirect URLs
En la misma sección, busca **"Redirect URLs"** y agrega estas URLs (una por línea):

```
https://construsmart-wm-app-1.vercel.app/**
http://localhost:8080/**
https://eypwnpcaxcxvptsfcqvy.supabase.co/auth/v1/callback
```

Haz clic en **"Save"**

---

## 👤 PASO 4: Crear Usuario de Prueba

### 4.1 Crear Usuario desde Dashboard
1. Ve a: https://supabase.com/dashboard/project/eypwnpcaxcxvptsfcqvy/auth/users
2. Haz clic en el botón **"Add user"** (arriba a la derecha)
3. Selecciona **"Create new user"**

### 4.2 Datos del Usuario
Completa el formulario:
- **Email:** `demo@construsmart.com`
- **Password:** `Demo123456`
- **Auto Confirm User:** ✅ **MARCAR ESTA CASILLA** (muy importante)
- Haz clic en **"Create user"**

### 4.3 Verificar Usuario
Una vez creado, verás al usuario en la lista:
- Email: demo@construsmart.com
- Status: Confirmed (gracias a Auto Confirm User)
- Created At: fecha actual

---

## 🔄 PASO 5: Actualizar Variables de Entorno en Vercel

### 5.1 Acceder a Environment Variables
1. Ve a: https://vercel.com/proyectoswm/construsmart-wm-app-1/settings/environment-variables
2. Verás las variables actuales

### 5.2 Actualizar VITE_SUPABASE_URL
1. Busca `VITE_SUPABASE_URL`
2. Haz clic en el botón de editar (✏️)
3. Cambia el valor a:
   ```
   https://eypwnpcaxcxvptsfcqvy.supabase.co
   ```
4. Selecciona todos los entornos (Development, Preview, Production)
5. Haz clic en **"Save"**

### 5.3 Actualizar VITE_SUPABASE_ANON_KEY
1. Busca `VITE_SUPABASE_ANON_KEY`
2. Haz clic en el botón de editar (✏️)
3. Cambia el valor a:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHducGNheGN4dnB0c2ZjcXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NDc0NTcsImV4cCI6MjEwNzQyMzQ1N30.N8bR0_pJOwCUUgEmyOK4ANIQcD6xhLfbb02NExr-Xvw
   ```
4. Selecciona todos los entornos (Development, Preview, Production)
5. Haz clic en **"Save"**

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
5. Verifica que exista: `sb-eypwnpcaxcxvptsfcqvy-auth-token`

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

### Base de Datos
- [ ] Esquema SQL ejecutado en SQL Editor
- [ ] Tablas creadas (11 tablas principales + adicionales)
- [ ] Funciones y triggers creados
- [ ] Políticas RLS configuradas

### Autenticación
- [ ] Email Auth habilitado
- [ ] Confirm email deshabilitado (OFF)
- [ ] Cambios guardados

### Dominios
- [ ] Site URL configurado: https://construsmart-wm-app-1.vercel.app
- [ ] Redirect URLs agregados (3 URLs)
- [ ] Cambios guardados

### Usuario de Prueba
- [ ] Usuario demo@construsmart.com creado
- [ ] Auto Confirm User marcado
- [ ] Contraseña: Demo123456

### Vercel
- [ ] VITE_SUPABASE_URL actualizado
- [ ] VITE_SUPABASE_ANON_KEY actualizado
- [ ] Cambios guardados en todos los entornos

### Pruebas
- [ ] Login funciona con demo@construsmart.com
- [ ] Dashboard carga correctamente
- [ ] Sesión persiste al recargar
- [ ] CRUD de clientes funciona
- [ ] Sin errores en consola del navegador

---

## 🎯 Resumen

Sigue los pasos 1-6 en orden. El paso más crítico es **ejecutar el esquema SQL completo** en el SQL Editor de Supabase.

Una vez completado:
1. Haz commit de los cambios locales (.env.local actualizado)
2. Push al repositorio
3. Vercel desplegará automáticamente con las nuevas variables de entorno
4. La app debería funcionar perfectamente con el nuevo proyecto de Supabase

¿Necesitas ayuda con algún paso específico?
