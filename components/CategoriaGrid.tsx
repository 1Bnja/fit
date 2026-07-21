"use client";

import { useState } from "react";
import { Dumbbell, Dumbbell3, Dumbbell2, Run } from "reicon-react";
import { CATEGORIAS, CATEGORIA_LABEL, type Categoria } from "@/lib/categorias";

const FALLBACK_ICON: Record<Categoria, typeof Dumbbell> = {
  pecho: Dumbbell,
  espalda: Dumbbell2,
  brazos: Dumbbell3,
  piernas: Run,
};

function CategoriaIcon({ categoria }: { categoria: Categoria }) {
  const [failed, setFailed] = useState(false);
  const Fallback = FALLBACK_ICON[categoria];

  if (failed) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-accent">
        <Fallback size={22} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/categorias/${categoria}.png`}
      alt=""
      className="h-12 w-12 invert"
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CATEGORIAS.map((categoria) => (
        <button
          key={categoria}
          type="button"
          onClick={() => onSelect(categoria)}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 hover:border-accent"
        >
          <CategoriaIcon categoria={categoria} />
          <span className="text-sm">{CATEGORIA_LABEL[categoria]}</span>
        </button>
      ))}
    </div>
  );
}
