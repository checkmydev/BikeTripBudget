import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ocgbopfnyyqvskbrtvvg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-5BfedWJmjB1IqFeo16u2g_9anxOLdb';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
