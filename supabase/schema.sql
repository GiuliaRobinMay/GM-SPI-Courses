-- Studiolo schema.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is safe to re-run: every statement is guarded.
--
-- Design notes
--  * Ids stay as the app's own strings ("co-ext-spi-smart-from-scratch"), so a
--    library exported from the browser imports unchanged.
--  * There is no sign-in and no per-person ownership. Row level security is
--    off and the anon key alone reads and writes. A deliberate trade for a
--    personal tool: nothing to log into, and no token that can expire.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- faculties
create table if not exists public.faculties (
  id          text primary key,
  name        text not null,
  icon        text not null default 'book',
  accent      text not null default 'violet',
  description text,
  "order"     integer not null default 0
);

-- ----------------------------------------------------------------- creators
create table if not exists public.creators (
  id      text primary key,
  name    text not null,
  handle  text,
  url     text,
  is_self boolean not null default false
);

-- ------------------------------------------------------------------ courses
create table if not exists public.courses (
  id          text primary key,
  faculty_id  text not null references public.faculties (id) on delete cascade,
  kind        text not null default 'course',
  title       text not null,
  subtitle    text,
  description text,
  creator_id  text,
  source_url  text,
  topics      text[] not null default '{}',
  accent      text not null default 'violet',
  icon        text,
  track       text,
  track_order integer,
  priority    text,
  planned_for date,
  favorite    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists courses_faculty_idx on public.courses (faculty_id);

-- ------------------------------------------------------------------ lessons
create table if not exists public.lessons (
  id               text primary key,
  course_id        text not null references public.courses (id) on delete cascade,
  title            text not null,
  creator_id       text,
  "order"          integer not null default 0,
  status           text not null default 'todo',
  priority         text,
  planned_for      date,
  source_kind      text not null default 'transcript',
  video_url        text,
  source_url       text,
  source_file_name text,
  section          text,
  section_order    integer,
  transcript       text not null default '',
  content          text,
  notes            text,
  topics           text[] not null default '{}',
  duration_minutes integer,
  recorded_at      timestamptz,
  study            jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists lessons_course_idx on public.lessons (course_id);

-- Full text over everything worth searching, for "ask across the library".
alter table public.lessons
  add column if not exists search tsvector
  generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(transcript, '') || ' ' ||
      coalesce(content, '') || ' ' ||
      coalesce(notes, '')
    )
  ) stored;

create index if not exists lessons_search_idx on public.lessons using gin (search);

-- ------------------------------------------------------- no row level security
--
-- Nothing here is per-person, so there is nothing to key a policy to. RLS
-- stays off and the anon key has full access.

do $$
declare t text;
begin
  foreach t in array array['faculties', 'creators', 'courses', 'lessons'] loop
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format('alter table public.%I disable row level security', t);
  end loop;
end $$;

-- ------------------------------------------------------------- convergence
--
-- `create table if not exists` skips a table that already exists, new columns
-- and all, so re-running this file on an older database silently leaves it
-- behind. Every column the app writes is therefore also added explicitly
-- here, which is a no-op on a fresh database and repairs an older one.

alter table public.faculties add column if not exists icon        text not null default 'book';
alter table public.faculties add column if not exists accent      text not null default 'violet';
alter table public.faculties add column if not exists description text;
alter table public.faculties add column if not exists "order"     integer not null default 0;

alter table public.creators  add column if not exists handle  text;
alter table public.creators  add column if not exists url     text;
alter table public.creators  add column if not exists is_self boolean not null default false;

alter table public.courses add column if not exists kind        text not null default 'course';
alter table public.courses add column if not exists icon        text;
alter table public.courses add column if not exists priority    text;
alter table public.courses add column if not exists planned_for date;
alter table public.courses add column if not exists plan_order  integer;
alter table public.courses add column if not exists sort_order  integer;
alter table public.courses add column if not exists subtitle    text;
alter table public.courses add column if not exists description text;
alter table public.courses add column if not exists creator_id  text;
alter table public.courses add column if not exists source_url  text;
alter table public.courses add column if not exists topics      text[] not null default '{}';
alter table public.courses add column if not exists accent      text not null default 'violet';
alter table public.courses add column if not exists track       text;
alter table public.courses add column if not exists track_order integer;
alter table public.courses add column if not exists favorite    boolean not null default false;

alter table public.lessons add column if not exists priority         text;
alter table public.lessons add column if not exists planned_for      date;
alter table public.lessons add column if not exists plan_order       integer;
alter table public.lessons add column if not exists creator_id       text;
alter table public.lessons add column if not exists source_kind      text not null default 'transcript';
alter table public.lessons add column if not exists video_url        text;
alter table public.lessons add column if not exists source_url       text;
alter table public.lessons add column if not exists source_file_name text;
alter table public.lessons add column if not exists section          text;
alter table public.lessons add column if not exists section_order    integer;
alter table public.lessons add column if not exists content          text;
alter table public.lessons add column if not exists notes            text;
alter table public.lessons add column if not exists topics           text[] not null default '{}';
alter table public.lessons add column if not exists duration_minutes integer;
alter table public.lessons add column if not exists recorded_at      timestamptz;
alter table public.lessons add column if not exists study            jsonb;

-- PostgREST caches the schema; without this it keeps reporting new columns
-- as missing until it happens to reload.
notify pgrst, 'reload schema';
