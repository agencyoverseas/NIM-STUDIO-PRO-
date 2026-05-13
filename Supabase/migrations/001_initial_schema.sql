-- ============================================================
-- NIM STUDIO PRO — Schéma Supabase v1.0
-- ============================================================
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Profils utilisateurs (étend auth.users) ───────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  plan text not null default 'free' check (plan in ('free','pro','admin')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,                -- active, canceled, past_due, etc.
  subscription_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- RLS : utilisateur voit uniquement son propre profil
create policy "self_read" on public.profiles for select using (auth.uid() = id);
create policy "self_update" on public.profiles for update using (auth.uid() = id);

-- Trigger : créer profile automatiquement après signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, plan)
  values (new.id, new.email, 'free');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 2. Quotas / rate limiting par user ───────────────────────
create table if not exists public.api_usage (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  provider text not null check (provider in ('claude','fal','gemini')),
  model text,
  tokens_in int default 0,
  tokens_out int default 0,
  cost_usd numeric(10,6) default 0,
  status text default 'ok',                -- ok, error, rate_limited
  created_at timestamptz default now()
);

create index idx_api_usage_user_time on public.api_usage(user_id, created_at desc);
create index idx_api_usage_provider on public.api_usage(provider, created_at desc);

alter table public.api_usage enable row level security;
create policy "self_read_usage" on public.api_usage for select using (auth.uid() = user_id);


-- ── 3. Conversations (sync cross-device) ─────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text,
  messages jsonb not null default '[]'::jsonb,
  model text,
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_conv_user on public.conversations(user_id, updated_at desc);

alter table public.conversations enable row level security;
create policy "self_crud_conv" on public.conversations for all using (auth.uid() = user_id);


-- ── 4. Générations média (vidéos/images fal.ai) ──────────────
create table if not exists public.media_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('image','video')),
  prompt text not null,
  model text,
  result_url text,
  thumbnail_url text,
  duration_seconds int,
  status text default 'pending' check (status in ('pending','processing','done','failed')),
  error_message text,
  cost_usd numeric(10,6),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index idx_media_user on public.media_generations(user_id, created_at desc);

alter table public.media_generations enable row level security;
create policy "self_crud_media" on public.media_generations for all using (auth.uid() = user_id);


-- ── 5. Découpages vidéo (feature découpe auto) ───────────────
create table if not exists public.video_clips (
  id uuid primary key default gen_random_uuid(),
  source_generation_id uuid references public.media_generations on delete cascade,
  user_id uuid references auth.users on delete cascade not null,
  clip_index int not null,
  start_seconds numeric(10,2),
  end_seconds numeric(10,2),
  format text,                              -- '16:9','9:16','1:1'
  clip_url text,
  created_at timestamptz default now()
);

create index idx_clips_source on public.video_clips(source_generation_id, clip_index);

alter table public.video_clips enable row level security;
create policy "self_read_clips" on public.video_clips for select using (auth.uid() = user_id);


-- ── 6. Vue admin : agrégats globaux ──────────────────────────
create or replace view public.admin_stats as
select
  date_trunc('day', created_at) as day,
  provider,
  count(*) as calls,
  sum(tokens_in + tokens_out) as tokens_total,
  sum(cost_usd) as cost_total,
  count(distinct user_id) as unique_users
from public.api_usage
group by 1, 2
order by 1 desc, 2;

-- Accès admin uniquement (vérifié dans Edge Function)


-- ── 7. Helper : vérifier quota d'un user ─────────────────────
create or replace function public.check_user_quota(
  p_user_id uuid,
  p_window_minutes int default 60,
  p_max_tokens int default 10000
) returns table(allowed boolean, used_tokens int, remaining int)
language plpgsql security definer set search_path = public as $$
declare
  v_used int;
  v_plan text;
begin
  select plan into v_plan from public.profiles where id = p_user_id;

  -- Pro et admin : pas de limite
  if v_plan in ('pro','admin') then
    return query select true, 0, 999999999;
    return;
  end if;

  select coalesce(sum(tokens_in + tokens_out), 0) into v_used
  from public.api_usage
  where user_id = p_user_id
    and created_at > now() - (p_window_minutes || ' minutes')::interval;

  return query select v_used < p_max_tokens, v_used, greatest(0, p_max_tokens - v_used);
end;
$$;
