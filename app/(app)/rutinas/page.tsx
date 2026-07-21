import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Dumbbell, ChevronRight } from "reicon-react";

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
          className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          <Plus size={16} />
          Nueva rutina
        </Link>
      </div>

      {!rutinas?.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-8 text-center">
          <Dumbbell size={28} className="text-muted" />
          <p className="text-sm text-muted">Aún no tienes rutinas.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rutinas.map((r) => (
            <li key={r.id}>
              <Link
                href={`/rutinas/${r.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-sm hover:border-accent"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-accent">
                    <Dumbbell size={18} />
                  </span>
                  {r.nombre}
                </span>
                <ChevronRight size={16} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
