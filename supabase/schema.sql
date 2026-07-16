-- Gym Tracker PWA schema. Run via Supabase MCP (execute_sql / apply_migration).

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  apellido text,
  username text unique,
  peso_kg numeric,
  estatura_cm numeric,
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

alter table profiles enable row level security;
alter table rutinas enable row level security;
alter table ejercicios_custom enable row level security;
alter table rutina_ejercicios enable row level security;
alter table rutina_dias enable row level security;

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
