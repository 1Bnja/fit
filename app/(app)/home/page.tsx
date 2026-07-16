import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, peso_kg, estatura_cm")
    .eq("id", user!.id)
    .single();

  const hoy = new Date().getDay();

  const { data: rutinasHoy } = await supabase
    .from("rutina_dias")
    .select("rutinas(id, nombre)")
    .eq("user_id", user!.id)
    .eq("dia_semana", hoy);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium">Hola, {profile?.nombre}</h1>
        <p className="text-sm text-muted">
          {profile?.peso_kg ?? "—"} kg · {profile?.estatura_cm ?? "—"} cm
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted">Rutinas de hoy</h2>
        {!rutinasHoy?.length ? (
          <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
            No tienes rutinas asignadas para hoy.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rutinasHoy.map((r) => {
              const rutina = Array.isArray(r.rutinas) ? r.rutinas[0] : r.rutinas;
              if (!rutina) return null;
              return (
                <li
                  key={rutina.id}
                  className="rounded-lg border border-border bg-surface p-4 text-sm"
                >
                  {rutina.nombre}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
