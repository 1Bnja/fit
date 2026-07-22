"use client";

import { useState } from "react";
import { Copy, Check, Users } from "reicon-react";

export default function GrupoHeader({
  nombre,
  codigo,
  miembros,
}: {
  nombre: string;
  codigo: string;
  miembros: number;
}) {
  const [copiado, setCopiado] = useState(false);

  function copiarLink() {
    const url = `${window.location.origin}/grupos/unirse?codigo=${codigo}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
      <div>
        <h1 className="text-xl font-medium">{nombre}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Users size={14} />
          {miembros} {miembros === 1 ? "miembro" : "miembros"} · código {codigo}
        </p>
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
