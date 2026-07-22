import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users, Plus, ChevronRight, Link as LinkIcon } from "reicon-react";

export default async function GruposPage() {
  const supabase = await createClient();

  const { data: grupos } = await supabase
    .from("grupos")
    .select("id, nombre, codigo")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Grupos</h1>
        <div className="flex gap-2">
          <Link
            href="/grupos/unirse"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium hover:border-accent"
          >
            <LinkIcon size={16} />
            Unirse
          </Link>
          <Link
            href="/grupos/nuevo"
            className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            <Plus size={16} />
            Crear
          </Link>
        </div>
      </div>

      {!grupos?.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-8 text-center">
          <Users size={28} className="text-muted" />
          <p className="text-sm text-muted">
            Aún no tienes grupos. Crea uno o únete con un código de invitación.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {grupos.map((g) => (
            <li key={g.id}>
              <Link
                href={`/grupos/${g.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-sm hover:border-accent"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-accent">
                    <Users size={18} />
                  </span>
                  {g.nombre}
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
