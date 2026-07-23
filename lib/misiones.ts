import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getExercises } from "@/lib/exercises";
import type { Categoria } from "@/lib/categorias";

export const STATS_MASCOTA = ["piernas", "brazos", "pecho", "abdomen", "espalda"] as const;
export type StatMascota = (typeof STATS_MASCOTA)[number];
export type NivelEntrenamiento = "principiante" | "intermedio" | "avanzado";

type EjercicioMision = {
  ejercicio_id: string;
  ejercicio_nombre: string;
  categoria: Categoria;
  rutina_id: string | null;
};

export type MisionAsignada = {
  id: string;
  frecuencia: "diaria" | "semanal";
  ejercicio_id: string;
  ejercicio_nombre: string;
  stat: StatMascota;
  series_objetivo: number;
  dias_objetivo: number;
  dias_completados: number;
  reps_objetivo: number;
  peso_sugerido_kg: number | null;
  progreso: number;
  puntos_evolucion: number;
  puntos_stat: number;
  completada_at: string | null;
};

function fechaEnZona(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts();
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function inicioSemana(fecha: string) {
  const localNoon = new Date(`${fecha}T12:00:00Z`);
  const offset = (localNoon.getUTCDay() + 6) % 7;
  localNoon.setUTCDate(localNoon.getUTCDate() - offset);
  return localNoon.toISOString().slice(0, 10);
}

function diaSemana(fecha: string) {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay();
}

function fechaFinal(inicio: string, dias: number) {
  const value = new Date(`${inicio}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + dias);
  return value.toISOString().slice(0, 10);
}

export function periodosActuales(timezone = "America/Santiago") {
  const hoy = fechaEnZona(timezone);
  return { hoy, semana: inicioSemana(hoy) };
}

function hash(value: string) {
  return [...value].reduce((total, char) => ((total << 5) - total + char.charCodeAt(0)) | 0, 0) >>> 0;
}

function ordenarPorRotacion<T extends { ejercicio_id: string }>(items: T[], seed: string) {
  return [...items].sort(
    (a, b) => hash(`${seed}:${a.ejercicio_id}`) - hash(`${seed}:${b.ejercicio_id}`)
  );
}

function sinDuplicados(items: EjercicioMision[]) {
  return [...new Map(items.map((item) => [item.ejercicio_id, item])).values()];
}

function seleccionarPorRutina(items: EjercicioMision[], limite: number, seed: string) {
  const porRutina = new Map<string, EjercicioMision[]>();
  for (const item of items) {
    if (!item.rutina_id) continue;
    const grupo = porRutina.get(item.rutina_id) ?? [];
    grupo.push(item);
    porRutina.set(item.rutina_id, grupo);
  }

  const grupos = [...porRutina.entries()]
    .sort(
      ([rutinaA], [rutinaB]) =>
        hash(`${seed}:${rutinaA}`) - hash(`${seed}:${rutinaB}`)
    )
    .map(([rutinaId, ejercicios]) =>
      ordenarPorRotacion(sinDuplicados(ejercicios), `${seed}:${rutinaId}`)
    );
  const seleccionados: EjercicioMision[] = [];
  const usados = new Set<string>();

  while (seleccionados.length < limite) {
    let encontro = false;
    for (const grupo of grupos) {
      let ejercicio = grupo.shift();
      while (ejercicio && usados.has(ejercicio.ejercicio_id)) ejercicio = grupo.shift();
      if (!ejercicio) continue;
      seleccionados.push(ejercicio);
      usados.add(ejercicio.ejercicio_id);
      encontro = true;
      if (seleccionados.length === limite) break;
    }
    if (!encontro) break;
  }

  return seleccionados;
}

function objetivoSeries(nivel: NivelEntrenamiento) {
  return nivel === "principiante" ? 2 : 3;
}

function completarConCatalogo(base: EjercicioMision[], limite: number, seed: string) {
  if (base.length >= limite) return ordenarPorRotacion(base, seed).slice(0, limite);
  const categorias = new Set(base.map((item) => item.categoria));
  const extras = getExercises()
    .filter((exercise) => categorias.has(exercise.categoria))
    .map((exercise) => ({
      ejercicio_id: exercise.id,
      ejercicio_nombre: exercise.nombre,
      categoria: exercise.categoria,
      rutina_id: null,
    }));
  return sinDuplicados([...base, ...ordenarPorRotacion(extras, seed)]).slice(0, limite);
}

function filasMision({
  ejercicios,
  frecuencia,
  inicio,
  fin,
  nivel,
  progreso,
  seriesPorEjercicio,
  diasPorEjercicio,
  slots,
  userId,
}: {
  ejercicios: EjercicioMision[];
  frecuencia: "diaria" | "semanal";
  inicio: string;
  fin: string;
  nivel: NivelEntrenamiento;
  progreso: Map<string, { reps_objetivo: number; peso_referencia_kg: number | null }>;
  seriesPorEjercicio: Map<string, number>;
  diasPorEjercicio: Map<string, number>;
  slots: number[];
  userId: string;
}) {
  const baseSeries = objetivoSeries(nivel);
  return ejercicios.map((exercise, index) => {
    const estado = progreso.get(exercise.ejercicio_id);
    return {
      user_id: userId,
      frecuencia,
      periodo_inicio: inicio,
      periodo_fin: fin,
      slot: slots[index],
      rutina_id: exercise.rutina_id,
      ejercicio_id: exercise.ejercicio_id,
      ejercicio_nombre: exercise.ejercicio_nombre,
      stat: exercise.categoria,
      series_objetivo: seriesPorEjercicio.get(exercise.ejercicio_id) ?? baseSeries,
      dias_objetivo: diasPorEjercicio.get(exercise.ejercicio_id) ?? 1,
      reps_objetivo: estado?.reps_objetivo ?? 8,
      peso_sugerido_kg: estado?.peso_referencia_kg ?? null,
      puntos_evolucion: frecuencia === "diaria" ? 2 : 6,
      puntos_stat: frecuencia === "diaria" ? 1 : 2,
    };
  });
}

export async function asegurarMisionesActuales(
  supabase: SupabaseClient,
  userId: string,
  {
    nivel = "principiante",
    timezone = "America/Santiago",
  }: {
    nivel?: NivelEntrenamiento;
    timezone?: string;
  }
) {
  const { hoy, semana } = periodosActuales(timezone);
  const [{ data: existentesRaw }, { data: diasRutina }, { data: recompensas }] = await Promise.all([
    supabase
      .from("usuario_misiones")
      .select("frecuencia, periodo_inicio, rutina_id")
      .eq("user_id", userId)
      .in("periodo_inicio", [hoy, semana]),
    supabase.from("rutina_dias").select("rutina_id, dia_semana").eq("user_id", userId),
    supabase
      .from("usuario_mision_recompensas")
      .select("frecuencia, periodo_inicio, slot")
      .eq("user_id", userId)
      .in("periodo_inicio", [hoy, semana]),
  ]);

  const slotsDisponibles = (frecuencia: "diaria" | "semanal", inicio: string, total: number) => {
    const recompensados = new Set(
      (recompensas ?? [])
        .filter((row) => row.frecuencia === frecuencia && row.periodo_inicio === inicio)
        .map((row) => row.slot)
    );
    return Array.from({ length: total }, (_, index) => index + 1).filter(
      (slot) => !recompensados.has(slot)
    );
  };

  const rutinasHoy = (diasRutina ?? [])
    .filter((row) => row.dia_semana === diaSemana(hoy))
    .map((row) => row.rutina_id);
  const rutinasSemana = [...new Set((diasRutina ?? []).map((row) => row.rutina_id))];

  const rutinasNecesarias = [...new Set([...rutinasHoy, ...rutinasSemana])];
  if (!rutinasNecesarias.length) {
    await supabase.rpc("invalidar_misiones_actuales");
    return;
  }

  const { data: ejerciciosRaw } = await supabase
    .from("rutina_ejercicios")
    .select("rutina_id, ejercicio_id, ejercicio_nombre, categoria")
    .in("rutina_id", rutinasNecesarias)
    .not("categoria", "is", null);
  const ejercicios = (ejerciciosRaw ?? []) as EjercicioMision[];
  let existentes = existentesRaw ?? [];
  const rutinasHoyConEjercicios = [...new Set(
    ejercicios
      .filter((exercise) => rutinasHoy.includes(exercise.rutina_id!))
      .map((exercise) => exercise.rutina_id!)
  )];
  const rutinasSemanaConEjercicios = [...new Set(ejercicios.map((exercise) => exercise.rutina_id!))];
  const diariasExistentes = existentes.filter(
    (mission) => mission.frecuencia === "diaria" && mission.periodo_inicio === hoy
  );
  const semanalesExistentes = existentes.filter(
    (mission) => mission.frecuencia === "semanal" && mission.periodo_inicio === semana
  );
  const diariasCubiertas = new Set(diariasExistentes.map((mission) => mission.rutina_id).filter(Boolean));
  const semanalesCubiertas = new Set(semanalesExistentes.map((mission) => mission.rutina_id).filter(Boolean));
  const diariasDesactualizadas = diariasExistentes.length > 0 && (
    diariasExistentes.some((mission) => mission.rutina_id && !rutinasHoy.includes(mission.rutina_id))
    || rutinasHoyConEjercicios.length <= slotsDisponibles("diaria", hoy, 6).length
      && rutinasHoyConEjercicios.some((rutinaId) => !diariasCubiertas.has(rutinaId))
  );
  const semanalesDesactualizadas = semanalesExistentes.length > 0 && (
    semanalesExistentes.some((mission) => mission.rutina_id && !rutinasSemana.includes(mission.rutina_id))
    || rutinasSemanaConEjercicios.length <= slotsDisponibles("semanal", semana, 4).length
      && rutinasSemanaConEjercicios.some((rutinaId) => !semanalesCubiertas.has(rutinaId))
  );

  if (diariasDesactualizadas || semanalesDesactualizadas) {
    await supabase.rpc("invalidar_misiones_actuales");
    existentes = [];
  }

  const tieneDiarias = existentes.some(
    (mission) => mission.frecuencia === "diaria" && mission.periodo_inicio === hoy
  );
  const tieneSemanales = existentes.some(
    (mission) => mission.frecuencia === "semanal" && mission.periodo_inicio === semana
  );
  const ids = [...new Set(ejercicios.map((exercise) => exercise.ejercicio_id))];
  const { data: progresoRaw } = ids.length
    ? await supabase
        .from("progreso_ejercicio_usuario")
        .select("ejercicio_id, reps_objetivo, peso_referencia_kg")
        .eq("user_id", userId)
        .in("ejercicio_id", ids)
    : { data: [] };
  const progreso = new Map(
    (progresoRaw ?? []).map((row) => [
      row.ejercicio_id,
      { reps_objetivo: row.reps_objetivo, peso_referencia_kg: row.peso_referencia_kg },
    ])
  );

  if (!tieneDiarias && rutinasHoy.length) {
    const slots = slotsDisponibles("diaria", hoy, 6);
    const hoySet = new Set(rutinasHoy);
    const candidatas = seleccionarPorRutina(
      ejercicios.filter((exercise) => hoySet.has(exercise.rutina_id!)),
      6,
      `${userId}:${hoy}`
    );
    const seleccionadas = completarConCatalogo(candidatas, 6, `${userId}:${hoy}`).slice(0, slots.length);
    if (seleccionadas.length) {
      await supabase.from("usuario_misiones").insert(
        filasMision({
          ejercicios: seleccionadas,
          frecuencia: "diaria",
          inicio: hoy,
          fin: hoy,
          nivel,
          progreso,
          seriesPorEjercicio: new Map(),
          diasPorEjercicio: new Map(),
          slots,
          userId,
        })
      );
    }
  }

  if (!tieneSemanales) {
    const slots = slotsDisponibles("semanal", semana, 4);
    const seleccionadas = completarConCatalogo(
      seleccionarPorRutina(ejercicios, 4, `${userId}:${semana}`),
      4,
      `${userId}:${semana}`
    ).slice(0, slots.length);
    const diasPorRutina = new Map<string, Set<number>>();
    for (const row of diasRutina ?? []) {
      const dias = diasPorRutina.get(row.rutina_id) ?? new Set<number>();
      dias.add(row.dia_semana);
      diasPorRutina.set(row.rutina_id, dias);
    }
    const diasPorEjercicio = new Map<string, Set<number>>();
    for (const exercise of ejercicios) {
      const dias = diasPorEjercicio.get(exercise.ejercicio_id) ?? new Set<number>();
      for (const dia of diasPorRutina.get(exercise.rutina_id!) ?? []) dias.add(dia);
      diasPorEjercicio.set(exercise.ejercicio_id, dias);
    }
    const baseSeries = objetivoSeries(nivel);
    const exposiciones = new Map(
      seleccionadas.slice(0, 4).map((exercise) => [
        exercise.ejercicio_id,
        Math.min(3, Math.max(2, diasPorEjercicio.get(exercise.ejercicio_id)?.size ?? 1)),
      ])
    );
    const seriesPorEjercicio = new Map(
      seleccionadas.slice(0, 4).map((exercise) => [
        exercise.ejercicio_id,
        baseSeries * (exposiciones.get(exercise.ejercicio_id) ?? 1),
      ])
    );
    if (seleccionadas.length) {
      await supabase.from("usuario_misiones").insert(
        filasMision({
          ejercicios: seleccionadas.slice(0, 4),
          frecuencia: "semanal",
          inicio: semana,
          fin: fechaFinal(semana, 6),
          nivel,
          progreso,
          seriesPorEjercicio,
          diasPorEjercicio: exposiciones,
          slots,
          userId,
        })
      );
    }
  }
}
