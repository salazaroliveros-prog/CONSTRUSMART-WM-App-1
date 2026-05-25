# Configuración de Vercel para CONSTRUSMART

## ✅ Problema Solucionado

**Error anterior en Vercel:**
```
[MISSING_EXPORT] "supabase" is not exported by "src/lib/supabase.ts"
```

**Causa:** Faltaban configurar las variables de entorno de Supabase en Vercel.

**Solución:** El código ahora permite builds sin credenciales, pero requiere que las variables estén presentes en runtime.

---

## 🔧 Configuración en Vercel

### Paso 1: Obtener Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Abre tu proyecto (o crea uno)
3. En la sección **Settings > API**, copia:
   - **Project URL** → será tu `VITE_SUPABASE_URL`
   - **Anon Key** (pública) → será tu `VITE_SUPABASE_ANON_KEY`

### Paso 2: Configurar Variables en Vercel

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Abre **Settings > Environment Variables**
3. Agrega estas dos variables (asegúrate que estén en los 3 ambientes):

```
Name: VITE_SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co
Environments: Production, Preview, Development
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environments: Production, Preview, Development
```

### Paso 3: Redeploy

1. Ve a **Deployments**
2. Haz click en el último deployment
3. Click en **Redeploy** 
4. Espera a que complete (debe pasar todos los checks ✓)

---

## 🚀 Desarrollo Local

Para trabajar localmente con Supabase:

1. Copia el archivo `.env.example`:
```bash
cp .env.example .env.local
```

2. Edita `.env.local` con tus credenciales reales:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Nunca commitees `.env.local` (está en `.gitignore`)

4. Ejecuta el dev server:
```bash
npm run dev
```

---

## 🗄️ Esquemas SQL de Supabase

Una vez que Vercel funcione, ejecuta estos scripts SQL en orden en el SQL Editor de Supabase:

### Orden de Ejecución:

1. **`SUPABASE_PHASE3_COMPLETE.sql`** ⭐ MAESTRO (enums, tablas, índices, RLS)
2. `supabase_schema.sql` - Schema base
3. `supabase_rls_final_policies.sql` - Políticas de seguridad
4. `supabase_consolidated_v1.sql` - Consolidación
5. `supabase_teams_init.sql` - Inicialización de teams

**Migraciones específicas (después de maestro):**
- `migration_cambios.sql` - Órdenes de cambio
- `migration_materiales.sql` - Trazabilidad de materiales
- `migration_equipos.sql` - Gestión de equipos
- `migration_conciliacion.sql` - Conciliación bancaria
- `migration_fase_presupuestos.sql` - Fases de presupuestos
- `migration_notificaciones.sql` - Notificaciones

**Ejecución:**
```
1. Abre https://app.supabase.com → Tu Proyecto → SQL Editor
2. Copia y pega cada script secuencialmente
3. Ejecuta cada uno
4. Espera confirmación antes de pasar al siguiente
5. Verifica los errores
```

---

## ✓ Checklist de Deployment

- [ ] Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configuradas en Vercel
- [ ] Build en Vercel passa sin errores (debe mostrar ✓)
- [ ] Preview deployment funciona
- [ ] SQL scripts ejecutados en Supabase
- [ ] RLS policies habilitadas
- [ ] Tests locales pasan (`npm test`)
- [ ] Lint limpio (`npm run lint`)
- [ ] Build local sin warnings (`npm run build`)

---

## 🐛 Troubleshooting

### Error: "Faltan las variables de entorno VITE_SUPABASE_URL..."

**Solución:** Configura las variables en Vercel como se describe en "Paso 2".

### Error: "Cannot connect to Supabase"

**Soluciones:**
- Verifica que `VITE_SUPABASE_URL` es correcto (termina en `.supabase.co`)
- Verifica que `VITE_SUPABASE_ANON_KEY` es la clave **pública** (no la service role)
- Verifica que no hay espacios en blanco al inicio/final de las variables

### Error: "RLS policy denied"

**Solución:** Ejecuta los scripts de RLS:
- `supabase_rls_final_policies.sql`
- `supabase_rls_final_v2.sql`

---

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Configuración de Variables en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Guía de PWA con Vite](https://vite-pwa-org.netlify.app/)

---

**Última actualización:** 25 de mayo de 2026
**Versión del app:** 0.0.0 (CONSTRUSMART WM)
