-- Studiolo schema.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- It is safe to re-run: every statement is guarded.
--
-- Design notes
--  * Ids stay as the app's own strings ("co-ext-spi-smart-from-scratch"), so a
--    library exported from the browser imports unchanged.
--  * Those ids are only unique per person — two people importing the same SPI
--    course would generate the same id — so every primary key is
--    (owner, id), and foreign keys are composite.
--  * Row level security keys everything to auth.uid(). Without it the anon key
--    shipped to the browser would let anyone read every library.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- faculties
create table if not exists public.faculties (
  owner       uuid not null references auth.users on delete cascade default auth.uid(),
  id          text not null,
  name        text not null,
  icon        text not null default 'book',
  accent      text not null default 'violet',
  description text,
  "order"     integer not null default 0,
  primary key (owner, id)
);

-- ----------------------------------------------------------------- creators
create table if not exists public.creators (
  owner   uuid not null references auth.users on delete cascade default auth.uid(),
  id      text not null,
  name    text not null,
  handle  text,
  url     text,
  is_self boolean not null default false,
  primary key (owner, id)
);

-- ------------------------------------------------------------------ courses
create table if not exists public.courses (
  owner       uuid not null references auth.users on delete cascade default auth.uid(),
  id          text not null,
  faculty_id  text not null,
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
  updated_at  timestamptz not null default now(),
  primary key (owner, id),
  foreign key (owner, faculty_id) references public.faculties (owner, id) on delete cascade
);

create index if not exists courses_faculty_idx on public.courses (owner, faculty_id);

-- ------------------------------------------------------------------ lessons
create table if not exists public.lessons (
  owner            uuid not null references auth.users on delete cascade default auth.uid(),
  id               text not null,
  course_id        text not null,
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
  updated_at       timestamptz not null default now(),
  primary key (owner, id),
  foreign key (owner, course_id) references public.courses (owner, id) on delete cascade
);

create index if not exists lessons_course_idx on public.lessons (owner, course_id);

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

-- -------------------------------------------------------- row level security
alter table public.faculties enable row level security;
alter table public.creators  enable row level security;
alter table public.courses   enable row level security;
alter table public.lessons   enable row level security;

do $$
declare t text;
begin
  foreach t in array array['faculties', 'creators', 'courses', 'lessons'] loop
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format(
      'create policy own_rows on public.%I
         for all
         using (owner = auth.uid())
         with check (owner = auth.uid())',
      t
    );
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
