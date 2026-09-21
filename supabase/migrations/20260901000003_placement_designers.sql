-- Applied with `npx supabase db push` (or by pasting into the dashboard SQL editor).
-- A project is usually staffed with a combination of designers, from different
-- squads, each at their own capacity. `placements.member_id` can only hold one,
-- so this adds a proper one-to-many.
-- Additive only — no existing column or row is dropped. Safely re-runnable.

create table if not exists placement_designers (
  id           uuid primary key default gen_random_uuid(),
  placement_id uuid references placements(id) on delete cascade not null,
  member_id    uuid references members(id)    on delete cascade not null,
  -- denormalised so the public share view never has to read `members`
  member_name  text not null default '',
  squad        text not null default '',
  pct          integer not null default 100,
  engagement   text not null default 'Full Time (100%)',
  created_at   timestamptz default now(),
  -- the same person can't hold two seats on one placement
  unique (placement_id, member_id)
);

create index if not exists placement_designers_placement_idx
  on placement_designers (placement_id);

-- Carry existing single-designer placements across. `on conflict do nothing`
-- makes re-running this harmless.
insert into placement_designers (placement_id, member_id, member_name, squad, pct, engagement)
select pl.id, pl.member_id, coalesce(pl.member_name, ''), coalesce(pl.squad, ''), 100, 'Full Time (100%)'
from placements pl
where pl.member_id is not null
on conflict (placement_id, member_id) do nothing;

-- placements.member_id / member_name / squad are intentionally left in place.
-- They're kept in sync with the first designer so nothing that still reads them
-- breaks, and so this is reversible.

alter table placement_designers enable row level security;

drop policy if exists "auth_all_placement_designers" on placement_designers;
create policy "auth_all_placement_designers" on placement_designers
  for all using (auth.role() = 'authenticated');

-- Public share link ---------------------------------------------------------
-- The public page shows who is being placed, so it now needs the whole team
-- rather than one name. Returned as JSON so the page can render names and
-- capacities without another round trip. Still only the fields that page
-- displays — no point_of_contact, arbisoft_contact or timeline_notes.
drop function if exists get_placement_by_token(uuid);

create function get_placement_by_token(token uuid)
returns table (
  designers       json,
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
    coalesce(
      (select json_agg(json_build_object('member_name', pd.member_name, 'pct', pd.pct)
                       order by pd.member_name)
         from placement_designers pd
        where pd.placement_id = pl.id),
      '[]'::json
    ),
    pl.project_name,
    pl.stage,
    pl.onboarding_date,
    coalesce(pr.brief_url, '')
  from placements pl
  left join projects pr on pr.id = pl.project_id
  where pl.share_token = token;
$$;

grant execute on function get_placement_by_token(uuid) to anon;
