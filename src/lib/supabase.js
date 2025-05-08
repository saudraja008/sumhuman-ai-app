import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdievjvmcbgxmafkpykt.supabase.co/';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kaWV2anZtY2JneG1hZmtweWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTg2ODI2OCwiZXhwIjoyMDYxNDQ0MjY4fQ.xSzPUP_6V5tmljHBJi8JAmIPh1WAF8gpnRw7pcnF1tc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
