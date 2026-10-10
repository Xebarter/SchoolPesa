-- Run in the Supabase SQL editor after the School Pesa schema is installed.
-- The matching Supabase Auth account must already exist.

do $$
declare
  target_user auth.users%rowtype;
  display_name text;
begin
  select *
  into target_user
  from auth.users
  where lower(email) = lower('sebenock027@gmail.com')
  for update;

  if not found then
    raise exception 'No Supabase Auth account found for sebenock027@gmail.com. Create the account first, then run this script again.';
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'Super Admin')
  where id = target_user.id;

  display_name := coalesce(
    nullif(target_user.raw_user_meta_data->>'full_name', ''),
    nullif(target_user.raw_user_meta_data->>'name', ''),
    split_part(target_user.email, '@', 1)
  );

  update public.users
  set role = 'Super Admin',
      updated_at = now()
  where lower(email) = lower(target_user.email);

  if not found then
    insert into public.users (id, name, email, role)
    values (target_user.id::text, display_name, target_user.email, 'Super Admin');
  end if;
end
$$;
