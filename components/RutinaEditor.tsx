"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, List, X, Trash, ChevronDown, Search } from "reicon-react";
import CategoriaGrid from "@/components/CategoriaGrid";
import EjercicioRow, { type Registro } from "@/components/EjercicioRow";
import { buscar, exercisesByMusculo, type Exercise } from "@/lib/exercises";
import {
  CATEGORIA_LABEL,
  MUSCULO_LABEL,
  MUSCULOS_POR_CATEGORIA,
  type Categoria,
} from "@/lib/categorias";
import {
  asignarDias,
  agregarEjercicios,
  quitarEjercicio,
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
};

type Vista = "lista" | "categorias" | "ejercicios";

function ListaSeleccionable({
  exercises,
  seleccionados,
  onToggle,
}: {
  exercises: Exercise[];
  seleccionados: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (!exercises.length) {
    return <p className="p-3 text-sm text-muted">Sin resultados.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {exercises.map((e) => {
        const checked = seleccionados.has(e.id);
        return (
          <li key={e.id}>
            <label
              className={`flex items-center gap-3 rounded-2xl border p-3 text-sm ${
                checked ? "border-accent bg-surface-2" : "border-border bg-surface"
              }`}
            >
              <input type="checkbox" checked={checked} onChange={() => onToggle(e.id)} />
              {e.nombre}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

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
  const [query, setQuery] = useState("");

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

  function toggleSeleccion(id: string) {
    const next = new Set(seleccionados);
    next.has(id) ? next.delete(id) : next.add(id);
    setSeleccionados(next);
  }

  function cerrarSelector() {
    setSeleccionados(new Set());
    setQuery("");
    setVista("lista");
  }

  function agregarSeleccionados() {
    if (!seleccionados.size) return;
    const ids = [...seleccionados];
    startTransition(async () => {
      await agregarEjercicios(rutinaId, ids);
      router.refresh();
    });
    cerrarSelector();
  }

  function eliminar() {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      await eliminarRutina(rutinaId);
    });
  }

  const musculos = categoriaActiva ? MUSCULOS_POR_CATEGORIA[categoriaActiva] : [];

  // La selección se guarda por id, así que sobrevive al cambiar de músculo o de
  // categoría: puedes marcar en Bíceps, abrir Tríceps y agregar todo de una.
  const botonAgregar = (
    <button
      type="button"
      onClick={agregarSeleccionados}
      disabled={!seleccionados.size}
      className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
    >
      <Plus size={14} />
      Agregar{seleccionados.size ? ` (${seleccionados.size})` : ""}
    </button>
  );

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

        {vista === "lista" &&
          (!ejerciciosIniciales.length ? (
            <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
              Sin ejercicios todavía.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {ejerciciosIniciales.map((e) => (
                <EjercicioRow
                  key={e.id}
                  rutinaId={rutinaId}
                  ejercicioId={e.ejercicio_id}
                  ejercicioNombre={e.ejercicio_nombre}
                  historial={historialPorEjercicio[e.ejercicio_id] ?? []}
                  onQuitar={() => quitar(e.id)}
                />
              ))}
            </ul>
          ))}

        {vista === "categorias" && (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3">
              <Search size={16} className="shrink-0 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(ev) => setQuery(ev.target.value)}
                placeholder="Buscar ejercicio"
                className="flex-1 border-0 bg-transparent p-0 py-3 focus:outline-none"
              />
            </label>

            {query.trim() ? (
              <>
                <ListaSeleccionable
                  exercises={buscar(query)}
                  seleccionados={seleccionados}
                  onToggle={toggleSeleccion}
                />
                <div className="flex gap-2">
                  {botonAgregar}
                  <button
                    type="button"
                    onClick={cerrarSelector}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <CategoriaGrid
                  onSelect={(categoria) => {
                    setCategoriaActiva(categoria);
                    setVista("ejercicios");
                  }}
                />
                <button
                  type="button"
                  onClick={cerrarSelector}
                  className="flex items-center gap-1.5 self-start text-sm text-muted hover:text-foreground"
                >
                  <X size={14} />
                  Cancelar
                </button>
              </>
            )}
          </div>
        )}

        {vista === "ejercicios" && categoriaActiva && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm text-muted">{CATEGORIA_LABEL[categoriaActiva]}</h3>

            {musculos.length === 1 ? (
              <ListaSeleccionable
                exercises={exercisesByMusculo(musculos[0])}
                seleccionados={seleccionados}
                onToggle={toggleSeleccion}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {musculos.map((musculo) => (
                  <details
                    key={musculo}
                    className="group rounded-2xl border border-border bg-surface"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm">
                      <ChevronDown
                        size={14}
                        className="text-muted transition-transform group-open:rotate-180"
                      />
                      {MUSCULO_LABEL[musculo]}
                    </summary>
                    <div className="border-t border-border p-3">
                      <ListaSeleccionable
                        exercises={exercisesByMusculo(musculo)}
                        seleccionados={seleccionados}
                        onToggle={toggleSeleccion}
                      />
                    </div>
                  </details>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {botonAgregar}
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
      </div>
    </div>
  );
}
