import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fail fast: throw error if required environment variables are missing
if (!supabaseUrl || !supabaseKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseKey) missing.push('VITE_SUPABASE_ANON_KEY');
  
  const errorMsg = (
    `[Supabase] Critical environment variables missing: ${missing.join(', ')}\n` +
    'Please configure them in:\n' +
    '  - Local: .env or .env.local\n' +
    '  - Vercel: Settings → Environment Variables\n' +
    '  - Build time: pass via build command\n'
  );
  
  // In development, throw immediately; in production this will cause early failure
  if (import.meta.env.DEV) {
    throw new Error(errorMsg);
  } else {
    console.error(errorMsg);
    throw new Error(`Supabase initialization failed: ${missing.join(', ')} not found`);
  }
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export { supabase };
