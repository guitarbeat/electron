
import { createClient } from '@supabase/supabase-js';

// These variables are expected to be in a .env.local file
// REACT_APP_SUPABASE_URL=your-supabase-url
// REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required. Make sure to set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
