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

-- Mascotas y misiones. Estas sentencias también actualizan proyectos donde
-- las tablas iniciales se crearon antes de que este esquema se versionara.
begin;

create index if not exists rutinas_user_idx
  on rutinas (user_id);
create index if not exists rutina_dias_user_dia_idx
  on rutina_dias (user_id, dia_semana);
create index if not exists rutina_ejercicios_rutina_orden_idx
  on rutina_ejercicios (rutina_id, orden);
create index if not exists grupo_miembros_user_idx
  on grupo_miembros (user_id, grupo_id);

alter table profiles add column if not exists last_active_at timestamptz;
alter table profiles add column if not exists nivel_entrenamiento text not null default 'principiante'
  check (nivel_entrenamiento in ('principiante', 'intermedio', 'avanzado'));
alter table profiles add column if not exists timezone text not null default 'America/Santiago';

alter table rutina_ejercicios add column if not exists categoria text;
alter table registros_ejercicio add column if not exists rutina_id uuid references rutinas(id) on delete set null;

update rutina_ejercicios
set categoria = case ejercicio_id
  when 'pecho-1' then 'pecho' when 'pecho-2' then 'pecho' when 'pecho-3' then 'pecho'
  when 'pecho-4' then 'pecho' when 'pecho-5' then 'pecho' when 'pecho-6' then 'pecho'
  when 'espalda-1' then 'espalda' when 'espalda-2' then 'espalda' when 'espalda-3' then 'espalda'
  when 'espalda-4' then 'espalda' when 'espalda-5' then 'espalda' when 'espalda-6' then 'espalda'
  when 'brazos-1' then 'brazos' when 'brazos-2' then 'brazos' when 'brazos-3' then 'brazos'
  when 'brazos-4' then 'brazos' when 'brazos-5' then 'brazos' when 'brazos-6' then 'brazos'
  when 'brazos-7' then 'brazos' when 'brazos-8' then 'brazos'
  when 'piernas-1' then 'piernas' when 'piernas-2' then 'piernas' when 'piernas-3' then 'piernas'
  when 'piernas-4' then 'piernas' when 'piernas-5' then 'piernas' when 'piernas-6' then 'piernas'
  when 'abdomen-1' then 'abdomen' when 'abdomen-2' then 'abdomen' when 'abdomen-3' then 'abdomen'
  when 'abdomen-4' then 'abdomen' when 'abdomen-5' then 'abdomen' when 'abdomen-6' then 'abdomen'
end
where categoria is null;

update rutina_ejercicios re
set categoria = ec.categoria
from ejercicios_custom ec
where re.es_custom = true and re.ejercicio_id = ec.id::text and re.categoria is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'rutina_ejercicios_categoria_check'
      and conrelid = 'public.rutina_ejercicios'::regclass
  ) then
    alter table rutina_ejercicios
      add constraint rutina_ejercicios_categoria_check
      check (categoria in ('pecho', 'espalda', 'brazos', 'piernas', 'abdomen'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'registros_ejercicio_peso_check'
      and conrelid = 'public.registros_ejercicio'::regclass
  ) then
    alter table registros_ejercicio
      add constraint registros_ejercicio_peso_check check (peso_kg > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'registros_ejercicio_reps_check'
      and conrelid = 'public.registros_ejercicio'::regclass
  ) then
    alter table registros_ejercicio
      add constraint registros_ejercicio_reps_check check (reps between 1 and 30);
  end if;
end;
$$;

create table if not exists mascotas (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  nombre text not null,
  created_at timestamptz not null default now()
);

create table if not exists mascota_fases (
  id uuid primary key default gen_random_uuid(),
  mascota_id uuid not null references mascotas(id) on delete cascade,
  numero int not null,
  nombre text not null,
  xp_requerida int not null default 0 check (xp_requerida >= 0),
  stat_minima_requerida int not null default 0 check (stat_minima_requerida >= 0),
  imagen_url text,
  unique (mascota_id, numero)
);

alter table mascota_fases add column if not exists stat_minima_requerida int not null default 0;
alter table mascota_fases alter column imagen_url drop not null;

create table if not exists usuario_mascotas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mascota_id uuid not null references mascotas(id) on delete cascade,
  seleccionada boolean not null default true,
  estado text not null default 'activa' check (estado in ('activa', 'tumba')),
  xp int not null default 0 check (xp >= 0),
  piernas int not null default 0 check (piernas >= 0),
  brazos int not null default 0 check (brazos >= 0),
  pecho int not null default 0 check (pecho >= 0),
  abdomen int not null default 0 check (abdomen >= 0),
  espalda int not null default 0 check (espalda >= 0),
  unique (user_id, mascota_id)
);

