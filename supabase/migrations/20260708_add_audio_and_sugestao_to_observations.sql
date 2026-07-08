-- ─────────────────────────────────────────────────────────────────────────────
-- Ribbit Database Migration: Add audio_url/sugestao, define check_user_permissao (as text), and reset RLS policies
-- Location: C:\Ribbit\RibbitApp\supabase\migrations\20260708_add_audio_and_sugestao_to_observations.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Cria ou substitui a função check_user_permissao buscando o e-mail no auth.users (retornando texto plano)
CREATE OR REPLACE FUNCTION public.check_user_permissao(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  IF user_email = 'lucas@ribbit.com' OR user_email LIKE '%admin%' THEN
    RETURN 'admin';
  ELSE
    RETURN 'usuario';
  END IF;
END;
$$;

-- 2. Adiciona as colunas necessárias na tabela observations
ALTER TABLE public.observations 
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS sugestao text;

-- 3. Habilita RLS na tabela
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;

-- 4. Remove políticas de segurança antigas (inclusive as herdadas do nome 'sons')
DROP POLICY IF EXISTS "sons_insert_auth" ON public.observations;
DROP POLICY IF EXISTS "observations_insert_policy" ON public.observations;
DROP POLICY IF EXISTS "sons_select_auth" ON public.observations;
DROP POLICY IF EXISTS "observations_select_policy" ON public.observations;
DROP POLICY IF EXISTS "sons_update_revisor_admin" ON public.observations;
DROP POLICY IF EXISTS "observations_update_policy" ON public.observations;
DROP POLICY IF EXISTS "sons_delete_owner_admin" ON public.observations;
DROP POLICY IF EXISTS "observations_delete_policy" ON public.observations;

-- 5. Cria políticas de segurança limpas e funcionais (sem depender de enums externos)
CREATE POLICY "observations_insert_policy" ON public.observations
  FOR INSERT WITH CHECK (
    auth.uid() = usuario_id
  );

CREATE POLICY "observations_select_policy" ON public.observations
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "observations_update_policy" ON public.observations
  FOR UPDATE USING (
    auth.uid() = usuario_id OR
    public.check_user_permissao(auth.uid()) IN ('revisor', 'admin')
  );

CREATE POLICY "observations_delete_policy" ON public.observations
  FOR DELETE USING (
    auth.uid() = usuario_id OR
    public.check_user_permissao(auth.uid()) = 'admin'
  );
