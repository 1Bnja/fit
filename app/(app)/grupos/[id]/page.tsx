import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GrupoHeader from "@/components/GrupoHeader";
import Avatar from "@/components/Avatar";
import { tiempoRelativo } from "@/lib/formato";
import { Flame, ChartLine, Dumbbell } from "reicon-react";

const DIA_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Miembro = {
  user_id: string;
  nombre: string | null;
  apellido: string | null;
  avatar_url: string | null;
};

export default async function GrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: grupo }, { data: miembrosRaw }] = await Promise.all([
    supabase.from("grupos").select("id, nombre, codigo").eq("id", id).single(),
    supabase
      .from("grupo_miembros")
      .select("user_id, profiles(nombre, apellido, avatar_url)")
      .eq("grupo_id", id),
  ]);

  if (!grupo) notFound();

  const miembros: Miembro[] = (miembrosRaw ?? []).map((m) => {
    const perfil = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      user_id: m.user_id,
      nombre: perfil?.nombre ?? null,
      apellido: perfil?.apellido ?? null,
      avatar_url: perfil?.avatar_url ?? null,
    };
  });

  const memberIds = miembros.map((m) => m.user_id);
  const porId = new Map(miembros.map((m) => [m.user_id, m]));

  const [{ data: actividad }, { data: rutinasGrupo }, { data: diasGrupo }, { data: progresoRaw }] =
    await Promise.all([
      supabase
        .from("registros_ejercicio")
        .select("id, ejercicio_nombre, peso_kg, reps, created_at, user_id")
        .in("user_id", memberIds)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("rutinas")
        .select("id, nombre, user_id")
        .in("user_id", memberIds)
        .order("created_at", { ascending: false }),
      supabase.from("rutina_dias").select("rutina_id, dia_semana").in("user_id", memberIds),
      supabase
        .from("registros_ejercicio")
        .select("ejercicio_nombre, peso_kg, reps, user_id")
        .in("user_id", memberIds)
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

  const diasPorRutina = new Map<string, number[]>();
  for (const d of diasGrupo ?? []) {
    const lista = diasPorRutina.get(d.rutina_id) ?? [];
    lista.push(d.dia_semana);
    diasPorRutina.set(d.rutina_id, lista);
  }

  const progresoPorEjercicio = new Map<string, Map<string, { peso_kg: number; reps: number | null }>>();
  for (const r of progresoRaw ?? []) {
    const porMiembro = progresoPorEjercicio.get(r.ejercicio_nombre) ?? new Map();
    if (!porMiembro.has(r.user_id)) {
      porMiembro.set(r.user_id, { peso_kg: r.peso_kg, reps: r.reps });
    }
    progresoPorEjercicio.set(r.ejercicio_nombre, porMiembro);
  }

  return (
    <div className="flex flex-col gap-6">
      <GrupoHeader nombre={grupo.nombre} codigo={grupo.codigo} miembros={miembros} />

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
          <Flame size={16} />
          Actividad reciente
        </h2>
        {!actividad?.length ? (
          <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
            Nadie ha registrado peso todavía.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {actividad.map((a) => {
              const m = porId.get(a.user_id);
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-sm"
                >
                  <Avatar nombre={m?.nombre} apellido={m?.apellido} avatarUrl={m?.avatar_url} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{m?.nombre ?? "?"}</span>{" "}
                    <span className="text-muted">
                      {a.ejercicio_nombre} · {a.peso_kg} kg{a.reps ? ` × ${a.reps}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {tiempoRelativo(new Date(a.created_at))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
          <ChartLine size={16} />
          Progreso por ejercicio
        </h2>
        {!progresoPorEjercicio.size ? (
          <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
            Sin datos todavía.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {[...progresoPorEjercicio.entries()].map(([ejercicio, porMiembro]) => {
              const maxPeso = Math.max(...[...porMiembro.values()].map((r) => r.peso_kg));
              return (
                <li key={ejercicio} className="rounded-2xl border border-border bg-surface p-3 text-sm">
                  <p className="mb-3 font-medium">{ejercicio}</p>
                  <ul className="flex flex-col gap-2.5">
                    {[...porMiembro.entries()]
                      .sort((a, b) => b[1].peso_kg - a[1].peso_kg)
                      .map(([uid, r]) => {
                        const m = porId.get(uid);
                        return (
                          <li key={uid} className="flex items-center gap-2.5">
                            <Avatar
                              nombre={m?.nombre}
                              apellido={m?.apellido}
                              avatarUrl={m?.avatar_url}
                              size={24}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="text-muted">{m?.nombre ?? "?"}</span>
                                <span className="text-foreground">
                                  {r.peso_kg} kg{r.reps ? ` × ${r.reps}` : ""}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-surface-2">
                                <div
                                  className="h-1.5 rounded-full bg-accent"
                                  style={{ width: `${(r.peso_kg / maxPeso) * 100}%` }}
                                />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
          <Dumbbell size={16} />
          Rutinas del grupo
        </h2>
        {!rutinasGrupo?.length ? (
          <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
            Nadie ha creado una rutina todavía.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rutinasGrupo.map((r) => {
              const m = porId.get(r.user_id);
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-sm"
                >
                  <Avatar nombre={m?.nombre} apellido={m?.apellido} avatarUrl={m?.avatar_url} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{r.nombre}</span>{" "}
                    <span className="text-muted">— {m?.nombre ?? "?"}</span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    {(diasPorRutina.get(r.id) ?? []).map((d) => (
                      <span key={d} className="text-xs text-muted">
                        {DIA_LABEL[d]}
                      </span>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
