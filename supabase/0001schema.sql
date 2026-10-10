-- School Pesa database for Supabase.
-- Run this entire file in the Supabase SQL editor. It is safe to run again.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in (
    'Super Admin', 'Finance Admin', 'Campaign Manager', 'Content Manager', 'Auditor', 'Viewer'
  )),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role text primary key,
  permissions text[] not null
);

create table if not exists public.beneficiaries (
  id text primary key,
  display_name text not null,
  level text not null check (level in ('Nursery', 'Primary', 'Secondary', 'University')),
  school text,
  location text,
  story text,
  needs text,
  target bigint not null default 0 check (target >= 0),
  raised bigint not null default 0 check (raised >= 0),
  image text,
  public_profile boolean not null default false,
  public_image boolean not null default false,
  story_visible boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  updates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  story text,
  category text,
  level text check (level in ('Nursery', 'Primary', 'Secondary', 'University')),
  location text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  target bigint not null default 0 check (target >= 0),
  raised bigint not null default 0 check (raised >= 0),
  donors integer not null default 0 check (donors >= 0),
  deadline date,
  created_at date,
  image text,
  gallery jsonb not null default '[]'::jsonb,
  video text,
  beneficiary_id text references public.beneficiaries (id) on delete set null,
  seo_title text,
  seo_description text,
  updates jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.donations (
  id text primary key,
  donor_name text not null,
  anonymous boolean not null default false,
  email text,
  phone text,
  amount bigint not null check (amount >= 0),
  frequency text not null check (frequency in ('one-time', 'monthly')),
  campaign_id text references public.campaigns (id) on delete set null,
  beneficiary_id text references public.beneficiaries (id) on delete set null,
  support_target text not null check (support_target in ('campaign', 'child', 'general')),
  method text not null default 'Mobile money',
  transaction_id text not null unique,
  external_id text unique,
  date date not null default current_date,
  status text not null default 'Processing' check (status in (
    'Pending', 'Processing', 'Successful', 'Failed', 'Cancelled', 'Refunded'
  )),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  donation_id text not null references public.donations (id) on delete cascade,
  provider text not null default 'Mobile money',
  reference text not null,
  amount bigint not null check (amount >= 0),
  status text not null check (status in (
    'Pending', 'Processing', 'Successful', 'Failed', 'Cancelled', 'Refunded'
  )),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.stories (
  id text primary key,
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  category text,
  author text,
  date date,
  image text,
  gallery jsonb not null default '[]'::jsonb,
  campaign_id text references public.campaigns (id) on delete set null,
  beneficiary_id text references public.beneficiaries (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  views integer not null default 0 check (views >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id text primary key,
  src text not null,
  alt text,
  caption text,
  category text,
  campaign_id text references public.campaigns (id) on delete set null,
  story_id text references public.stories (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id text primary key,
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  category text,
  date date,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id text primary key,
  name text not null,
  date date,
  time text,
  location text,
  description text,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists public.partners (
  id text primary key,
  name text not null,
  logo_url text
);

create table if not exists public.volunteers (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  skills text,
  interest text,
  availability text,
  message text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'accepted')),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  date date not null default current_date,
  category text not null,
  campaign_id text references public.campaigns (id) on delete set null,
  description text,
  amount bigint not null check (amount >= 0),
  supplier text,
  receipt text,
  status text not null default 'recorded' check (status in ('recorded', 'approved', 'paid')),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  title text not null,
  body text,
  date date not null default current_date,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id text primary key,
  question text not null,
  answer text not null,
  topic text
);

create table if not exists public.audit_logs (
  id text primary key,
  "user" text not null,
  action text not null,
  resource text not null,
  date date not null default current_date,
  time text,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.donation_series (
  month text primary key,
  amount numeric not null
);

create table if not exists public.level_split (
  name text primary key,
  value integer not null check (value >= 0)
);

create table if not exists public.impact_stats (
  id integer primary key check (id = 1),
  children_supported integer not null default 0,
  funds_raised bigint not null default 0,
  schools_reached integer not null default 0,
  campaigns_completed integer not null default 0,
  scholarships integer not null default 0,
  books integer not null default 0,
  uniforms integer not null default 0,
  this_month bigint not null default 0,
  active_campaigns integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id text primary key,
  name text,
  email text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter (
  id text primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id text primary key,
  event_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists donations_email_idx on public.donations (email);
create index if not exists donations_status_idx on public.donations (status);
create index if not exists donations_campaign_idx on public.donations (campaign_id);
create index if not exists donations_beneficiary_idx on public.donations (beneficiary_id);
create index if not exists transactions_reference_idx on public.transactions (reference);
create index if not exists transactions_donation_idx on public.transactions (donation_id);
create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists stories_status_idx on public.stories (status);
create index if not exists volunteers_email_idx on public.volunteers (email);
create index if not exists expenses_campaign_idx on public.expenses (campaign_id);
create index if not exists audit_logs_date_idx on public.audit_logs (date desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_touch on public.users;
create trigger users_touch before update on public.users
for each row execute function public.touch_updated_at();

drop trigger if exists beneficiaries_touch on public.beneficiaries;
create trigger beneficiaries_touch before update on public.beneficiaries
for each row execute function public.touch_updated_at();

drop trigger if exists campaigns_touch on public.campaigns;
create trigger campaigns_touch before update on public.campaigns
for each row execute function public.touch_updated_at();

drop trigger if exists donations_touch on public.donations;
create trigger donations_touch before update on public.donations
for each row execute function public.touch_updated_at();

drop trigger if exists stories_touch on public.stories;
create trigger stories_touch before update on public.stories
for each row execute function public.touch_updated_at();

drop trigger if exists news_touch on public.news;
create trigger news_touch before update on public.news
for each row execute function public.touch_updated_at();

drop trigger if exists impact_touch on public.impact_stats;
create trigger impact_touch before update on public.impact_stats
for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
for each row execute function public.touch_updated_at();

-- Apply a payment callback. Pass the gift reference and the new status.
-- Successful gifts increase campaign, learner, and impact totals once.
create or replace function public.apply_payment_status(p_reference text, p_status text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.donations%rowtype;
begin
  if p_status not in ('Pending', 'Processing', 'Successful', 'Failed', 'Cancelled', 'Refunded') then
    raise exception 'Unknown payment status';
  end if;

  select * into row
  from public.donations
  where transaction_id = p_reference or external_id = p_reference
  for update;

  if not found then
    return 'missing';
  end if;

  if row.status = p_status then
    return row.status;
  end if;

  update public.donations set status = p_status where id = row.id;
  update public.transactions set status = p_status where donation_id = row.id;

  if p_status = 'Successful' and row.status <> 'Successful' then
    if row.campaign_id is not null then
      update public.campaigns
      set raised = raised + row.amount, donors = donors + 1
      where id = row.campaign_id;
    end if;
    if row.beneficiary_id is not null then
      update public.beneficiaries
      set raised = raised + row.amount
      where id = row.beneficiary_id;
    end if;
    update public.impact_stats
    set funds_raised = funds_raised + row.amount, this_month = this_month + row.amount
    where id = 1;
  elsif row.status = 'Successful' and p_status <> 'Successful' then
    if row.campaign_id is not null then
      update public.campaigns
      set raised = greatest(raised - row.amount, 0), donors = greatest(donors - 1, 0)
      where id = row.campaign_id;
    end if;
    if row.beneficiary_id is not null then
      update public.beneficiaries
      set raised = greatest(raised - row.amount, 0)
      where id = row.beneficiary_id;
    end if;
    update public.impact_stats
    set funds_raised = greatest(funds_raised - row.amount, 0)
    where id = 1;
  end if;

  insert into public.audit_logs (id, "user", action, resource, date, time, details)
  values (
    'a-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
    'System',
    'updated',
    'Donation',
    current_date,
    to_char(now(), 'HH12:MI AM'),
    'Payment ' || row.transaction_id || ' marked ' || p_status
  );

  return p_status;
end;
$$;

revoke all on function public.apply_payment_status(text, text) from public;
grant execute on function public.apply_payment_status(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Access
-- Public visitors can read published content and submit forms.
-- Gift, finance, and staff tables stay closed to the anon key.
-- The server should use the service role for donations and admin writes.
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.role_permissions enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.campaigns enable row level security;
alter table public.donations enable row level security;
alter table public.transactions enable row level security;
alter table public.stories enable row level security;
alter table public.gallery enable row level security;
alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.partners enable row level security;
alter table public.volunteers enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.faqs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.donation_series enable row level security;
alter table public.level_split enable row level security;
alter table public.impact_stats enable row level security;
alter table public.contacts enable row level security;
alter table public.newsletter enable row level security;
alter table public.event_registrations enable row level security;
alter table public.settings enable row level security;

drop policy if exists "public campaigns" on public.campaigns;
create policy "public campaigns" on public.campaigns
for select to anon, authenticated
using (status in ('active', 'completed'));

drop policy if exists "public beneficiaries" on public.beneficiaries;
create policy "public beneficiaries" on public.beneficiaries
for select to anon, authenticated
using (public_profile = true);

drop policy if exists "public stories" on public.stories;
create policy "public stories" on public.stories
for select to anon, authenticated
using (status = 'published');

drop policy if exists "public gallery" on public.gallery;
create policy "public gallery" on public.gallery
for select to anon, authenticated using (true);

drop policy if exists "public news" on public.news;
create policy "public news" on public.news
for select to anon, authenticated using (true);

drop policy if exists "public events" on public.events;
create policy "public events" on public.events
for select to anon, authenticated using (true);

drop policy if exists "public partners" on public.partners;
create policy "public partners" on public.partners
for select to anon, authenticated using (true);

drop policy if exists "public faqs" on public.faqs;
create policy "public faqs" on public.faqs
for select to anon, authenticated using (true);

drop policy if exists "public roles" on public.role_permissions;
create policy "public roles" on public.role_permissions
for select to anon, authenticated using (true);

drop policy if exists "public series" on public.donation_series;
create policy "public series" on public.donation_series
for select to anon, authenticated using (true);

drop policy if exists "public levels" on public.level_split;
create policy "public levels" on public.level_split
for select to anon, authenticated using (true);

drop policy if exists "public impact" on public.impact_stats;
create policy "public impact" on public.impact_stats
for select to anon, authenticated using (true);

drop policy if exists "public settings" on public.settings;
create policy "public settings" on public.settings
for select to anon, authenticated
using (key in ('name', 'logo', 'description', 'contact', 'address', 'currency'));

drop policy if exists "submit contact" on public.contacts;
create policy "submit contact" on public.contacts
for insert to anon, authenticated
with check (name is not null and email is not null and message is not null);

drop policy if exists "join newsletter" on public.newsletter;
create policy "join newsletter" on public.newsletter
for insert to anon, authenticated
with check (email is not null);

drop policy if exists "submit volunteer" on public.volunteers;
create policy "submit volunteer" on public.volunteers
for insert to anon, authenticated
with check (name is not null and email is not null and status = 'new');

drop policy if exists "register event" on public.event_registrations;
create policy "register event" on public.event_registrations
for insert to anon, authenticated
with check (event_name is not null);

-- ---------------------------------------------------------------------------
-- Starter data
-- ---------------------------------------------------------------------------

insert into public.role_permissions (role, permissions) values
  ('Super Admin', array['Manage organization', 'Manage users', 'Approve finance', 'Publish campaigns', 'View audit log']),
  ('Finance Admin', array['Approve finance', 'View donations', 'View expenses']),
  ('Campaign Manager', array['Publish campaigns', 'Manage beneficiaries']),
  ('Content Manager', array['Publish stories', 'Manage gallery', 'Manage news']),
  ('Auditor', array['View audit log', 'View donations', 'View expenses']),
  ('Viewer', array['View public site'])
on conflict (role) do update set permissions = excluded.permissions;

insert into public.users (id, name, email, role, phone) values
  ('u1', 'Sarah Nakato', 'sarah@schoolpesa.example', 'Super Admin', '+256 700 000 001'),
  ('u2', 'John Okello', 'john@schoolpesa.example', 'Campaign Manager', null),
  ('u3', 'Achieng Finance', 'finance@schoolpesa.example', 'Finance Admin', null),
  ('u4', 'Rita Content', 'rita@schoolpesa.example', 'Content Manager', null),
  ('u5', 'Paul Auditor', 'paul@schoolpesa.example', 'Auditor', null)
on conflict (id) do nothing;

insert into public.beneficiaries (
  id, display_name, level, school, location, story, needs, target, raised, image,
  public_profile, public_image, story_visible, status, updates
) values
  ('ben-1', 'Amina', 'Primary', 'Community primary school', 'Kampala',
   'Amina loves reading aloud. Her family can cover food at home, but school fees and books still stand between her and the next term.',
   'School fees and books', 1200000, 640000, '/school-pesa-hero.png', true, true, true, 'active',
   '[{"title":"Books received","body":"Amina received a new reader and exercise books.","date":"2026-09-12"}]'::jsonb),
  ('ben-2', 'Brian', 'Secondary', 'District secondary school', 'Central Uganda',
   'Brian is in senior school and boards during term. Tuition and meals are the gap his family cannot close alone.',
   'Tuition and meals', 2400000, 900000, '/school-pesa-hero.png', true, true, true, 'active',
   '[{"title":"Term started","body":"Brian reported for the new term with part of his tuition covered.","date":"2026-08-30"}]'::jsonb),
  ('ben-3', 'Grace', 'University', 'Public university', 'Eastern Uganda',
   'Grace earned a university place. Tuition support is what keeps her enrolled this semester.',
   'Tuition support', 3500000, 1800000, '/school-pesa-hero.png', true, true, true, 'active',
   '[{"title":"Semester confirmed","body":"Grace’s faculty confirmed she is registered for the semester.","date":"2026-09-05"}]'::jsonb)
on conflict (id) do nothing;

insert into public.campaigns (
  id, slug, title, summary, description, story, category, level, location, status,
  target, raised, donors, deadline, created_at, image, gallery, beneficiary_id, seo_title, seo_description, updates
) values
  ('camp-1', 'back-to-school-2027', 'Back to School 2027',
   'Help provide school fees, uniforms and learning materials for children preparing to return to school.',
   'This campaign covers school fees, uniforms, shoes and learning materials for primary learners returning to class in 2027.',
   'For many families, the cost of returning to school arrives all at once. Fees, a uniform, a bag and a few books can decide whether a child walks into class or stays home.',
   'School Fees', 'Primary', 'Kampala', 'active', 25000000, 16850000, 184, '2027-02-01', '2026-08-12',
   '/school-pesa-hero.png', '["/school-pesa-hero.png"]'::jsonb, 'ben-1',
   'Back to School 2027', 'School fees, uniforms and learning materials for children preparing to return to school.',
   '[{"id":"u1","title":"School supplies delivered","body":"50 children received books and school bags.","date":"2026-09-18"},{"id":"u2","title":"Uniform fitting day","body":"Tailors measured 32 learners for new uniforms.","date":"2026-09-02"}]'::jsonb),
  ('camp-2', 'university-dreams', 'University Dreams',
   'Help students from vulnerable backgrounds continue their university education.',
   'University Dreams funds tuition, accommodation and learning materials for students who have earned a place at university.',
   'A university place is a beginning, not a finish. This campaign keeps students in lecture halls when fees would otherwise send them home.',
   'Scholarships', 'University', 'Eastern Uganda', 'active', 15000000, 9400000, 96, '2026-12-15', '2026-07-03',
   '/school-pesa-hero.png', '["/school-pesa-hero.png"]'::jsonb, 'ben-3',
   'University Dreams', 'Tuition support for students continuing university.',
   '[{"id":"u3","title":"Semester fees posted","body":"Tuition for 8 students was sent directly to their universities.","date":"2026-08-20"}]'::jsonb),
  ('camp-3', 'books-for-100-children', 'Books for 100 Children',
   'Put a new story, lesson and possibility into the hands of every learner.',
   'A set of readers, exercise books and a school bag for 100 children.',
   'A book is small. For a child who has been sharing one torn reader with three classmates, it changes the day.',
   'Books', 'Primary', 'Central Uganda', 'active', 5000000, 4720000, 71, '2026-11-01', '2026-06-21',
   '/school-pesa-hero.png', '["/school-pesa-hero.png"]'::jsonb, null,
   'Books for 100 Children', 'Readers and exercise books for 100 children.',
   '[{"id":"u4","title":"First book drop","body":"40 children received a new reader and two exercise books.","date":"2026-09-10"}]'::jsonb),
  ('camp-4', 'school-uniforms-primary', 'School Uniforms for Primary Learners',
   'A complete uniform, shoes and a school bag so children can walk into class with dignity.',
   'Uniforms are often the reason a child misses the first weeks of term.',
   'When the uniform is ready, the walk to school starts again.',
   'Uniforms', 'Primary', 'Wakiso', 'active', 8000000, 2150000, 44, '2026-10-30', '2026-09-01',
   '/school-pesa-hero.png', '["/school-pesa-hero.png"]'::jsonb, null,
   'School Uniforms for Primary Learners', 'Uniforms, shoes and bags for primary learners.',
   '[]'::jsonb),
  ('camp-5', 'nursery-meals', 'Meals for Nursery Learners',
   'A daily meal so the youngest learners can stay through the school day.',
   'This completed campaign provided meals for a nursery class through one term.',
   'A full plate at midday kept children in the classroom instead of walking home hungry.',
   'Meals', 'Nursery', 'Jinja', 'completed', 3000000, 3000000, 58, '2026-06-30', '2026-03-02',
   '/school-pesa-hero.png', '["/school-pesa-hero.png"]'::jsonb, null,
   'Meals for Nursery Learners', 'Daily meals for a nursery class.',
   '[{"id":"u5","title":"Term meals completed","body":"Every nursery learner in the class received a meal each school day.","date":"2026-06-28"}]'::jsonb)
on conflict (id) do nothing;

insert into public.donations (
  id, donor_name, anonymous, email, phone, amount, frequency, campaign_id, beneficiary_id,
  support_target, method, transaction_id, date, status, message
) values
  ('d1', 'Sarah Nakato', false, 'sarah@example.com', '+256 700 000 010', 50000, 'one-time', 'camp-1', null, 'campaign', 'Mobile money', 'TX-10021', '2026-09-21', 'Successful', 'For the new term.'),
  ('d2', 'Anonymous', true, 'hidden@example.com', '', 100000, 'monthly', 'camp-2', null, 'campaign', 'Card', 'TX-10044', '2026-09-18', 'Successful', null),
  ('d3', 'James Otim', false, 'james@example.com', '+256 700 000 011', 20000, 'one-time', null, 'ben-1', 'child', 'Mobile money', 'TX-10058', '2026-09-14', 'Processing', null),
  ('d4', 'Lydia Achen', false, 'lydia@example.com', '+256 700 000 012', 250000, 'one-time', null, null, 'general', 'Bank transfer', 'TX-10063', '2026-09-09', 'Pending', null),
  ('d5', 'Peter Mugisha', false, 'peter@example.com', '+256 700 000 013', 50000, 'one-time', 'camp-3', null, 'campaign', 'Mobile money', 'TX-10070', '2026-08-30', 'Failed', null),
  ('d6', 'Grace Donor', false, 'grace.donor@example.com', '+256 700 000 014', 100000, 'one-time', 'camp-4', null, 'campaign', 'Card', 'TX-10081', '2026-08-12', 'Refunded', null)
on conflict (id) do nothing;

insert into public.transactions (id, donation_id, provider, reference, amount, status, date) values
  ('pt-d1', 'd1', 'Mobile money', 'TX-10021', 50000, 'Successful', '2026-09-21'),
  ('pt-d2', 'd2', 'Card', 'TX-10044', 100000, 'Successful', '2026-09-18'),
  ('pt-d3', 'd3', 'Mobile money', 'TX-10058', 20000, 'Processing', '2026-09-14'),
  ('pt-d4', 'd4', 'Bank transfer', 'TX-10063', 250000, 'Pending', '2026-09-09'),
  ('pt-d5', 'd5', 'Mobile money', 'TX-10070', 50000, 'Failed', '2026-08-30'),
  ('pt-d6', 'd6', 'Card', 'TX-10081', 100000, 'Refunded', '2026-08-12')
on conflict (id) do nothing;

insert into public.stories (
  id, slug, title, excerpt, body, category, author, date, image, gallery, campaign_id, beneficiary_id, status, views
) values
  ('st-1', 'from-a-school-uniform-to-a-university-dream', 'From a School Uniform to a University Dream',
   'Amina had almost given up. Then her community showed up with the fees, books and a uniform that got her back to class.',
   'Amina had almost given up on the next term. Neighbours and donors covered the fees, a new uniform and a set of books. She is back in class.',
   'Success Stories', 'School Pesa', '2026-09-20', '/school-pesa-hero.png', '["/school-pesa-hero.png"]'::jsonb, 'camp-1', 'ben-1', 'published', 1280),
  ('st-2', 'a-new-beginning', 'A New Beginning',
   'When a classroom opens its doors, a whole community steps forward.',
   'The first day of term is loud. This story follows one classroom as fees and supplies arrived before the bell.',
   'Community', 'School Pesa', '2026-09-04', '/school-pesa-hero.png', '["/school-pesa-hero.png"]'::jsonb, 'camp-1', null, 'published', 860),
  ('st-3', 'what-a-school-bag-can-change', 'What a School Bag Can Change',
   'The right tools can turn a difficult morning into a day of possibility.',
   'A school bag is ordinary until you do not have one. This is a story about bags, books and the small dignity of being prepared.',
   'School Requirements', 'School Pesa', '2026-08-16', '/school-pesa-hero.png', '["/school-pesa-hero.png"]'::jsonb, 'camp-3', null, 'published', 640),
  ('st-4', 'from-classroom-to-campus', 'From Classroom to Campus',
   'Grace carried a primary-school dream all the way to a university registration desk.',
   'A scholarship covered the semester that would have ended Grace’s path to campus. She is in class, and the next fee date is already on the calendar.',
   'Scholarships', 'School Pesa', '2026-08-02', '/school-pesa-hero.png', '["/school-pesa-hero.png"]'::jsonb, 'camp-2', 'ben-3', 'published', 990),
  ('st-5', 'a-scholarship-that-changed-everything', 'A Scholarship That Changed Everything',
   'One year of tuition kept a student in school and changed what the family believed was possible.',
   'Scholarships at School Pesa are practical. They name the fee, the term and the student.',
   'Students', 'School Pesa', '2026-07-11', '/school-pesa-hero.png', '["/school-pesa-hero.png"]'::jsonb, null, null, 'published', 540)
on conflict (id) do nothing;

insert into public.gallery (id, src, alt, caption, category, campaign_id, story_id) values
  ('g1', '/school-pesa-hero.png', 'Children learning together in a classroom', 'A morning lesson in a primary classroom.', 'Learning', 'camp-1', 'st-1'),
  ('g2', '/school-pesa-hero.png', 'Learners seated at wooden desks', 'Desks filled for the new term.', 'Children', 'camp-1', null),
  ('g3', '/school-pesa-hero.png', 'A teacher with a class', 'A teacher moving between rows.', 'Schools', null, null),
  ('g4', '/school-pesa-hero.png', 'Open storybooks on a desk', 'New readers on the front desk.', 'School Supplies', 'camp-3', null),
  ('g5', '/school-pesa-hero.png', 'Students in class', 'Scholarship students back on campus.', 'Scholarships', 'camp-2', null),
  ('g6', '/school-pesa-hero.png', 'A community classroom', 'Families gathered for a school day.', 'Communities', null, null),
  ('g7', '/school-pesa-hero.png', 'Classroom during an event', 'A reading afternoon with visitors.', 'Events', null, null)
on conflict (id) do nothing;

insert into public.news (id, slug, title, excerpt, body, category, date, image) values
  ('n1', 'back-to-school-2027-is-open', 'Back to School 2027 is open',
   'Fees, uniforms and books are now in one campaign for the coming school year.',
   'Back to School 2027 is open for contributions. The campaign lists fees, uniforms and learning materials as separate needs.',
   'Campaigns', '2026-09-22', '/school-pesa-hero.png'),
  ('n2', 'how-we-report-impact', 'How we report impact',
   'Every allocation is tied to a campaign, a need and a short update.',
   'School Pesa reports impact as a path: funds raised, education support, school requirements, a child in school.',
   'Impact', '2026-08-28', '/school-pesa-hero.png'),
  ('n3', 'reading-afternoon-in-kampala', 'Reading afternoon in Kampala',
   'Volunteers spent a Saturday with primary learners and a new set of readers.',
   'A Saturday reading afternoon brought volunteers into a Kampala classroom. The books stayed at the school.',
   'Events', '2026-07-19', '/school-pesa-hero.png')
on conflict (id) do nothing;

insert into public.events (id, name, date, time, location, description, image) values
  ('e1', 'Saturday reading club', '2026-10-18', '10:00 – 12:00', 'Kampala', 'Read with primary learners and help them take a book home for the week.', '/school-pesa-hero.png'),
  ('e2', 'Back to school briefing', '2026-11-02', '14:00 – 15:30', 'Online', 'A short briefing on the 2027 campaign, what has been raised, and what is still needed.', '/school-pesa-hero.png'),
  ('e3', 'Partner classroom visit', '2026-11-20', '09:00 – 13:00', 'Wakiso', 'Partners visit a supported classroom and hear from teachers about the term.', '/school-pesa-hero.png')
on conflict (id) do nothing;

insert into public.partners (id, name) values
  ('p1', 'Classroom Circle'),
  ('p2', 'North Bridge Fund'),
  ('p3', 'Lakeview Schools'),
  ('p4', 'Open Desk')
on conflict (id) do nothing;

insert into public.volunteers (id, name, email, phone, skills, interest, availability, message, status) values
  ('v1', 'Daniel Kato', 'daniel@example.com', '+256 700 111 222', 'Teaching, mentoring', 'Reading support', 'Weekends', 'I can help with Saturday reading clubs.', 'reviewing'),
  ('v2', 'Mary Adong', 'mary@example.com', '+256 700 333 444', 'Bookkeeping', 'Finance support', 'Evenings', 'Happy to help review expense records.', 'new')
on conflict (id) do nothing;

insert into public.expenses (id, date, category, campaign_id, description, amount, supplier, receipt, status) values
  ('x1', '2026-09-18', 'Books', 'camp-3', 'Readers and exercise books', 1800000, 'Kampala Book House', 'RCP-221', 'paid'),
  ('x2', '2026-09-02', 'Uniforms', 'camp-4', 'Uniform fabric and tailoring', 960000, 'Uniform Co-op', 'RCP-228', 'approved'),
  ('x3', '2026-08-20', 'Tuition', 'camp-2', 'Semester fees for 8 students', 4200000, 'Public university', 'RCP-214', 'paid')
on conflict (id) do nothing;

insert into public.notifications (id, title, body, date, read) values
  ('nt1', 'Campaign update', 'Back to School 2027 posted: school supplies delivered.', '2026-09-18', false),
  ('nt2', 'Receipt ready', 'Your UGX 50,000 gift to Back to School 2027 is listed in My Donations.', '2026-09-21', true),
  ('nt3', 'Impact story', 'A new story was published: From a School Uniform to a University Dream.', '2026-09-20', false)
on conflict (id) do nothing;

insert into public.faqs (id, topic, question, answer) values
  ('f1', 'Donations', 'How do donations work?', 'You choose an amount, who you want to support, and your contact details. School Pesa sends a mobile money prompt to your phone. The gift is confirmed when you approve it.'),
  ('f2', 'Funds', 'How are funds used?', 'Gifts are allocated to a campaign or a learner’s stated education need: fees, books, uniforms, meals, technology or accommodation. Expenses are recorded against that allocation.'),
  ('f3', 'Sponsorship', 'What does sponsorship mean?', 'Sponsoring a child means supporting a privacy-safe learner profile. You see a display name, education level, general location and the need. You do not see sensitive personal records.'),
  ('f4', 'Campaigns', 'How are campaigns chosen?', 'Campaigns describe a practical education need with a target, a deadline and updates. Administrators can draft, publish, pause, complete or archive them.'),
  ('f5', 'Payments', 'Which payment methods are available?', 'Gifts are collected by a mobile money prompt sent to the number you enter. Approve the prompt on your phone to complete the gift.'),
  ('f6', 'Receipts', 'Will I get a receipt?', 'Confirmed gifts appear in your donor dashboard. Open the receipt from that list after the payment is confirmed.'),
  ('f7', 'Recurring', 'Can I give monthly?', 'Yes. Choose a monthly gift and approve the prompt on your phone. Each collection uses the same mobile number.'),
  ('f8', 'Privacy', 'How is learner privacy protected?', 'Public profiles use a display name and a general location. Photos and stories are published only when an administrator marks them as public.'),
  ('f9', 'Volunteering', 'How do I volunteer?', 'Use the volunteer form to share your skills, availability and area of interest. The team reviews applications and replies by email.')
on conflict (id) do update set answer = excluded.answer, question = excluded.question, topic = excluded.topic;

insert into public.audit_logs (id, "user", action, resource, date, time, details) values
  ('a1', 'John Okello', 'created', 'Campaign', '2026-10-03', '10:42 AM', 'John created campaign "Back to School 2027"'),
  ('a2', 'Achieng Finance', 'approved', 'Expense', '2026-10-02', '4:15 PM', 'Achieng approved expense RCP-228'),
  ('a3', 'Rita Content', 'published', 'Story', '2026-09-20', '9:05 AM', 'Rita published "From a School Uniform to a University Dream"'),
  ('a4', 'Sarah Nakato', 'updated', 'Settings', '2026-09-12', '11:20 AM', 'Sarah updated organization contact details')
on conflict (id) do nothing;

insert into public.donation_series (month, amount) values
  ('Apr', 18), ('May', 22), ('Jun', 31), ('Jul', 28), ('Aug', 36), ('Sep', 42)
on conflict (month) do nothing;

insert into public.level_split (name, value) values
  ('Nursery', 12), ('Primary', 46), ('Secondary', 24), ('University', 18)
on conflict (name) do nothing;

insert into public.impact_stats (
  id, children_supported, funds_raised, schools_reached, campaigns_completed,
  scholarships, books, uniforms, this_month, active_campaigns
) values (
  1, 1248, 385000000, 34, 86, 420, 2800, 1100, 24500000, 18
) on conflict (id) do nothing;

insert into public.settings (key, value) values
  ('name', 'School Pesa'),
  ('logo', '/web-app-manifest-192x192.png'),
  ('description', 'Supporting education. Changing futures.'),
  ('contact', 'hello@schoolpesa.example'),
  ('address', 'Kampala, Uganda'),
  ('currency', 'UGX'),
  ('receiptPrefix', 'SP')
on conflict (key) do update set value = excluded.value;
