"use client";

import { useState } from "react";
import { CATEGORIAS, CATEGORIA_LABEL, type Categoria } from "@/lib/categorias";

function CategoriaIcon({ categoria }: { categoria: Categoria }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-lg text-muted">
        {CATEGORIA_LABEL[categoria][0]}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/categorias/${categoria}.svg`}
      alt=""
      className="h-12 w-12"
      onError={() => setFailed(true)}
    />
  );
}

export default function CategoriaGrid({
  onSelect,
}: {
  onSelect: (categoria: Categoria) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {CATEGORIAS.map((categoria) => (
        <button
          key={categoria}
          type="button"
          onClick={() => onSelect(categoria)}
          className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4 hover:border-accent"
        >
          <CategoriaIcon categoria={categoria} />
          <span className="text-sm">{CATEGORIA_LABEL[categoria]}</span>
        </button>
      ))}
    </div>
  );
}
