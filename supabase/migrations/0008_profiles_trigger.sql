-- PrepSprint · 0008 · profile creation
--
-- Gives every new auth user a profile row, so the app never has to branch on
-- a missing profile.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill anyone who signed up before this trigger existed. Without it, a
-- user created between running 0002 and 0008 never gets a profile row.
insert into public.profiles (id, email, name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;
