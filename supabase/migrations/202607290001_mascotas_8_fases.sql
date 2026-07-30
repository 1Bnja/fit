begin;

alter table public.mascotas
  add column if not exists descripcion text not null default '';
alter table public.mascotas
  add column if not exists orden smallint not null default 0;
alter table public.mascotas
  add column if not exists disponible boolean not null default false;

alter table public.mascota_fases
  add column if not exists stat_minima_requerida int not null default 0;
alter table public.mascota_fases
  add column if not exists updated_at timestamptz not null default now();
alter table public.mascota_fases
  alter column imagen_url drop not null;

alter table public.usuario_mascotas
  alter column seleccionada set default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mascotas_orden_check'
      and conrelid = 'public.mascotas'::regclass
  ) then
    alter table public.mascotas
      add constraint mascotas_orden_check
      check (orden >= 0) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'mascotas_clave_check'
      and conrelid = 'public.mascotas'::regclass
  ) then
    alter table public.mascotas
      add constraint mascotas_clave_check
      check (clave ~ '^[a-z0-9][a-z0-9_-]{0,49}$') not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'mascota_fases_numero_check'
      and conrelid = 'public.mascota_fases'::regclass
  ) then
    alter table public.mascota_fases
      add constraint mascota_fases_numero_check
      check (numero between 1 and 8) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'mascota_fases_xp_requerida_check'
      and conrelid = 'public.mascota_fases'::regclass
  ) then
    alter table public.mascota_fases
      add constraint mascota_fases_xp_requerida_check
      check (xp_requerida >= 0) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'mascota_fases_stat_minima_requerida_check'
      and conrelid = 'public.mascota_fases'::regclass
  ) then
    alter table public.mascota_fases
      add constraint mascota_fases_stat_minima_requerida_check
      check (stat_minima_requerida >= 0) not valid;
  end if;
end;
$$;

alter table public.mascotas
  validate constraint mascotas_orden_check;
alter table public.mascotas
  validate constraint mascotas_clave_check;
alter table public.mascota_fases
  validate constraint mascota_fases_numero_check;
alter table public.mascota_fases
  validate constraint mascota_fases_xp_requerida_check;
alter table public.mascota_fases
  validate constraint mascota_fases_stat_minima_requerida_check;

create index if not exists mascotas_disponibles_orden_idx
  on public.mascotas (disponible, orden, nombre);
create unique index if not exists usuario_mascotas_una_seleccionada_idx
  on public.usuario_mascotas (user_id) where seleccionada;

create or replace function public.plantilla_fases_mascota()
returns table (
  numero int,
  nombre text,
  xp_requerida int,
  stat_minima_requerida int
)
language sql
immutable
set search_path = public
as $$
  values
    (1, 'Fase inicial', 0, 0),
    (2, 'Fase 2', 70, 6),
    (3, 'Fase 3', 220, 20),
    (4, 'Fase 4', 500, 45),
    (5, 'Fase 5', 900, 75),
    (6, 'Fase 6', 1400, 110),
    (7, 'Fase 7', 2000, 150),
    (8, 'Fase 8', 2700, 200);
$$;

revoke all on function public.plantilla_fases_mascota()
  from public, anon, authenticated;

create or replace function public.crear_fases_mascota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.mascota_fases (
    mascota_id,
    numero,
    nombre,
    xp_requerida,
    stat_minima_requerida
  )
  select
    new.id,
    fase.numero,
    fase.nombre,
    fase.xp_requerida,
    fase.stat_minima_requerida
  from public.plantilla_fases_mascota() as fase
  on conflict (mascota_id, numero) do nothing;

  return new;
end;
$$;

drop trigger if exists on_mascota_created_fases on public.mascotas;
create trigger on_mascota_created_fases
  after insert on public.mascotas
  for each row execute function public.crear_fases_mascota();

create or replace function public.actualizar_mascota_fase_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_mascota_fase_image_updated on public.mascota_fases;
create trigger on_mascota_fase_image_updated
  before update of imagen_url on public.mascota_fases
  for each row
  when (old.imagen_url is distinct from new.imagen_url)
  execute function public.actualizar_mascota_fase_updated_at();

insert into public.mascotas (clave, nombre, descripcion, orden, disponible)
values
  ('ovejita', 'Ovejita', 'Constante, equilibrada y siempre lista para avanzar.', 1, true),
  ('zorrito', 'Zorrito', 'Ágil, curioso y lleno de energía para cada rutina.', 2, true),
  ('axolito', 'Axolito', 'Paciente, adaptable y experto en volver más fuerte.', 3, true),
  ('drakito', 'Drakito', 'Pequeño dragón con una determinación enorme.', 4, true)
on conflict (clave) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  orden = excluded.orden,
  disponible = excluded.disponible;

