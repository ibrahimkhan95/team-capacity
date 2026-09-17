-- Applied with `npx supabase db push` (or by pasting into the dashboard SQL editor).
-- Re-architects placements to be anchored on a PROJECT rather than a member:
-- the designer isn't known when a placement starts, they're decided at stage 2.
-- Additive / relaxing only — no column or row is dropped. Safely re-runnable.

-- 1. The designer is unknown at the start, so these can no longer be required.
alter table placements alter column member_id   drop not null;
alter table placements alter column member_name drop not null;
alter table placements alter column member_name set default '';

-- 2. The design brief is a project-level artifact: it's written before anyone
--    is assigned, and it still applies if one designer rolls off and another
--    rolls on. So it belongs on the project, not on an individual placement.
alter table projects add column if not exists brief_url text not null default '';

-- 3. Carry across any briefs already captured against a placement.
--    placements.brief_url was verified absent on this database, so this is a
--    no-op here — kept guarded in case another environment has it.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'placements'
      and column_name  = 'brief_url'
  ) then
    update projects p
       set brief_url = pl.brief_url
      from placements pl
     where pl.project_id = p.id
       and coalesce(pl.brief_url, '') <> ''
       and coalesce(p.brief_url, '')  =  '';
  end if;
end $$;

-- placements.brief_url is intentionally left in place rather than dropped —
-- keeping it costs nothing and avoids destroying data if this needs reverting.
-- It is no longer read or written by the app.

-- 4. Rework the share-link function.
--
--    Two reasons this changes shape:
--      a) the brief now lives on projects, so it has to be joined in;
--      b) `setof placements` returned EVERY column to anyone holding the link
--         — including point_of_contact, arbisoft_contact, timeline_notes and
--         member_id, none of which the public view renders. This returns only
--         the fields that page actually displays.
--
--    The return type changes, so the old function must be dropped first —
--    create-or-replace cannot alter a signature.
drop function if exists get_placement_by_token(uuid);

create function get_placement_by_token(token uuid)
returns table (
  member_name     text,
  project_name    text,
  stage           text,
  onboarding_date date,
  brief_url       text
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(pl.member_name, ''),
    pl.project_name,
    pl.stage,
    pl.onboarding_date,
    coalesce(pr.brief_url, '')
  from placements pl
  left join projects pr on pr.id = pl.project_id
  where pl.share_token = token;
$$;

grant execute on function get_placement_by_token(uuid) to anon;
