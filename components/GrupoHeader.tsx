"use client";

import { useState } from "react";
import { Copy, Check } from "reicon-react";
import Avatar from "@/components/Avatar";

type Miembro = {
  user_id: string;
  nombre: string | null;
  apellido: string | null;
  avatar_url: string | null;
};

export default function GrupoHeader({
  nombre,
  codigo,
  miembros,
}: {
  nombre: string;
  codigo: string;
  miembros: Miembro[];
}) {
  const [copiado, setCopiado] = useState(false);

  function copiarLink() {
    const url = `${window.location.origin}/grupos/unirse?codigo=${codigo}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  }

  const visibles = miembros.slice(0, 5);
  const restantes = miembros.length - visibles.length;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
      <div>
        <h1 className="text-xl font-medium">{nombre}</h1>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex -space-x-2">
            {visibles.map((m) => (
              <span key={m.user_id} className="rounded-full ring-2 ring-surface">
                <Avatar nombre={m.nombre} apellido={m.apellido} avatarUrl={m.avatar_url} size={24} />
              </span>
            ))}
            {restantes > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[10px] font-medium text-muted ring-2 ring-surface">
                +{restantes}
              </span>
            )}
          </div>
          <span className="text-xs text-muted">código {codigo}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={copiarLink}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm hover:border-accent"
      >
        {copiado ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
        {copiado ? "Copiado" : "Invitar"}
      </button>
    </div>
  );
}
