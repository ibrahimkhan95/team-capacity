-- Run this in your Supabase SQL editor

create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  seniority   text not null default 'Mid',
  squad       text not null,
  status      text not null default 'On Project',
  notes       text not null default '',
  created_at  timestamptz default now()
);

create table if not exists assignments (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references members(id) on delete cascade not null,
  project     text not null,
  engagement  text not null default 'Full Time (100%)',
  pct         integer not null default 100,
  start_date  date,
  end_date    date,
  notes       text not null default '',
  created_at  timestamptz default now()
);

-- Enable RLS
alter table members     enable row level security;
alter table assignments enable row level security;

-- Allow authenticated users full access
create policy "auth_all_members"     on members     for all using (auth.role() = 'authenticated');
create policy "auth_all_assignments" on assignments for all using (auth.role() = 'authenticated');