create unique index if not exists usuario_mascotas_una_seleccionada_idx
  on usuario_mascotas (user_id) where seleccionada;

insert into mascotas (clave, nombre)
values ('ovejita', 'Ovejita')
on conflict (clave) do nothing;

insert into mascota_fases (mascota_id, numero, nombre, xp_requerida, stat_minima_requerida, imagen_url)
select id, 1, 'Fase inicial', 0, 0,
  'https://szpwfypchalpawvyworj.supabase.co/storage/v1/object/public/mascotas/ovejita/fase-1.png'
from mascotas where clave = 'ovejita'
on conflict (mascota_id, numero) do update set
  nombre = excluded.nombre,
  xp_requerida = excluded.xp_requerida,
  stat_minima_requerida = excluded.stat_minima_requerida,
  imagen_url = excluded.imagen_url;

insert into mascota_fases (mascota_id, numero, nombre, xp_requerida, stat_minima_requerida)
select id, fase.numero, fase.nombre, fase.xp, fase.min_stat
from mascotas
cross join (values
  (2, 'Fase 2', 70, 6),
  (3, 'Fase 3', 220, 20),
  (4, 'Fase 4', 500, 45)
) as fase(numero, nombre, xp, min_stat)
where clave = 'ovejita'
on conflict (mascota_id, numero) do update set
  nombre = excluded.nombre,
  xp_requerida = excluded.xp_requerida,
  stat_minima_requerida = excluded.stat_minima_requerida;

insert into usuario_mascotas (user_id, mascota_id)
select p.id, m.id
from profiles p
cross join mascotas m
where m.clave = 'ovejita'
  and not exists (select 1 from usuario_mascotas um where um.user_id = p.id and um.seleccionada);

create or replace function public.asignar_mascota_inicial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into usuario_mascotas (user_id, mascota_id)
  select new.id, id from mascotas where clave = 'ovejita'
  on conflict (user_id, mascota_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_mascota on profiles;
create trigger on_profile_created_mascota
  after insert on profiles
  for each row execute function public.asignar_mascota_inicial();

create table if not exists usuario_misiones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  frecuencia text not null,
  periodo_inicio date not null,
  periodo_fin date not null,
  slot smallint not null,
  rutina_id uuid references rutinas(id) on delete cascade,
  ejercicio_id text not null,
  ejercicio_nombre text not null,
  stat text not null,
  series_objetivo smallint not null,
  dias_objetivo smallint not null default 1,
  dias_completados smallint not null default 0,
  reps_objetivo smallint not null,
  peso_sugerido_kg numeric,
  progreso smallint not null default 0,
  puntos_evolucion smallint not null default 0,
  puntos_stat smallint not null default 0,
  completada_at timestamptz,
  created_at timestamptz not null default now()
);

alter table usuario_misiones add column if not exists frecuencia text;
alter table usuario_misiones add column if not exists periodo_inicio date;
alter table usuario_misiones add column if not exists periodo_fin date;
alter table usuario_misiones add column if not exists slot smallint;
alter table usuario_misiones add column if not exists rutina_id uuid references rutinas(id) on delete cascade;
alter table usuario_misiones drop constraint if exists usuario_misiones_rutina_id_fkey;
alter table usuario_misiones
  add constraint usuario_misiones_rutina_id_fkey
  foreign key (rutina_id) references rutinas(id) on delete cascade;
