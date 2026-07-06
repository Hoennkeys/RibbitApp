-- ─────────────────────────────────────────────────────────────────────────────
-- Ribbit Database Schema & Policies Configuration
-- Location: C:\Ribbit\RibbitApp\supabase\migrations\20260706_init_ribbit.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Criar Enums
create type public.tipo_permissao as enum ('usuario', 'revisor', 'admin');
create type public.tipo_status_revisao as enum ('pendente', 'aprovado', 'rejeitado');

-- 2. Tabela usuarios (sincronizada com o Supabase Auth)
create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text unique not null,
  permissao public.tipo_permissao default 'usuario'::public.tipo_permissao not null,
  criado_em timestamptz default now() not null
);

-- 3. Tabela especies
create table if not exists public.especies (
  id uuid primary key default gen_random_uuid(),
  nome_popular text not null,
  nome_cientifico text not null,
  regiao text,
  descricao text
);

-- 4. Tabela sons
create table if not exists public.sons (
  id uuid primary key default gen_random_uuid(),
  especie_id uuid references public.especies(id) on delete cascade,
  usuario_id uuid references public.usuarios(id) on delete cascade not null,
  arquivo_url text not null,
  localizacao text,
  data_captura timestamptz not null,
  status_revisao public.tipo_status_revisao default 'pendente'::public.tipo_status_revisao not null
);

-- 5. Tabela revisoes
create table if not exists public.revisoes (
  id uuid primary key default gen_random_uuid(),
  som_id uuid references public.sons(id) on delete cascade not null,
  revisor_id uuid references public.usuarios(id) on delete cascade not null,
  aprovado boolean not null,
  comentarios text,
  data_revisao timestamptz default now() not null
);

-- 6. Tabela comentarios
create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete cascade not null,
  som_id uuid references public.sons(id) on delete cascade not null,
  texto text not null,
  criado_em timestamptz default now() not null
);

-- 7. Função auxiliar para verificar permissão do usuário
create or replace function public.check_user_permissao(user_id uuid)
returns public.tipo_permissao
language plpgsql
security definer
as $$
declare
  perm public.tipo_permissao;
begin
  select permissao into perm from public.usuarios where id = user_id;
  return coalesce(perm, 'usuario'::public.tipo_permissao);
end;
$$;

-- 8. Ativar RLS (Row Level Security) em todas as tabelas
alter table public.usuarios enable row level security;
alter table public.especies enable row level security;
alter table public.sons enable row level security;
alter table public.revisoes enable row level security;
alter table public.comentarios enable row level security;

-- 9. Definir Políticas de Segurança (RLS)

-- Políticas para 'usuarios'
create policy "usuarios_select_self" on public.usuarios
  for select using (auth.uid() = id);

create policy "usuarios_update_self" on public.usuarios
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Políticas para 'especies'
create policy "especies_select_auth" on public.especies
  for select using (auth.uid() is not null);

create policy "especies_all_admin_revisor" on public.especies
  for all using (
    public.check_user_permissao(auth.uid()) in ('revisor'::public.tipo_permissao, 'admin'::public.tipo_permissao)
  );

-- Políticas para 'sons'
create policy "sons_select_auth" on public.sons
  for select using (auth.uid() is not null);

create policy "sons_insert_auth" on public.sons
  for insert with check (
    auth.uid() = usuario_id and 
    status_revisao = 'pendente'::public.tipo_status_revisao
  );

create policy "sons_update_revisor_admin" on public.sons
  for update using (
    public.check_user_permissao(auth.uid()) in ('revisor'::public.tipo_permissao, 'admin'::public.tipo_permissao)
  );

create policy "sons_delete_owner_admin" on public.sons
  for delete using (
    auth.uid() = usuario_id or 
    public.check_user_permissao(auth.uid()) = 'admin'::public.tipo_permissao
  );

-- Políticas para 'revisoes'
create policy "revisoes_select_auth" on public.revisoes
  for select using (auth.uid() is not null);

create policy "revisoes_insert_revisor_admin" on public.revisoes
  for insert with check (
    public.check_user_permissao(auth.uid()) in ('revisor'::public.tipo_permissao, 'admin'::public.tipo_permissao)
  );

-- Políticas para 'comentarios'
create policy "comentarios_select_auth" on public.comentarios
  for select using (auth.uid() is not null);

create policy "comentarios_insert_auth" on public.comentarios
  for insert with check (auth.uid() = usuario_id);

create policy "comentarios_update_owner" on public.comentarios
  for update using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

create policy "comentarios_delete_owner_admin" on public.comentarios
  for delete using (
    auth.uid() = usuario_id or 
    public.check_user_permissao(auth.uid()) = 'admin'::public.tipo_permissao
  );


-- 10. Trigger para Criar Usuário Automaticamente no Banco ao se Cadastrar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nome, email, permissao)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', 'Usuário Ribbit'),
    new.email,
    'usuario'::public.tipo_permissao
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 11. Configuração do Storage (Bucket 'sons')
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('sons', 'sons', true, array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/ogg'])
on conflict (id) do update set
  public = true,
  allowed_mime_types = array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/ogg'];

-- Políticas para o Storage Bucket 'sons'
create policy "Permitir leitura pública de sons"
  on storage.objects for select
  using (bucket_id = 'sons');

create policy "Apenas usuários autenticados podem enviar sons"
  on storage.objects for insert
  with check (
    bucket_id = 'sons' and 
    auth.role() = 'authenticated'
  );

create policy "Dono ou admin pode excluir som do storage"
  on storage.objects for delete
  using (
    bucket_id = 'sons' and 
    (auth.uid()::text = owner or public.check_user_permissao(auth.uid()) = 'admin'::public.tipo_permissao)
  );
