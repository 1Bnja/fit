-- Gym Tracker PWA schema. Run via Supabase MCP (execute_sql / apply_migration).

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  apellido text,
  username text unique,
  peso_kg numeric,
  estatura_cm numeric,
  avatar_url text,
  onboarding_completo boolean default false,
  created_at timestamptz default now()
);

create table if not exists rutinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  nombre text not null,
  created_at timestamptz default now()
);

create table if not exists ejercicios_custom (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  nombre text not null,
  categoria text not null,
  created_at timestamptz default now()
);

create table if not exists rutina_ejercicios (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid references rutinas(id) on delete cascade,
  ejercicio_id text not null,
  ejercicio_nombre text not null,
  es_custom boolean default false,
  orden int default 0
);

create table if not exists rutina_dias (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid references rutinas(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  dia_semana int not null check (dia_semana between 0 and 6)
);

-- Historial de peso levantado por ejercicio, para trackear progreso.
-- Se ancla al ejercicio (ejercicio_id/nombre), no a la fila de rutina_ejercicios,
-- para que el progreso sobreviva si el ejercicio se quita de una rutina.
create table if not exists registros_ejercicio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  ejercicio_id text not null,
  ejercicio_nombre text not null,
  peso_kg numeric not null,
  reps int,
  created_at timestamptz default now()
);

create index if not exists registros_ejercicio_user_ejercicio_idx
  on registros_ejercicio (user_id, ejercicio_id, created_at desc);

-- Grupos de entrenamiento: unirse por código de invitación, ver actividad,
-- progreso y rutinas de los demás miembros.
create table if not exists grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text not null unique,
  creado_por uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists grupo_miembros (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references grupos(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  unique (grupo_id, user_id)
);

alter table profiles enable row level security;
alter table rutinas enable row level security;
alter table ejercicios_custom enable row level security;
alter table rutina_ejercicios enable row level security;
alter table rutina_dias enable row level security;
alter table registros_ejercicio enable row level security;
alter table grupos enable row level security;
alter table grupo_miembros enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

create policy "rutinas_all_own" on rutinas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ejercicios_custom_all_own" on ejercicios_custom for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rutina_ejercicios_all_own" on rutina_ejercicios for all
  using (exists (select 1 from rutinas r where r.id = rutina_ejercicios.rutina_id and r.user_id = auth.uid()))
  with check (exists (select 1 from rutinas r where r.id = rutina_ejercicios.rutina_id and r.user_id = auth.uid()));

create policy "rutina_dias_all_own" on rutina_dias for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "registros_ejercicio_all_own" on registros_ejercicio for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bypasses RLS on purpose: lets a policy check membership/shared-group
-- without the self-referencing recursion a plain RLS subquery would hit.
create or replace function public.is_grupo_member(p_grupo_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from grupo_miembros
    where grupo_id = p_grupo_id and user_id = auth.uid()
  );
$$;

create or replace function public.comparte_grupo_con(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from grupo_miembros gm1
    join grupo_miembros gm2 on gm1.grupo_id = gm2.grupo_id
    where gm1.user_id = auth.uid() and gm2.user_id = p_user_id
  );
$$;

-- creado_por = auth.uid() is included (not just is_grupo_member) because
-- Postgres requires INSERT ... RETURNING rows to already pass the SELECT
-- policy — the on_grupo_created trigger's membership insert doesn't count
-- in time for that check, so without this the creator's own insert+select
-- (crearGrupo) fails with "new row violates row-level security policy".
create policy "grupos_select_member" on grupos for select
  using (is_grupo_member(id) or creado_por = auth.uid());

create policy "grupos_insert_own" on grupos for insert
  with check (creado_por = auth.uid());

create policy "grupo_miembros_select_member" on grupo_miembros for select
  using (is_grupo_member(grupo_id));

create policy "grupo_miembros_delete_own" on grupo_miembros for delete
  using (user_id = auth.uid());

-- Extend existing tables with group-visibility, alongside (not replacing)
-- the existing "own data only" policies.
create policy "profiles_select_grupo" on profiles for select
  using (comparte_grupo_con(id));

create policy "rutinas_select_grupo" on rutinas for select
  using (comparte_grupo_con(user_id));

create policy "rutina_ejercicios_select_grupo" on rutina_ejercicios for select
  using (exists (
    select 1 from rutinas r where r.id = rutina_ejercicios.rutina_id and comparte_grupo_con(r.user_id)
  ));

create policy "rutina_dias_select_grupo" on rutina_dias for select
  using (comparte_grupo_con(user_id));

create policy "registros_ejercicio_select_grupo" on registros_ejercicio for select
  using (comparte_grupo_con(user_id));

-- Populate profiles automatically on signup, from auth.signUp options.data.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nombre, apellido, username)
  values (
    new.id,
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'apellido',
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Avatar uploads: one file per user at "${user.id}/...". Public bucket, so
-- getPublicUrl() works without a public SELECT policy — deliberately not
-- adding one, since a public SELECT policy on storage.objects also allows
-- *listing* the bucket's contents, not just reading known paths.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "avatar_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Not public — scoped to the owner. Storage's upload(upsert: true) does an
-- INSERT/UPDATE ... RETURNING internally, and (same as the grupos insert
-- earlier) Postgres requires the row to already pass a SELECT policy for
-- RETURNING to succeed. Without this, every upload failed with "new row
-- violates row-level security policy" even though insert/update both passed.
create policy "avatar_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Auto-join the creator as the first member (mirrors handle_new_user's pattern).
create or replace function public.handle_new_grupo()
returns trigger as $$
begin
  insert into public.grupo_miembros (grupo_id, user_id)
  values (new.id, new.creado_por);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_grupo_created on grupos;
create trigger on_grupo_created
  after insert on grupos
  for each row execute function public.handle_new_grupo();

-- Joining by code always goes through here (grupo_miembros has no direct
-- insert policy), so membership can never be granted by guessing a group's
-- uuid — you need the invite code.
create or replace function public.unirse_a_grupo(p_codigo text)
returns table (id uuid, nombre text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grupo_id uuid;
begin
  if auth.uid() is null then
    raise exception 'no_autenticado';
  end if;

  select g.id into v_grupo_id from grupos g where g.codigo = upper(p_codigo);
  if v_grupo_id is null then
    raise exception 'codigo_invalido';
  end if;

  insert into grupo_miembros (grupo_id, user_id)
  values (v_grupo_id, auth.uid())
  on conflict (grupo_id, user_id) do nothing;

  return query select g.id, g.nombre from grupos g where g.id = v_grupo_id;
end;
$$;