alter table usuario_misiones add column if not exists ejercicio_id text;
alter table usuario_misiones add column if not exists ejercicio_nombre text;
alter table usuario_misiones add column if not exists stat text;
alter table usuario_misiones add column if not exists series_objetivo smallint;
alter table usuario_misiones add column if not exists dias_objetivo smallint not null default 1;
alter table usuario_misiones add column if not exists dias_completados smallint not null default 0;
alter table usuario_misiones add column if not exists reps_objetivo smallint;
alter table usuario_misiones add column if not exists peso_sugerido_kg numeric;
alter table usuario_misiones add column if not exists progreso smallint not null default 0;
alter table usuario_misiones add column if not exists puntos_evolucion smallint not null default 0;
alter table usuario_misiones add column if not exists puntos_stat smallint not null default 0;
alter table usuario_misiones add column if not exists completada_at timestamptz;
alter table usuario_misiones add column if not exists created_at timestamptz not null default now();
alter table usuario_misiones drop constraint if exists usuario_misiones_user_id_mision_id_periodo_inicio_key;
alter table usuario_misiones drop column if exists mision_id;
alter table usuario_misiones alter column frecuencia set not null;
alter table usuario_misiones alter column periodo_inicio set not null;
alter table usuario_misiones alter column periodo_fin set not null;
alter table usuario_misiones alter column slot set not null;
alter table usuario_misiones alter column ejercicio_id set not null;
alter table usuario_misiones alter column ejercicio_nombre set not null;
alter table usuario_misiones alter column stat set not null;
alter table usuario_misiones alter column series_objetivo set not null;
alter table usuario_misiones alter column dias_objetivo set not null;
alter table usuario_misiones alter column dias_completados set not null;
alter table usuario_misiones alter column reps_objetivo set not null;
alter table usuario_misiones alter column progreso set default 0;
alter table usuario_misiones alter column progreso set not null;
alter table usuario_misiones alter column puntos_evolucion set default 0;
alter table usuario_misiones alter column puntos_evolucion set not null;
alter table usuario_misiones alter column puntos_stat set default 0;
alter table usuario_misiones alter column puntos_stat set not null;

alter table usuario_misiones drop constraint if exists usuario_misiones_frecuencia_check;
alter table usuario_misiones drop constraint if exists usuario_misiones_slot_check;
alter table usuario_misiones drop constraint if exists usuario_misiones_stat_check;
alter table usuario_misiones drop constraint if exists usuario_misiones_series_objetivo_check;
alter table usuario_misiones drop constraint if exists usuario_misiones_reps_objetivo_check;
alter table usuario_misiones drop constraint if exists usuario_misiones_progreso_check;
alter table usuario_misiones drop constraint if exists usuario_misiones_puntos_evolucion_check;
alter table usuario_misiones drop constraint if exists usuario_misiones_puntos_stat_check;
alter table usuario_misiones drop constraint if exists usuario_misiones_config_check;

update usuario_misiones
set dias_objetivo = 2,
    series_objetivo = series_objetivo * 2
where frecuencia = 'semanal'
  and dias_objetivo = 1;

alter table usuario_misiones add constraint usuario_misiones_config_check check (
  ejercicio_nombre <> ''
  and stat in ('piernas', 'brazos', 'pecho', 'abdomen', 'espalda')
  and reps_objetivo between 8 and 12
  and progreso between 0 and series_objetivo
  and dias_completados between 0 and dias_objetivo
  and (peso_sugerido_kg is null or peso_sugerido_kg > 0)
  and (
    frecuencia = 'diaria'
    and periodo_fin = periodo_inicio
    and slot between 1 and 6
    and series_objetivo between 2 and 3
    and dias_objetivo = 1
    and puntos_evolucion = 2
    and puntos_stat = 1
    or
    frecuencia = 'semanal'
    and periodo_fin = periodo_inicio + 6
    and slot between 1 and 4
    and (
      dias_objetivo = 2 and series_objetivo in (4, 6)
      or dias_objetivo = 3 and series_objetivo in (6, 9)
    )
    and puntos_evolucion = 6
    and puntos_stat = 2
  )
);
alter table usuario_misiones drop constraint if exists usuario_misiones_user_id_frecuencia_periodo_inicio_slot_key;
create unique index if not exists usuario_misiones_periodo_slot_idx
  on usuario_misiones (user_id, frecuencia, periodo_inicio, slot);
