import { createClient } from '@supabase/supabase-js';

// Lee la URL y la clave anónima desde las variables de entorno definidas en Vite.
// Se requiere que estas variables estén definidas (no se usan credenciales de prueba).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Evita ejecutar la app sin credenciales para forzar la configuración correcta.
// En desarrollo evalúe si el error es por .env no cargado.
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Define tu archivo .env con tus credenciales de Supabase.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };