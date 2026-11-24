// Supabase client for accounts and cloud saves. Only the public URL and publishable key are used;
// row level security keeps every player to their own saves.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { BACKEND_CONFIGURED, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config.ts';

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!BACKEND_CONFIGURED) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'redstring.auth', detectSessionInUrl: false },
    });
  }
  return client;
}
