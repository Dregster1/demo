import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azoisbtacihvjhlqmjci.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6b2lzYnRhY2lodmpobHFtamNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMjM5OTMsImV4cCI6MjA2NTU5OTk5M30.o-nb_K_ZlGK6JF1IDQc9AlpoI7Sx06wtryR3U9WGjb4';

export const supabase = createClient(supabaseUrl, supabaseKey);




