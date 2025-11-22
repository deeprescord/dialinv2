import { createClient } from '@supabase/supabase-js';

// Force use of my manual keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Manual Supabase Keys missing!');
}

export const manualSupabase = createClient(supabaseUrl, supabaseKey);
