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
  accent      text not null default 'indigo',
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
  title       text not null,
  subtitle    text,
  description text,
  creator_id  text,
  source_url  text,
  topics      text[] not null default '{}',
  accent      text not null default 'indigo',
  track       text,
  track_order integer,
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
