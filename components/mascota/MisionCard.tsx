"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "reicon-react";
import { registrarMision } from "@/app/actions/registros";

type MisionCardProps = {
  registrable?: boolean;
  mision: {
    id: string;
    ejercicio_id: string;
    ejercicio_nombre: string;
    stat: string;
    series_objetivo: number;
    dias_objetivo: number;
    dias_completados: number;
    reps_objetivo: number;
    peso_sugerido_kg: number | null;
    progreso: number;
    puntos_evolucion: number;
    puntos_stat: number;
    completada_at: string | null;
  };
};

export default function MisionCard({ mision, registrable = false }: MisionCardProps) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [peso, setPeso] = useState(mision.peso_sugerido_kg?.toString() ?? "");
  const [reps, setReps] = useState(mision.reps_objetivo.toString());
  const [error, setError] = useState<string | null>(null);
  const completada = Boolean(mision.completada_at);
  const puedeRegistrar = registrable && !completada;
  const popoverId = `registrar-mision-${mision.id}`;
  const avanceSeries = mision.series_objetivo
    ? (mision.progreso / mision.series_objetivo) * 100
    : 0;
  const avanceDias = mision.dias_objetivo
    ? (mision.dias_completados / mision.dias_objetivo) * 100
    : 0;
  const avance = Math.round(
    Math.min(
      100,
      mision.dias_objetivo > 1
        ? (Math.min(100, avanceSeries) + Math.min(100, avanceDias)) / 2
        : avanceSeries
    )
  );

  function guardar() {
    startTransition(async () => {
      const result = await registrarMision(
        mision.id,
        mision.ejercicio_id,
        mision.ejercicio_nombre,
        Number(peso),
        Number(reps)
      );
      setError(result.error ?? null);
      if (!result.error) {
        document.getElementById(popoverId)?.hidePopover();
        router.refresh();
      }
    });
  }

  return (
    <>
    <article className={`relative rounded-xl border border-border bg-surface p-3 text-sm ${puedeRegistrar ? "hover:border-accent" : ""}`}>
      {puedeRegistrar && (
        <button
          type="button"
          popoverTarget={popoverId}
          aria-label={`Registrar una serie de ${mision.ejercicio_nombre}`}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-medium">{mision.ejercicio_nombre}</h4>
          <p className="mt-1 text-xs text-muted">
            {mision.series_objetivo} series × {mision.reps_objetivo} repeticiones
            {mision.peso_sugerido_kg ? ` · sugerido ${mision.peso_sugerido_kg} kg` : ""}
          </p>
        </div>
        <span className="rounded-full bg-surface-2 px-2 py-1 text-xs text-accent"> {mision.stat} </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>
          {Math.min(mision.progreso, mision.series_objetivo)}/{mision.series_objetivo} series
          {mision.dias_objetivo > 1
            ? ` · ${Math.min(mision.dias_completados, mision.dias_objetivo)}/${mision.dias_objetivo} días`
            : ""}
        </span>
        <span>+{mision.puntos_evolucion} XP +{mision.puntos_stat} {mision.stat}</span>
      </div>

      <div
        role="progressbar"
        aria-label={`Progreso de ${mision.ejercicio_nombre}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={avance}
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${avance}%` }}
        />
      </div>

      {completada ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent">
          <Check size={14} /> Completada
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted">
          {registrable ? "Haz clic para registrar una serie." : "En progreso!"}
        </p>
      )}
    </article>

    {puedeRegistrar && (
      <div
        id={popoverId}
        popover="auto"
        role="dialog"
        aria-labelledby={`${popoverId}-titulo`}
        className="m-auto w-[min(90vw,22rem)] rounded-2xl border border-border bg-surface p-5 text-foreground shadow-2xl [&::backdrop]:bg-black/70"
      >
        <h3 id={`${popoverId}-titulo`} className="text-lg font-medium">
          {mision.ejercicio_nombre}
        </h3>
        <p className="mt-1 text-sm text-muted">Registra una serie realizada.</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Peso (kg)
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={peso}
              onChange={(event) => setPeso(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted">
            Repeticiones
            <input
              type="number"
              min="1"
              max="30"
              value={reps}
              onChange={(event) => setReps(event.target.value)}
              required
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={pendiente}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            {pendiente ? "Enviando..." : "Registrar serie"}
          </button>
        </div>
      </div>
    )}
    </>
  );
}
