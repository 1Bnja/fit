"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Weight, Trash, Check, ChevronDown } from "reicon-react";
import { registrarPeso } from "@/app/actions/registros";
import ProgresoChart from "@/components/ProgresoChart";

export type Registro = {
  id: string;
  peso_kg: number;
  reps: number | null;
  created_at: string;
};

export default function EjercicioRow({
  rutinaId,
  ejercicioId,
  ejercicioNombre,
  historial,
  onQuitar,
}: {
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
    <li className="rounded-2xl border border-border bg-surface text-sm">
      <div className="flex items-center justify-between p-3">
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
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger"
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
                {historial.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-xs text-muted">
                    <span>
                      {new Date(r.created_at).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                    <span className="text-foreground">
                      {r.peso_kg} kg{r.reps ? ` × ${r.reps}` : ""}
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
