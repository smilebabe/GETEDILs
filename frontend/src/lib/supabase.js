import { createClient } from '@supabase/supabase-js';

// Vite uses import.meta.env instead of process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // This will now only trigger if BOTH are missing after checking both prefixes
  console.warn("Supabase credentials missing. Ensure they are set in the Vercel Dashboard.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
