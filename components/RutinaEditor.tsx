"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CategoriaGrid from "@/components/CategoriaGrid";
import { exercisesByCategoria } from "@/lib/exercises";
import { CATEGORIA_LABEL, type Categoria } from "@/lib/categorias";
import {
  asignarDias,
  agregarEjercicios,
  quitarEjercicio,
  crearEjercicioCustom,
} from "@/app/actions/rutinas";

const DIAS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

type RutinaEjercicio = { id: string; ejercicio_nombre: string; es_custom: boolean };

type Vista = "lista" | "categorias" | "ejercicios" | "custom";

export default function RutinaEditor({
  rutinaId,
  nombre,
  ejerciciosIniciales,
  diasIniciales,
}: {
  rutinaId: string;
  nombre: string;
  ejerciciosIniciales: RutinaEjercicio[];
  diasIniciales: number[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dias, setDias] = useState(new Set(diasIniciales));
  const [vista, setVista] = useState<Vista>("lista");
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria | null>(null);
  const [seleccionados, setSeleccionados] = useState(new Set<string>());
  const [customNombre, setCustomNombre] = useState("");

  function toggleDia(dia: number) {
    const next = new Set(dias);
    next.has(dia) ? next.delete(dia) : next.add(dia);
    setDias(next);
    startTransition(async () => {
      await asignarDias(rutinaId, [...next]);
      router.refresh();
    });
  }

  function quitar(id: string) {
    startTransition(async () => {
      await quitarEjercicio(rutinaId, id);
      router.refresh();
    });
  }

  function agregarSeleccionados() {
    if (!categoriaActiva) return;
    const ejercicios = exercisesByCategoria(categoriaActiva)
      .filter((e) => seleccionados.has(e.id))
      .map((e) => ({ id: e.id, nombre: e.nombre, esCustom: false }));

    startTransition(async () => {
      await agregarEjercicios(rutinaId, ejercicios);
      router.refresh();
    });
    setSeleccionados(new Set());
    setVista("lista");
  }

  function crearCustom() {
    if (!categoriaActiva || !customNombre.trim()) return;
    startTransition(async () => {
      await crearEjercicioCustom(rutinaId, customNombre.trim(), categoriaActiva);
      router.refresh();
    });
    setCustomNombre("");
    setVista("lista");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-medium">{nombre}</h1>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted">Días</h2>
        <div className="flex gap-2">
          {DIAS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDia(d.value)}
              className={`h-10 w-10 rounded-md border text-sm ${
                dias.has(d.value)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">Ejercicios</h2>
          {vista === "lista" && (
            <button
              type="button"
              onClick={() => setVista("categorias")}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
            >
              + Agregar ejercicio
            </button>
          )}
        </div>

        {vista === "lista" && (
          <>
            {!ejerciciosIniciales.length ? (
              <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                Sin ejercicios todavía.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {ejerciciosIniciales.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm"
                  >
                    <span>{e.ejercicio_nombre}</span>
                    <button
                      type="button"
                      onClick={() => quitar(e.id)}
                      className="text-sm text-muted hover:text-danger"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {vista === "categorias" && (
          <div className="flex flex-col gap-3">
            <CategoriaGrid
              onSelect={(categoria) => {
                setCategoriaActiva(categoria);
                setVista("ejercicios");
              }}
            />
            <button
              type="button"
              onClick={() => setVista("lista")}
              className="self-start text-sm text-muted hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        )}

        {vista === "ejercicios" && categoriaActiva && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm text-muted">{CATEGORIA_LABEL[categoriaActiva]}</h3>
            <ul className="flex flex-col gap-2">
              {exercisesByCategoria(categoriaActiva).map((e) => (
                <li key={e.id}>
                  <label className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={seleccionados.has(e.id)}
                      onChange={() => {
                        const next = new Set(seleccionados);
                        next.has(e.id) ? next.delete(e.id) : next.add(e.id);
                        setSeleccionados(next);
                      }}
                    />
                    {e.nombre}
                  </label>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setVista("custom")}
              className="self-start text-sm text-accent"
            >
              No encuentro mi ejercicio
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={agregarSeleccionados}
                disabled={!seleccionados.size}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
              >
                Agregar seleccionados
              </button>
              <button
                type="button"
                onClick={() => setVista("categorias")}
                className="text-sm text-muted hover:text-foreground"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {vista === "custom" && categoriaActiva && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm text-muted">
              Nuevo ejercicio en {CATEGORIA_LABEL[categoriaActiva]}
            </h3>
            <input
              type="text"
              placeholder="Nombre del ejercicio"
              value={customNombre}
              onChange={(e) => setCustomNombre(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={crearCustom}
                disabled={!customNombre.trim()}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
              >
                Guardar y agregar
              </button>
              <button
                type="button"
                onClick={() => setVista("ejercicios")}
                className="text-sm text-muted hover:text-foreground"
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
