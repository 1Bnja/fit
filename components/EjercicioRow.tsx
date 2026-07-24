"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Weight, Trash, Check, ChevronDown, Menu } from "reicon-react";
import { registrarPeso } from "@/app/actions/registros";
import ProgresoChart from "@/components/ProgresoChart";

export type Registro = {
  id: string;
  peso_kg: number;
  reps: number | null;
  created_at: string;
};

function agruparPorDia(historial: Registro[]) {
  const grupos: { key: string; fecha: Date; entradas: Registro[] }[] = [];
  for (const r of historial) {
    const fecha = new Date(r.created_at);
    const key = fecha.toDateString();
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.key === key) {
      ultimo.entradas.push(r);
    } else {
      grupos.push({ key, fecha, entradas: [r] });
    }
  }
  return grupos;
}

function etiquetaFecha(fecha: Date) {
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  const mismoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (mismoDia(fecha, hoy)) return "Hoy";
  if (mismoDia(fecha, ayer)) return "Ayer";
  return fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" });
}

export default function EjercicioRow({
  id,
  rutinaId,
  ejercicioId,
  ejercicioNombre,
  historial,
  onQuitar,
}: {
  id: string;
  rutinaId: string;
  ejercicioId: string;
  ejercicioNombre: string;
  historial: Registro[];
  onQuitar: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [peso, setPeso] = useState("");
  const [reps, setReps] = useState("");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  function guardar() {
    const pesoKg = Number(peso);
    if (!pesoKg) return;

    startTransition(async () => {
      await registrarPeso(rutinaId, ejercicioId, ejercicioNombre, pesoKg, reps ? Number(reps) : null);
      router.refresh();
    });
    setPeso("");
    setReps("");
  }

  const ultimo = historial[0];

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-border bg-surface text-sm ${isDragging ? "z-10 opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastrar para reordenar"
          className="flex h-10 w-10 shrink-0 touch-none items-center justify-center rounded-lg text-muted hover:bg-surface-2 active:cursor-grabbing"
        >
          <Menu size={16} />
        </button>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            size={14}
            className={`text-muted transition-transform ${abierto ? "rotate-180" : ""}`}
          />
          <span className="flex flex-col">
            {ejercicioNombre}
            {ultimo && (
              <span className="text-xs text-muted">
                Último: {ultimo.peso_kg} kg{ultimo.reps ? ` × ${ultimo.reps}` : ""}
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={onQuitar}
          aria-label="Quitar ejercicio"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
        >
          <Trash size={16} />
        </button>
      </div>

      {abierto && (
        <div className="flex flex-col gap-3 border-t border-border p-3">
          <div className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs text-muted">Peso (kg)</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={peso}
                onChange={(ev) => setPeso(ev.target.value)}
                placeholder="0"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs text-muted">Reps</span>
              <input
                type="number"
                min="0"
                value={reps}
                onChange={(ev) => setReps(ev.target.value)}
                placeholder="Opcional"
              />
            </label>
            <button
              type="button"
              onClick={guardar}
              disabled={!peso}
              aria-label="Guardar registro"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground disabled:opacity-50"
            >
              <Check size={16} />
            </button>
          </div>

          {historial.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Weight size={13} />
                Historial
              </span>
              <ProgresoChart historial={historial} />
              <ul className="flex flex-col gap-1">
                {agruparPorDia(historial)
                  .slice(0, 5)
                  .map((grupo) => (
                    <li
                      key={grupo.key}
                      className="flex items-center justify-between gap-2 text-xs text-muted"
                    >
                      <span className="shrink-0">{etiquetaFecha(grupo.fecha)}</span>
                      <span className="text-right text-foreground">
                        {grupo.entradas
                          .slice()
                          .reverse()
                          .map((r) => `${r.peso_kg}kg${r.reps ? `×${r.reps}` : ""}`)
                          .join(" · ")}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
