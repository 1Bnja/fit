-- El with_check de usuario_misiones seguía validando los ids correlativos viejos
-- ('pecho-1'), que la migración del catálogo reemplazó por slugs
-- ('press-banca-barra'). Las misiones que rellenan los slots que la rutina no
-- alcanza a llenar van con rutina_id null, así que caían en esa rama, no
-- matcheaban el regex y hacían fallar el insert completo: una rutina con menos de
-- 6 ejercicios en el día no generaba ninguna misión diaria.
--
-- El catálogo vive en data/exercises.json y Postgres no lo puede joinear, así que
-- para el filler se valida lo que sí decide puntos: que el stat sea uno que alguna
-- rutina del usuario entrene.

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
    and exists (
      select 1
      from rutinas r
      join rutina_ejercicios re on re.rutina_id = r.id
      where r.user_id = auth.uid() and re.categoria = usuario_misiones.stat
    )
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
