import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] Variables de entorno faltantes: VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
    'Configúralas en Vercel → Settings → Environment Variables.'
  );
}

const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

export { supabase };
