import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL. Set it in client/.env');
}

if (!supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY. Set it in client/.env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
