import { createClient } from "@/lib/supabase/server";
import { mascotaEstaInactiva } from "@/lib/mascota.mjs";
import Mascota from "@/components/mascota/Mascota";
import { Scale, Ruler, Flame, ChevronRight, Dumbbell } from "reicon-react";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoy = new Date().getDay();

  const [{ data: profile }, { data: rutinasHoy }, { data: ultimoRegistro }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nombre, peso_kg, estatura_cm, created_at")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("rutina_dias")
      .select("rutinas(id, nombre)")
      .eq("user_id", user!.id)
      .eq("dia_semana", hoy),
    supabase
      .from("registros_ejercicio")
      .select("created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const mostrarTumba = mascotaEstaInactiva(
    ultimoRegistro?.created_at ?? profile?.created_at
  );

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

      <Mascota inactiva={mostrarTumba} />

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
