-- Runtime fields and donor-specific data used by server actions.
-- Run after 0001schema.sql in the Supabase SQL Editor. Safe to run repeatedly.

alter table public.campaigns
  add column if not exists owner_email text;

alter table public.beneficiaries
  add column if not exists owner_email text;

alter table public.notifications
  add column if not exists email text,
  add column if not exists kind text,
  add column if not exists href text;

create table if not exists public.donor_settings (
  email text primary key,
  email_updates boolean not null default true,
  receipt_emails boolean not null default true,
  digest boolean not null default true,
  product_news boolean not null default false,
  anonymous_default boolean not null default true,
  public_recognition boolean not null default false,
  update_cadence text not null default 'instant'
    check (update_cadence in ('instant', 'weekly', 'off'))
);

create table if not exists public.campaign_links (
  email text not null,
  campaign_id text not null references public.campaigns (id) on delete cascade,
  note text not null default '',
  hidden boolean not null default false,
  primary key (email, campaign_id)
);

create table if not exists public.sponsorships (
  email text not null,
  beneficiary_id text not null references public.beneficiaries (id) on delete cascade,
  note text not null default '',
  hidden boolean not null default false,
  primary key (email, beneficiary_id)
);

create table if not exists public.donor_updates (
  id text primary key,
  email text not null,
  title text not null,
  body text not null,
  date date not null default current_date,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'changes', 'published', 'declined')),
  campaign_id text references public.campaigns (id) on delete set null,
  beneficiary_id text references public.beneficiaries (id) on delete set null,
  review_note text not null default '',
  story_id text references public.stories (id) on delete set null,
  category text not null default 'Success Stories'
);

alter table public.donor_settings enable row level security;
alter table public.campaign_links enable row level security;
alter table public.sponsorships enable row level security;
alter table public.donor_updates enable row level security;

revoke all on public.donor_settings, public.campaign_links, public.sponsorships, public.donor_updates
  from anon, authenticated;
grant all on public.donor_settings, public.campaign_links, public.sponsorships, public.donor_updates
  to service_role;

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true), ('avatars', 'avatars', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public gallery assets" on storage.objects;
create policy "public gallery assets" on storage.objects
for select to anon, authenticated
using (bucket_id = 'gallery');