create index if not exists usuario_misiones_activas_idx
  on usuario_misiones (user_id, ejercicio_id, periodo_inicio, periodo_fin)
  where completada_at is null;

create table if not exists usuario_mision_recompensas (
  user_id uuid not null references profiles(id) on delete cascade,
  frecuencia text not null check (frecuencia in ('diaria', 'semanal')),
  periodo_inicio date not null,
  slot smallint not null,
  otorgada_at timestamptz not null default now(),
  primary key (user_id, frecuencia, periodo_inicio, slot)
);

insert into usuario_mision_recompensas (user_id, frecuencia, periodo_inicio, slot, otorgada_at)
select user_id, frecuencia, periodo_inicio, slot, completada_at
from usuario_misiones
where completada_at is not null
on conflict do nothing;

create table if not exists progreso_ejercicio_usuario (
  user_id uuid not null references profiles(id) on delete cascade,
  ejercicio_id text not null,
  reps_objetivo smallint not null default 8 check (reps_objetivo between 8 and 12),
  peso_referencia_kg numeric,
  exitos_en_tope smallint not null default 0 check (exitos_en_tope >= 0),
  ultima_exposicion date,
  primary key (user_id, ejercicio_id)
);

alter table mascotas enable row level security;
alter table mascota_fases enable row level security;
alter table usuario_mascotas enable row level security;
alter table usuario_misiones enable row level security;
alter table usuario_mision_recompensas enable row level security;
alter table progreso_ejercicio_usuario enable row level security;

create or replace function public.fecha_local_actual()
returns date
language sql
security definer
set search_path = public
stable
as $$
  select (now() at time zone coalesce(
    (select timezone from profiles where id = auth.uid()),
    'America/Santiago'
  ))::date;
$$;

create or replace function public.invalidar_misiones_actuales()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'no_autenticado'; end if;

  delete from usuario_misiones
  where user_id = v_user_id
    and periodo_fin >= fecha_local_actual();
end;
$$;

revoke all on function public.invalidar_misiones_actuales() from public;
grant execute on function public.invalidar_misiones_actuales() to authenticated;

drop policy if exists "mascotas_select_authenticated" on mascotas;
create policy "mascotas_select_authenticated" on mascotas for select to authenticated using (true);
drop policy if exists "mascota_fases_select_authenticated" on mascota_fases;
create policy "mascota_fases_select_authenticated" on mascota_fases for select to authenticated using (true);
drop policy if exists "usuario_mascotas_select_own" on usuario_mascotas;
create policy "usuario_mascotas_select_own" on usuario_mascotas for select using (user_id = auth.uid());
drop policy if exists "usuario_misiones_select_own" on usuario_misiones;
create policy "usuario_misiones_select_own" on usuario_misiones for select using (user_id = auth.uid());
drop policy if exists "usuario_mision_recompensas_select_own" on usuario_mision_recompensas;
create policy "usuario_mision_recompensas_select_own" on usuario_mision_recompensas
  for select using (user_id = auth.uid());
