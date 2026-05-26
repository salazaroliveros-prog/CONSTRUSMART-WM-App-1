import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missing: string[] = [];
if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
if (!supabaseKey) missing.push('VITE_SUPABASE_ANON_KEY');
if (missing.length) {
  throw new Error(
    `Variables de entorno faltantes: ${missing.join(', ')}. ` +
    'Copia .env.example a .env y completa los valores de Supabase, luego reinicia el servidor de desarrollo.'
  );
}

const supabase = createClient<Database>(supabaseUrl!, supabaseKey!);

export { supabase };