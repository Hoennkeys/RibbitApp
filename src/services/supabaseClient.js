// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Supabase Client Setup
// Location: C:\Ribbit\RibbitApp\src\services\supabaseClient.js
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wopqlnjextgodfvvmapc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcHFsbmpleHRnb2RmdnZtYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNjUzOTYsImV4cCI6MjA5ODk0MTM5Nn0.geJUYa8o4NK9bCaFqhNJgKQZYJs5QbKr5sRZUlwtASU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
export default supabase;