drop policy if exists "usuario_misiones_insert_own" on usuario_misiones;
create policy "usuario_misiones_insert_own" on usuario_misiones for insert to authenticated
with check (
  user_id = auth.uid()
  and progreso = 0
  and dias_completados = 0
  and completada_at is null
  and (
    frecuencia = 'diaria'
    and periodo_inicio = fecha_local_actual()
    or
    frecuencia = 'semanal'
    and periodo_inicio = fecha_local_actual() - (extract(isodow from fecha_local_actual())::int - 1)
  )
  and (
    rutina_id is null
    and ejercicio_id ~ '^(pecho-[1-6]|espalda-[1-6]|brazos-[1-8]|piernas-[1-6]|abdomen-[1-6])$'
    and stat = split_part(ejercicio_id, '-', 1)
    or exists (
      select 1
      from rutinas r
      join rutina_ejercicios re on re.rutina_id = r.id
      where r.id = usuario_misiones.rutina_id
        and r.user_id = auth.uid()
        and re.ejercicio_id = usuario_misiones.ejercicio_id
        and re.categoria = usuario_misiones.stat
    )
  )
);
drop policy if exists "progreso_ejercicio_select_own" on progreso_ejercicio_usuario;
create policy "progreso_ejercicio_select_own" on progreso_ejercicio_usuario for select using (user_id = auth.uid());

