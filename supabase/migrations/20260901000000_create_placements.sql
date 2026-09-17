-- Applied with `npx supabase db push` (or by pasting into the dashboard SQL editor).
-- This is a standalone, additive migration — it only creates a new table,
-- function, and policies. It does not touch members/assignments/projects
-- or any existing row. Written to be safely re-runnable.

create table if not exists placements (
  id                uuid primary key default gen_random_uuid(),
  member_id         uuid references members(id) on delete cascade not null,
  member_name       text not null,
  project_id        uuid references projects(id) on delete set null,
  project_name      text not null, -- denormalized so the public share view never needs to join projects
  stage             text not null default 'brief', -- brief | squad_poc | intro_call | onboarding_set
  squad             text,
  point_of_contact  text not null default '',
  arbisoft_contact  text not null default '',
  timeline_notes    text not null default '',
  onboarding_date   date,
  share_token       uuid not null default gen_random_uuid() unique,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- In case an earlier version of this migration already created the table
-- without project_id, backfill the column rather than failing.
alter table placements add column if not exists project_id uuid references projects(id) on delete set null;

alter table placements enable row level security;

-- Admins (same allowlisted app users, any authenticated session) get full access,
-- same pattern as the rest of the app.
drop policy if exists "auth_all_placements" on placements;
create policy "auth_all_placements" on placements for all using (auth.role() = 'authenticated');

-- Public share-link access -------------------------------------------------
-- Deliberately NOT a public `select` policy on the table — that would let
-- anyone with the anon key list every placement. Instead, expose a single
-- security-definer function that returns exactly one row, and only when the
-- caller already knows its share_token. The table itself stays locked down
-- to authenticated users only.
create or replace function get_placement_by_token(token uuid)
returns setof placements
language sql
security definer
set search_path = public
as $$
  select * from placements where share_token = token;
$$;

grant execute on function get_placement_by_token(uuid) to anon;
