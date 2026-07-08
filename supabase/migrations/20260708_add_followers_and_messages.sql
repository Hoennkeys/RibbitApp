/* ─────────────────────────────────────────────────────────────────────────────
   Ribbit Database Migrations: Followers & Real-time Chat (Safe copy-paste version)
   Location: C:\Ribbit\RibbitApp\supabase\migrations\20260708_add_followers_and_messages.sql
   ───────────────────────────────────────────────────────────────────────────── */

/* 1. Drop existing legacy chat/message tables to ensure clean columns and schema recreate */
drop table if exists public.messages cascade;
drop table if exists public.chats cascade;
drop table if exists public.followers cascade;

/* 2. Create Followers Table */
create table public.followers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique (user_id, follower_id)
);

/* Enable RLS on Followers */
alter table public.followers enable row level security;

/* Policies for Followers */
create policy "Allow public reading of followers" on public.followers
  for select using (auth.uid() is not null);

create policy "Allow authenticated users to follow others" on public.followers
  for insert with check (auth.uid() = follower_id);

create policy "Allow authenticated users to unfollow others" on public.followers
  for delete using (auth.uid() = follower_id);


/* 3. Create Chats Table */
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  last_message text,
  unread_count integer default 0 not null,
  created_at timestamptz default now() not null,
  unique (user_id, recipient_id)
);

/* Enable RLS on Chats */
alter table public.chats enable row level security;

/* Policies for Chats */
create policy "Allow users to view their own chats" on public.chats
  for select using (auth.uid() = user_id or auth.uid() = recipient_id);

create policy "Allow users to create chats" on public.chats
  for insert with check (auth.uid() = user_id or auth.uid() = recipient_id);

create policy "Allow users to update chats" on public.chats
  for update using (auth.uid() = user_id or auth.uid() = recipient_id);

create policy "Allow users to delete their chats" on public.chats
  for delete using (auth.uid() = user_id or auth.uid() = recipient_id);


/* 4. Create Messages Table */
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  status text default 'sent'::text not null, /* 'sent', 'delivered' */
  created_at timestamptz default now() not null
);

/* Enable RLS on Messages */
alter table public.messages enable row level security;

/* Policies for Messages */
create policy "Allow participants to read chat messages" on public.messages
  for select using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and (auth.uid() = c.user_id or auth.uid() = c.recipient_id)
    )
  );

create policy "Allow chat participants to insert messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.chats c
      where c.id = chat_id and (auth.uid() = c.user_id or auth.uid() = c.recipient_id)
    )
  );
