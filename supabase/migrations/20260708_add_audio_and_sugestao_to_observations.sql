-- ─────────────────────────────────────────────────────────────────────────────
-- Ribbit Database Migration: Add audio_url and sugestao to observations
-- Location: C:\Ribbit\RibbitApp\supabase\migrations\20260708_add_audio_and_sugestao_to_observations.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Adiciona as colunas necessárias na tabela observations
ALTER TABLE public.observations 
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS sugestao text;
