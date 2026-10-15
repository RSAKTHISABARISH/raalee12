import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.PUBLIC_SUPABASE_URL || 'https://msqelakkswwqlgpfcmno.supabase.co';

export const SUPABASE_KEY =
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcWVsYWtrc3d3cWxncGZjbW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjA2MTgyOSwiZXhwIjoyMTA3NjM3ODI5fQ.rKV6zTKvTz4CDn-H28vwjvvxI2RFHGIiShPE1mRzN30';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;
