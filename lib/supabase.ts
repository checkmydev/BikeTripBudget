import { createClient } from '@supabase/supabase-js';

// NEXT_PUBLIC_ vars are injected at build time via GitHub Actions secrets.
// Fallback values are safe to commit: the Supabase anon key is a public key
// designed for client-side use (it's visible in every network request anyway).
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || 'https://wzrcrszfubjsfoaxatvo.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cmNyc3pmdWJqc2ZvYXhhdHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjcxMzEsImV4cCI6MjA5MTcwMzEzMX0.HSzERXdF0nBs0L4XVcKo-UsGe1PAcqiVD5gwZj15foY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'EveBikeTrip' },
});