create or replace function public.registrar_serie_y_progreso(
  p_ejercicio_id text,
  p_ejercicio_nombre text,
  p_peso_kg numeric,
  p_reps int,
  p_rutina_id uuid default null,
  p_usuario_mision_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_timezone text;
  v_hoy date;
  v_semana date;
  v_registro_id uuid;
  v_mision usuario_misiones%rowtype;
  v_progreso int;
  v_dias_completados int;
  v_completada timestamptz;
  v_peso_minimo numeric;
  v_estado progreso_ejercicio_usuario%rowtype;
  v_recompensa_nueva boolean;
  v_actualizadas int := 0;
  v_nombre_seguro text := p_ejercicio_nombre;
begin
  if v_user_id is null then raise exception 'no_autenticado'; end if;
  if p_ejercicio_id is null or p_ejercicio_nombre is null or p_peso_kg <= 0 or p_reps not between 1 and 30 then
    raise exception 'serie_invalida';
  end if;
  if p_rutina_id is null and p_usuario_mision_id is null then raise exception 'origen_requerido'; end if;
  if p_rutina_id is not null then
    select re.ejercicio_nombre into v_nombre_seguro
    from rutinas r join rutina_ejercicios re on re.rutina_id = r.id
    where r.id = p_rutina_id and r.user_id = v_user_id and re.ejercicio_id = p_ejercicio_id;
    if v_nombre_seguro is null then raise exception 'rutina_invalida'; end if;
  end if;
  if p_usuario_mision_id is not null then
    select ejercicio_nombre into v_nombre_seguro from usuario_misiones
    where id = p_usuario_mision_id and user_id = v_user_id and ejercicio_id = p_ejercicio_id;
    if v_nombre_seguro is null then raise exception 'mision_invalida'; end if;
  end if;

  select coalesce(timezone, 'America/Santiago') into v_timezone from profiles where id = v_user_id;
  v_hoy := (now() at time zone coalesce(v_timezone, 'America/Santiago'))::date;
  v_semana := v_hoy - (extract(isodow from v_hoy)::int - 1);

  insert into registros_ejercicio (user_id, rutina_id, ejercicio_id, ejercicio_nombre, peso_kg, reps)
  values (v_user_id, p_rutina_id, p_ejercicio_id, v_nombre_seguro, p_peso_kg, p_reps)
  returning id into v_registro_id;

  for v_mision in
    select * from usuario_misiones
    where user_id = v_user_id and ejercicio_id = p_ejercicio_id and completada_at is null
      and ((frecuencia = 'diaria' and periodo_inicio = v_hoy) or (frecuencia = 'semanal' and periodo_inicio = v_semana))
  loop
    v_completada := null;
    select
      count(*),
      count(distinct (r.created_at at time zone coalesce(v_timezone, 'America/Santiago'))::date)
    into v_progreso, v_dias_completados
    from registros_ejercicio r
    where r.user_id = v_user_id and r.ejercicio_id = p_ejercicio_id
      and (r.created_at at time zone coalesce(v_timezone, 'America/Santiago'))::date between v_mision.periodo_inicio and v_mision.periodo_fin
      and r.reps >= v_mision.reps_objetivo;

    update usuario_misiones
    set progreso = least(series_objetivo, v_progreso),
        dias_completados = least(dias_objetivo, v_dias_completados),
        completada_at = case
          when v_progreso >= series_objetivo and v_dias_completados >= dias_objetivo then now()
          else null
        end
    where id = v_mision.id and completada_at is null
    returning completada_at into v_completada;

    if v_completada is not null then
      v_recompensa_nueva := false;
      insert into usuario_mision_recompensas (user_id, frecuencia, periodo_inicio, slot)
      values (v_user_id, v_mision.frecuencia, v_mision.periodo_inicio, v_mision.slot)
      on conflict do nothing
      returning true into v_recompensa_nueva;

      if v_recompensa_nueva then
      update usuario_mascotas
      set xp = xp + v_mision.puntos_evolucion,
          piernas = piernas + case when v_mision.stat = 'piernas' then v_mision.puntos_stat else 0 end,
          brazos = brazos + case when v_mision.stat = 'brazos' then v_mision.puntos_stat else 0 end,
          pecho = pecho + case when v_mision.stat = 'pecho' then v_mision.puntos_stat else 0 end,
          abdomen = abdomen + case when v_mision.stat = 'abdomen' then v_mision.puntos_stat else 0 end,
          espalda = espalda + case when v_mision.stat = 'espalda' then v_mision.puntos_stat else 0 end
      where user_id = v_user_id and seleccionada = true;
      v_actualizadas := v_actualizadas + 1;

      if v_mision.frecuencia = 'diaria' then
        select min(peso_kg) into v_peso_minimo from registros_ejercicio
        where user_id = v_user_id and ejercicio_id = p_ejercicio_id
          and (created_at at time zone coalesce(v_timezone, 'America/Santiago'))::date = v_hoy
          and reps >= v_mision.reps_objetivo;
        select * into v_estado from progreso_ejercicio_usuario
        where user_id = v_user_id and ejercicio_id = p_ejercicio_id for update;

        if not found then
          insert into progreso_ejercicio_usuario (user_id, ejercicio_id, reps_objetivo, peso_referencia_kg, ultima_exposicion)
          values (v_user_id, p_ejercicio_id, least(12, v_mision.reps_objetivo + 1), v_peso_minimo, v_hoy);
        elsif v_estado.ultima_exposicion is distinct from v_hoy then
          if v_mision.reps_objetivo < 12 then
            update progreso_ejercicio_usuario
            set reps_objetivo = v_mision.reps_objetivo + 1, peso_referencia_kg = v_peso_minimo,
                exitos_en_tope = 0, ultima_exposicion = v_hoy
            where user_id = v_user_id and ejercicio_id = p_ejercicio_id;
          elsif v_estado.exitos_en_tope + 1 >= 2 then
            update progreso_ejercicio_usuario
            set reps_objetivo = 8,
                peso_referencia_kg = round(v_peso_minimo * case when v_mision.stat = 'piernas' then 1.05 else 1.025 end, 1),
                exitos_en_tope = 0, ultima_exposicion = v_hoy
            where user_id = v_user_id and ejercicio_id = p_ejercicio_id;
          else
            update progreso_ejercicio_usuario
            set reps_objetivo = 12, peso_referencia_kg = v_peso_minimo,
                exitos_en_tope = exitos_en_tope + 1, ultima_exposicion = v_hoy
            where user_id = v_user_id and ejercicio_id = p_ejercicio_id;
          end if;
        end if;
      end if;
      end if;
    end if;
  end loop;

  return jsonb_build_object('registro_id', v_registro_id, 'misiones_actualizadas', v_actualizadas);
end;
$$;

commit;
