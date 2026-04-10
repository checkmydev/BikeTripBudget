import { createClient } from '@supabase/supabase-js';

// NEXT_PUBLIC_ vars are injected at build time via GitHub Actions secrets.
// Fallback values are safe to commit: the Supabase anon key is a public key
// designed for client-side use (it's visible in every network request anyway).
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://ocgbopfnyyqvskbrtvvg.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_-5BfedWJmjB1IqFeo16u2g_9anxOLdb';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'EveBikeTrip' },
});
