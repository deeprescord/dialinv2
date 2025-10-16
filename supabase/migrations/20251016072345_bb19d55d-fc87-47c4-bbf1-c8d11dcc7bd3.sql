-- Ensure owner_id is set correctly and consistently for file inserts
-- 1) Function to set owner_id from the authenticated user
create or replace function public.set_files_owner_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Enforce that the row belongs to the authenticated user
  if auth.uid() is null then
    raise exception 'Must be authenticated to create files';
  end if;

  if new.owner_id is distinct from auth.uid() then
    new.owner_id := auth.uid();
  end if;
  return new;
end;
$$;

-- 2) Trigger to apply the function before insert
-- Drop trigger if it exists to avoid duplicates
drop trigger if exists set_files_owner_id_before_insert on public.files;
create trigger set_files_owner_id_before_insert
before insert on public.files
for each row execute function public.set_files_owner_id();

-- 3) Add/ensure INSERT and SELECT policies for authenticated users without failing if already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'files' AND policyname = 'Auth users can insert files they own'
  ) THEN
    EXECUTE 'create policy "Auth users can insert files they own" on public.files for insert to authenticated with check (owner_id = auth.uid())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'files' AND policyname = 'Owners can select their files'
  ) THEN
    EXECUTE 'create policy "Owners can select their files" on public.files for select to authenticated using (owner_id = auth.uid())';
  END IF;
END $$;

-- 4) Ensure updated_at stays fresh for updates
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists update_files_updated_at on public.files;
create trigger update_files_updated_at
before update on public.files
for each row execute function public.update_updated_at_column();
