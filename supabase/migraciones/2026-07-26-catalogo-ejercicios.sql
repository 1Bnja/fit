-- Migración issue #8: catálogo de 200 ejercicios, ids por slug, sin ejercicios custom.
--
-- Los ids pasan de correlativos ("pecho-1") a slugs ("press-banca-barra") para que
-- agregar o sacar un ejercicio no renumere los demás. Como los correlativos viejos
-- ya no significan lo mismo (brazos-1 era "Laterales", que es hombro), hay que
-- reasignarlos explícitamente o el historial se pega al ejercicio equivocado.

-- Sin begin/commit explícitos: la corre el runner de migraciones, que ya envuelve
-- todo en una transacción. Por eso la tabla temporal se dropea a mano al final y
-- no con "on commit drop", que la mataría antes de tiempo si no hubiera envoltura.
create temp table mapeo_ejercicios (
  viejo text primary key,
  nuevo text not null,
  musculo text not null
);

insert into mapeo_ejercicios (viejo, nuevo, musculo) values
  ('pecho-1', 'press-banca-barra', 'pecho'),
  ('pecho-2', 'press-inclinado-barra', 'pecho'),
  ('pecho-3', 'aperturas-pec-deck-contractora', 'pecho'),
  ('espalda-1', 'remo-mancuerna-mano', 'espalda'),
  ('espalda-2', 'remo-barra-t', 'espalda'),
  ('espalda-3', 'jalon-pecho-unilateral', 'espalda'),
  ('espalda-4', 'jalon-pecho', 'espalda'),
  ('espalda-5', 'remo-sentado-polea-baja', 'espalda'),
  ('espalda-6', 'jalon-brazos-rectos-pullover-polea', 'espalda'),
  ('brazos-1', 'elevaciones-laterales-mancuernas', 'hombros'),
  ('brazos-2', 'curl-biceps-barra-recta', 'biceps'),
  ('brazos-3', 'extension-triceps-polea-cuerda', 'triceps'),
  ('brazos-4', 'curl-bayesiano-polea', 'biceps'),
  ('brazos-5', 'curl-predicador-banco-scott-barra-z', 'biceps'),
  ('brazos-6', 'curl-martillo-mancuernas', 'biceps'),
  ('brazos-7', 'press-frances-barra-z', 'triceps'),
  ('brazos-8', 'extension-katana-triceps-polea', 'triceps'),
  ('piernas-1', 'abductores-maquina', 'cuadriceps'),
  ('piernas-2', 'prensa-piernas-45', 'cuadriceps'),
  ('piernas-3', 'curl-femoral-tumbado-maquina', 'isquios'),
  ('piernas-4', 'extension-piernas-maquina', 'cuadriceps'),
  ('piernas-5', 'sentadilla-smith-multipower', 'cuadriceps'),
  ('piernas-6', 'peso-muerto-rumano-barra', 'isquios'),
  ('087f786b-8736-4087-8ddb-8002473da861', 'pajaros-deltoides-posterior-mancuernas', 'hombros'),
  ('b34c8cc8-ed0c-4522-8f41-47986781dec9', 'pajaros-deltoides-posterior-mancuernas', 'hombros'),
  ('0d500a44-443a-406d-a78b-fe233aeaa61a', 'elevaciones-laterales-mancuernas', 'hombros'),
  ('41218583-1794-468a-8bbc-67550ad57fd6', 'press-militar-barra-pie', 'hombros'),
  ('f0a245b3-d23d-4dfc-bb30-5091bcb26808', 'press-militar-barra-pie', 'hombros'),
  ('4a14e6ec-30af-4087-99c7-aef61972b65e', 'extension-piernas-maquina', 'cuadriceps'),
  ('5d860d58-316e-45e8-8b4b-5d16720abb8e', 'press-inclinado-multipower-smith', 'pecho'),
  ('8d62de10-cedf-4a81-9665-740a808e1694', 'press-plano-multipower-smith', 'pecho'),
  ('6fbf7688-00c7-4068-8d81-803483c3717a', 'aductores-maquina', 'cuadriceps'),
  ('829c64aa-8061-4449-92cb-152994d7bc01', 'sentadilla-pendular', 'cuadriceps'),
  ('e7b284c4-f5ab-406c-9886-5b6a3812c9ef', 'curl-inclinado-mancuernas', 'biceps');

-- 1. Reapuntar rutinas e historial al catálogo nuevo.
update rutina_ejercicios re
set ejercicio_id = m.nuevo
from mapeo_ejercicios m
where re.ejercicio_id = m.viejo;

update registros_ejercicio r
set ejercicio_id = m.nuevo
from mapeo_ejercicios m
where r.ejercicio_id = m.viejo;

-- 2. Los customs fusionados pueden dejar el mismo ejercicio dos veces en una rutina
--    ("Laterales" + "Laterales con mancuernas"). Se queda el de menor orden.
--    Los registros NO se deduplican: los dos historiales se funden en uno, que es
--    justo lo que se quiere.
delete from rutina_ejercicios a
using rutina_ejercicios b
where a.rutina_id = b.rutina_id
  and a.ejercicio_id = b.ejercicio_id
  and (a.orden, a.ctid) > (b.orden, b.ctid);

-- 3. Músculo congelado en el registro: es lo que permite rankear en SQL, porque el
--    catálogo vive en un JSON y Postgres no lo puede joinear. Null = ejercicio que
--    ya no está en el catálogo; esas filas quedan fuera de cualquier ranking.
alter table registros_ejercicio add column if not exists musculo text;

update registros_ejercicio r
set musculo = m.musculo
from mapeo_ejercicios m
where r.ejercicio_id = m.nuevo and r.musculo is null;

create index if not exists registros_ejercicio_musculo_idx
  on registros_ejercicio (musculo, user_id);

-- 4. Se elimina la creación de ejercicios propios: un ejercicio inventado por un
--    usuario no es comparable con nadie, así que no puede entrar a los rankeds.
alter table rutina_ejercicios drop column if exists es_custom;
drop table if exists ejercicios_custom;

drop table mapeo_ejercicios;
