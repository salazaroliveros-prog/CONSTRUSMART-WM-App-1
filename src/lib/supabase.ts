import { createClient } from '@supabase/supabase-js';

// Read configuration from environment variables with fallbacks to the databasepad credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://agppxxgtprvdimazbmyu.databasepad.com';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEzMmQzNzIxLTQ2M2MtNDM2YS05Y2EzLThjM2ZlOTczNzUzOCJ9.eyJwcm9qZWN0SWQiOiJhZ3BweHhndHBydmRpbWF6Ym15dSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc5NDYxMjY0LCJleHAiOjIwOTQ4MjEyNjQsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.uwsWdPdQrdu4yITdcjnfmyHQEDtY7S7Nmo3SRaUbZgw';

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };