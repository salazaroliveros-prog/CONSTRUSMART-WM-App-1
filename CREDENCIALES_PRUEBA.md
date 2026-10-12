# Credenciales de Prueba - CONSTRUSMART WM App

## 🔐 Usuario de Prueba

**Email:** `demo@construsmart.com`
**Contraseña:** `Demo123456`
**Nombre:** Usuario Demo

## 📝 Cómo Crear el Usuario

Si el usuario no existe, créalo desde la interfaz de la app:

1. Ve a: https://construsmart-wm-app-1.vercel.app
2. Haz clic en la pestaña **"Crear Cuenta"**
3. Ingresa los siguientes datos:
   - **Nombre:** Usuario Demo
   - **Correo:** demo@construsmart.com
   - **Contraseña:** Demo123456
4. Haz clic en **"Crear Cuenta"**
5. Si la confirmación de email está deshabilitada en Supabase, podrás iniciar sesión inmediatamente
6. Si está habilitada, verifica que la confirmación esté deshabilitada en Supabase Dashboard

## 🌐 Supabase Dashboard

Para deshabilitar la confirmación de email:

1. Ve a: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv/auth/settings
2. Busca la sección **"Email Auth"**
3. Deshabilita **"Confirm email"**
4. Guarda los cambios

## 📋 Después de Crear el Usuario

Una vez creado el usuario:

1. Inicia sesión con las credenciales
2. La sesión se guardará automáticamente en localStorage
3. Podrás cerrar y volver a abrir el navegador y seguirás logueado
4. La sesión persistirá hasta que cierres sesión manualmente

## 🗑️ Para Eliminar el Usuario

Si necesitas eliminar el usuario de prueba:

1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/arkemshnmyfokhmbsvpv/auth/users
2. Busca el usuario con email `demo@construsmart.com`
3. Haz clic en el menú (⋮) del usuario
4. Selecciona **"Delete"**

## 🧪 Funcionalidades a Validar

Una vez logueado, valida:

- ✅ Dashboard carga correctamente
- ✅ Navegación entre pantallas funciona
- ✅ Crear/editar/eliminar clientes
- ✅ Crear/editar/eliminar proyectos
- ✅ Crear/editar/eliminar presupuestos
- ✅ Ver estadísticas financieras
- ✅ Persistencia de sesión al recargar la página
- ✅ Cerrar sesión funciona correctamente
