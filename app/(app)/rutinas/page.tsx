import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RutinasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rutinas } = await supabase
    .from("rutinas")
    .select("id, nombre")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Rutinas</h1>
        <Link
          href="/rutinas/nueva"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          + Nueva rutina
        </Link>
      </div>

      {!rutinas?.length ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          Aún no tienes rutinas.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rutinas.map((r) => (
            <li key={r.id}>
              <Link
                href={`/rutinas/${r.id}`}
                className="block rounded-lg border border-border bg-surface p-4 text-sm hover:border-accent"
              >
                {r.nombre}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
