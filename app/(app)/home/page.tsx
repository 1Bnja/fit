import { createClient } from "@/lib/supabase/server";
import { mascotaEstaInactiva, obtenerEvolucionMascota } from "@/lib/mascota.mjs";
import {
  asegurarMisionesActuales,
  periodosActuales,
  type MisionAsignada,
  type NivelEntrenamiento,
  type StatMascota,
} from "@/lib/misiones";
import Mascota from "@/components/mascota/Mascota";
import { Scale, Ruler, Flame, ChevronRight, Dumbbell } from "reicon-react";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoy = new Date().getDay();

  const [{ data: profile }, { data: rutinasHoy }, { data: mascotaUsuario }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nombre, peso_kg, estatura_cm, created_at, last_active_at, nivel_entrenamiento, timezone")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("rutina_dias")
      .select("rutinas(id, nombre)")
      .eq("user_id", user!.id)
      .eq("dia_semana", hoy),
    supabase
      .from("usuario_mascotas")
      .select(`
        xp,
        estado,
        piernas,
        brazos,
        pecho,
        abdomen,
        espalda,
        mascotas (
          clave,
          nombre,
          mascota_fases (
            numero,
            nombre,
            xp_requerida,
            stat_minima_requerida,
            imagen_url
          )
        )
      `)
      .eq("user_id", user!.id)
      .eq("seleccionada", true)
      .maybeSingle(),
  ]);

  const mascota = Array.isArray(mascotaUsuario?.mascotas)
    ? mascotaUsuario.mascotas[0]
    : mascotaUsuario?.mascotas;
  const fasesMascota = mascota?.mascota_fases ?? [];
  const imagenInicial = [...fasesMascota].sort((a, b) => a.numero - b.numero)[0]?.imagen_url ?? null;
  const stats = {
    piernas: mascotaUsuario?.piernas ?? 0,
    brazos: mascotaUsuario?.brazos ?? 0,
    pecho: mascotaUsuario?.pecho ?? 0,
    abdomen: mascotaUsuario?.abdomen ?? 0,
    espalda: mascotaUsuario?.espalda ?? 0,
  } satisfies Record<StatMascota, number>;
  await asegurarMisionesActuales(supabase, user!.id, {
    nivel: (profile?.nivel_entrenamiento ?? "principiante") as NivelEntrenamiento,
    timezone: profile?.timezone ?? "America/Santiago",
  });
  const periodos = periodosActuales(profile?.timezone ?? "America/Santiago");
  const { data: misiones } = await supabase
    .from("usuario_misiones")
    .select("id, frecuencia, ejercicio_id, ejercicio_nombre, stat, series_objetivo, dias_objetivo, dias_completados, reps_objetivo, peso_sugerido_kg, progreso, puntos_evolucion, puntos_stat, completada_at")
    .eq("user_id", user!.id)
    .in("periodo_inicio", [periodos.hoy, periodos.semana])
    .order("frecuencia")
    .order("slot");
  const xp = mascotaUsuario?.xp ?? 0;
  const { faseActual, siguiente, progreso } = obtenerEvolucionMascota(
    fasesMascota,
    xp,
    stats
  );
  const mostrarTumba =
    mascotaUsuario?.estado === "tumba" ||
    mascotaEstaInactiva(profile?.last_active_at ?? profile?.created_at);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium">Hola, {profile?.nombre}</h1>
        <div className="mt-3 flex gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm">
            <Scale size={16} className="text-accent" />
            {profile?.peso_kg ?? "—"} kg
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm">
            <Ruler size={16} className="text-accent" />
            {profile?.estatura_cm ?? "—"} cm
          </div>
        </div>
      </div>

      <Mascota
        clave={mascota?.clave ?? "ovejita"}
        nombre={mascota?.nombre ?? "Ovejita"}
        fase={faseActual?.nombre ?? "Fase inicial"}
        imagenUrl={faseActual?.imagen_url ?? imagenInicial}
        inactiva={mostrarTumba}
        progreso={progreso}
        stats={stats}
        misionesDiarias={((misiones ?? []).filter((mision) => mision.frecuencia === "diaria") as MisionAsignada[])}
        misionesSemanales={((misiones ?? []).filter((mision) => mision.frecuencia === "semanal") as MisionAsignada[])}
        minimoStatSiguiente={
          siguiente?.stat_minima_requerida ?? faseActual?.stat_minima_requerida ?? 0
        }
      />

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
          <Flame size={16} />
          Rutinas de hoy
        </h2>
        {!rutinasHoy?.length ? (
          <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
            No tienes rutinas asignadas para hoy.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rutinasHoy.map((r) => {
              const rutina = Array.isArray(r.rutinas) ? r.rutinas[0] : r.rutinas;
              if (!rutina) return null;
              return (
                <li key={rutina.id}>
                  <Link
                    href={`/rutinas/${rutina.id}`}
                    className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-sm hover:border-accent"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-accent">
                        <Dumbbell size={18} />
                      </span>
                      {rutina.nombre}
                    </span>
                    <ChevronRight size={16} className="text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
