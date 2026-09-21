-- Base schema: everything the app needs BEFORE the placement migrations.
--
-- This exists because the original supabase-schema.sql never created `projects`
-- or `project_tier_history` — it only ALTERed projects, assuming it was already
-- there. That made the repo impossible to bootstrap into a fresh Supabase
-- project. Reconstructed from what the application code actually reads/writes.
--
-- Safe to run against the existing production database too: every statement is
-- `if not exists`, so it's a no-op where these already exist.

-- Projects -----------------------------------------------------------------
create table if not exists projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  -- active_oversight | coach | monitor | empower
  tier       text not null default 'monitor',
  -- internal projects stay out of the Accounts tier view and tier totals
  internal   boolean not null default false,
  -- design brief for the project; read by the placement pipeline
  brief_url  text not null default '',
  created_at timestamptz default now()
);

alter table projects add column if not exists internal  boolean not null default false;
alter table projects add column if not exists brief_url text    not null default '';

-- Members ------------------------------------------------------------------
create table if not exists members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  -- Junior | Mid | Senior | XDM
  seniority  text not null default 'Mid',
  squad      text not null,
  -- On Project | Bench | On Leave | Exiting
  status     text not null default 'On Project',
  notes      text not null default '',
  created_at timestamptz default now()
);

-- Assignments --------------------------------------------------------------
create table if not exists assignments (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid references members(id) on delete cascade not null,
  project_id       uuid references projects(id) on delete set null,
  -- denormalised project name, kept for rows predating project_id
  project          text not null default '',
  engagement       text not null default 'Full Time (100%)',
  -- 'fixed' uses the engagement label; 'hourly' derives pct from hours/week
  engagement_mode  text not null default 'fixed',
  engagement_hours integer,
  pct              integer not null default 100,
  start_date       date,
  end_date         date,
  notes            text not null default '',
  created_at       timestamptz default now()
);

alter table assignments add column if not exists project_id       uuid references projects(id) on delete set null;
alter table assignments add column if not exists engagement_mode  text not null default 'fixed';
alter table assignments add column if not exists engagement_hours integer;

-- Tier change history ------------------------------------------------------
create table if not exists project_tier_history (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  from_tier  text,
  to_tier    text not null,
  changed_by text not null default '',
  changed_at timestamptz default now()
);

-- Row level security -------------------------------------------------------
-- Every table is admin-only; the app gates who can sign in via an email
-- allowlist in the client. The one public surface is the placement share link,
-- which goes through a security-definer function (see the placement migration)
-- rather than a policy.
alter table projects             enable row level security;
alter table members              enable row level security;
alter table assignments          enable row level security;
alter table project_tier_history enable row level security;

drop policy if exists "auth_all_projects"             on projects;
drop policy if exists "auth_all_members"              on members;
drop policy if exists "auth_all_assignments"          on assignments;
drop policy if exists "auth_all_project_tier_history" on project_tier_history;

create policy "auth_all_projects"             on projects             for all using (auth.role() = 'authenticated');
create policy "auth_all_members"              on members              for all using (auth.role() = 'authenticated');
create policy "auth_all_assignments"          on assignments          for all using (auth.role() = 'authenticated');
create policy "auth_all_project_tier_history" on project_tier_history for all using (auth.role() = 'authenticated');
