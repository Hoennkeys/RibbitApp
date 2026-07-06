// ─────────────────────────────────────────────────────────────────────────────
// RibbitApp — Supabase Client Setup
// Location: C:\Ribbit\RibbitApp\src\services\supabaseClient.js
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

// Essas constantes serão preenchidas pelas variáveis de ambiente em produção.
// Por padrão, mantemos fallbacks para que o aplicativo carregue sem erros de compilação.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sua-url-do-supabase.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sua-chave-anonima-do-supabase';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
