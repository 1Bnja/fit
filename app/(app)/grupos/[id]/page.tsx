import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GrupoHeader from "@/components/GrupoHeader";
import { Flame, ChartLine, Dumbbell } from "reicon-react";

const DIA_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function GrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: grupo }, { data: miembros }] = await Promise.all([
    supabase.from("grupos").select("id, nombre, codigo").eq("id", id).single(),
    supabase.from("grupo_miembros").select("user_id, profiles(nombre)").eq("grupo_id", id),
  ]);

  if (!grupo) notFound();

  const memberIds = (miembros ?? []).map((m) => m.user_id);
  const nombrePorId = new Map(
    (miembros ?? []).map((m) => {
      const perfil = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return [m.user_id, perfil?.nombre ?? "?"];
    })
  );

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
      <GrupoHeader nombre={grupo.nombre} codigo={grupo.codigo} miembros={memberIds.length} />

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
            {actividad.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3 text-sm"
              >
                <span>
                  <span className="font-medium">{nombrePorId.get(a.user_id) ?? "?"}</span>{" "}
                  <span className="text-muted">
                    {a.ejercicio_nombre} · {a.peso_kg} kg{a.reps ? ` × ${a.reps}` : ""}
                  </span>
                </span>
                <span className="text-xs text-muted">
                  {new Date(a.created_at).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </li>
            ))}
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
          <ul className="flex flex-col gap-2">
            {[...progresoPorEjercicio.entries()].map(([ejercicio, porMiembro]) => (
              <li key={ejercicio} className="rounded-2xl border border-border bg-surface p-3 text-sm">
                <p className="mb-2 font-medium">{ejercicio}</p>
                <ul className="flex flex-col gap-1">
                  {[...porMiembro.entries()].map(([uid, r]) => (
                    <li key={uid} className="flex items-center justify-between text-xs text-muted">
                      <span>{nombrePorId.get(uid) ?? "?"}</span>
                      <span className="text-foreground">
                        {r.peso_kg} kg{r.reps ? ` × ${r.reps}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
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
            {rutinasGrupo.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3 text-sm"
              >
                <span>
                  <span className="font-medium">{r.nombre}</span>{" "}
                  <span className="text-muted">— {nombrePorId.get(r.user_id) ?? "?"}</span>
                </span>
                <span className="flex gap-1">
                  {(diasPorRutina.get(r.id) ?? []).map((d) => (
                    <span key={d} className="text-xs text-muted">
                      {DIA_LABEL[d]}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