insert into public.mascota_fases as fase_existente (
  mascota_id,
  numero,
  nombre,
  xp_requerida,
  stat_minima_requerida,
  imagen_url
)
select
  mascota.id,
  fase.numero,
  fase.nombre,
  fase.xp_requerida,
  fase.stat_minima_requerida,
  case
    when fase.numero <> 1 then null
    when mascota.clave = 'ovejita' then
      'https://szpwfypchalpawvyworj.supabase.co/storage/v1/object/public/mascotas/ovejita/fase-1.png'
    when mascota.clave = 'zorrito' then '/images/mascotas/zorrito/fase-1.svg'
    when mascota.clave = 'axolito' then '/images/mascotas/axolito/fase-1.svg'
    when mascota.clave = 'drakito' then '/images/mascotas/drakito/fase-1.svg'
    else null
  end
from public.mascotas as mascota
cross join public.plantilla_fases_mascota() as fase
on conflict (mascota_id, numero) do update set
  nombre = excluded.nombre,
  xp_requerida = excluded.xp_requerida,
  stat_minima_requerida = excluded.stat_minima_requerida,
  imagen_url = coalesce(fase_existente.imagen_url, excluded.imagen_url);

insert into public.usuario_mascotas (user_id, mascota_id, seleccionada)
select perfil.id, mascota.id, true
from public.profiles as perfil
cross join public.mascotas as mascota
where mascota.clave = 'ovejita'
  and coalesce(perfil.onboarding_completo, false)
  and not exists (
    select 1
    from public.usuario_mascotas as usuario_mascota
    where usuario_mascota.user_id = perfil.id
      and usuario_mascota.seleccionada
  )
on conflict (user_id, mascota_id) do update
set seleccionada = true;

do $$
declare
  v_trigger record;
begin
  for v_trigger in
    select trg.tgname as nombre
    from pg_trigger as trg
    join pg_proc as proc on proc.oid = trg.tgfoid
    join pg_namespace as proc_schema on proc_schema.oid = proc.pronamespace
    where trg.tgrelid = 'public.profiles'::regclass
      and proc_schema.nspname = 'public'
      and proc.proname = 'asignar_mascota_inicial'
      and not trg.tgisinternal
  loop
    execute format('drop trigger if exists %I on public.profiles', v_trigger.nombre);
  end loop;
end;
$$;

drop function if exists public.asignar_mascota_inicial();

create or replace function public.seleccionar_mascota(p_clave text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_mascota_id uuid;
begin
  if v_user_id is null then
    raise exception 'no_autenticado';
  end if;

  perform 1
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'perfil_no_encontrado';
  end if;

  select id into v_mascota_id
  from public.mascotas
  where clave = p_clave and disponible = true;

  if v_mascota_id is null then
    raise exception 'mascota_no_disponible';
  end if;

  update public.usuario_mascotas
  set seleccionada = false
  where user_id = v_user_id and seleccionada = true;

  insert into public.usuario_mascotas (user_id, mascota_id, seleccionada)
  values (v_user_id, v_mascota_id, true)
  on conflict (user_id, mascota_id) do update
  set seleccionada = true;
end;
$$;

revoke all on function public.seleccionar_mascota(text) from public;
grant execute on function public.seleccionar_mascota(text) to authenticated;

create or replace function public.completar_onboarding_y_elegir_mascota(
  p_peso_kg numeric,
  p_estatura_cm numeric,
  p_clave text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_mascota_id uuid;
begin
  if v_user_id is null then
    raise exception 'no_autenticado';
  end if;

  if p_peso_kg is null or p_peso_kg < 20 or p_peso_kg > 500
    or p_estatura_cm is null or p_estatura_cm < 50 or p_estatura_cm > 300 then
    raise exception 'datos_fisicos_invalidos';
  end if;

  perform 1
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'perfil_no_encontrado';
  end if;

  select id into v_mascota_id
  from public.mascotas
  where clave = p_clave and disponible = true;

  if v_mascota_id is null then
    raise exception 'mascota_no_disponible';
  end if;

  update public.usuario_mascotas
  set seleccionada = false
  where user_id = v_user_id and seleccionada = true;

  insert into public.usuario_mascotas (user_id, mascota_id, seleccionada)
  values (v_user_id, v_mascota_id, true)
  on conflict (user_id, mascota_id) do update
  set seleccionada = true;

  update public.profiles
  set peso_kg = p_peso_kg,
      estatura_cm = p_estatura_cm,
      onboarding_completo = true
  where id = v_user_id;
end;
$$;

revoke all on function public.completar_onboarding_y_elegir_mascota(numeric, numeric, text)
  from public;
grant execute on function public.completar_onboarding_y_elegir_mascota(numeric, numeric, text)
  to authenticated;

create or replace function public.validar_mascota_seleccionada_para_recompensa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1
  from public.profiles
  where id = new.user_id
  for update;

  perform 1
  from public.usuario_mascotas
  where user_id = new.user_id and seleccionada = true
  for update;

  if not found then
    raise exception 'mascota_no_seleccionada';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_mascota_seleccionada_al_recompensar
  on public.usuario_mision_recompensas;
create trigger validar_mascota_seleccionada_al_recompensar
  before insert on public.usuario_mision_recompensas
  for each row
  execute function public.validar_mascota_seleccionada_para_recompensa();

commit;
