import { createClient } from '@supabase/supabase-js';

// Lee la URL y la clave anónima desde las variables de entorno definidas en Vite.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Permitir inicialización sin credenciales en build time
// Las credenciales se requieren en runtime
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else if (typeof window !== 'undefined') {
  // En el navegador (runtime), lanzar error si faltan credenciales
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. ' +
    'Configúralas en tu archivo .env.local o en las variables de entorno de Vercel.'
  );
}

export { supabase };