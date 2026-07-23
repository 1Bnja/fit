"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, List, X, Trash } from "reicon-react";
import CategoriaGrid from "@/components/CategoriaGrid";
import EjercicioRow, { type Registro } from "@/components/EjercicioRow";
import { exercisesByCategoria } from "@/lib/exercises";
import { CATEGORIA_LABEL, type Categoria } from "@/lib/categorias";
import {
  asignarDias,
  agregarEjercicios,
  quitarEjercicio,
  moverEjercicio,
  crearEjercicioCustom,
  eliminarRutina,
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

type RutinaEjercicio = {
  id: string;
  ejercicio_id: string;
  ejercicio_nombre: string;
  es_custom: boolean;
};

type Vista = "lista" | "categorias" | "ejercicios" | "custom";

export default function RutinaEditor({
  rutinaId,
  nombre,
  ejerciciosIniciales,
  diasIniciales,
  historialPorEjercicio,
}: {
  rutinaId: string;
  nombre: string;
  ejerciciosIniciales: RutinaEjercicio[];
  diasIniciales: number[];
  historialPorEjercicio: Record<string, Registro[]>;
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

  function mover(id: string, direccion: "arriba" | "abajo") {
    startTransition(async () => {
      await moverEjercicio(rutinaId, id, direccion);
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

  function eliminar() {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      await eliminarRutina(rutinaId);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">{nombre}</h1>
        <button
          type="button"
          onClick={eliminar}
          aria-label="Eliminar rutina"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
        >
          <Trash size={16} />
        </button>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
          <Calendar size={16} />
          Días
        </h2>
        <div className="flex gap-2">
          {DIAS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDia(d.value)}
              className={`h-10 w-10 rounded-full border text-sm transition-colors ${
                dias.has(d.value)
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface hover:border-accent"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted">
            <List size={16} />
            Ejercicios
          </h2>
          {vista === "lista" && (
            <button
              type="button"
              onClick={() => setVista("categorias")}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              <Plus size={14} />
              Agregar ejercicio
            </button>
          )}
        </div>

        {vista === "lista" && (
          <>
            {!ejerciciosIniciales.length ? (
              <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
                Sin ejercicios todavía.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {ejerciciosIniciales.map((e, i) => (
                  <EjercicioRow
                    key={e.id}
                    rutinaId={rutinaId}
                    ejercicioId={e.ejercicio_id}
                    ejercicioNombre={e.ejercicio_nombre}
                    historial={historialPorEjercicio[e.ejercicio_id] ?? []}
                    onQuitar={() => quitar(e.id)}
                    onMoverArriba={() => mover(e.id, "arriba")}
                    onMoverAbajo={() => mover(e.id, "abajo")}
                    esPrimero={i === 0}
                    esUltimo={i === ejerciciosIniciales.length - 1}
                  />
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
              className="flex items-center gap-1.5 self-start text-sm text-muted hover:text-foreground"
            >
              <X size={14} />
              Cancelar
            </button>
          </div>
        )}

        {vista === "ejercicios" && categoriaActiva && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm text-muted">{CATEGORIA_LABEL[categoriaActiva]}</h3>
            <ul className="flex flex-col gap-2">
              {exercisesByCategoria(categoriaActiva).map((e) => {
                const checked = seleccionados.has(e.id);
                return (
                  <li key={e.id}>
                    <label
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-sm ${
                        checked ? "border-accent bg-surface-2" : "border-border bg-surface"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = new Set(seleccionados);
                          next.has(e.id) ? next.delete(e.id) : next.add(e.id);
                          setSeleccionados(next);
                        }}
                      />
                      {e.nombre}
                    </label>
                  </li>
                );
              })}
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
                className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
              >
                <Plus size={14} />
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
                className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
              >
                <Plus size={14} />
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
