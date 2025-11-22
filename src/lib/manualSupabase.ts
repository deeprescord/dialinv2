import { createClient } from '@supabase/supabase-js';

// DIALIN MAIN CREDENTIALS (Hardcoded for Alpha Test)
const TO_URL = 'https://qdytxfauwfdjotnlcbuh.supabase.co';
const TO_KEY = 'sb_publishable_tuZ7tUAnkHJISP5qUEf-GA_pEnAXY9l';

console.log('Manual Client connecting to:', TO_URL);

export const manualSupabase = createClient(TO_URL, TO_KEY, {
  auth: {
    persistSession: false, // Pure anonymous mode
    autoRefreshToken: false,
  }
});
