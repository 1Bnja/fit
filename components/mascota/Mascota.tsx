import Image from "next/image";
import styles from "./Mascota.module.css";

const STAT_LABELS = {
  piernas: "Piernas",
  brazos: "Brazos",
  pecho: "Pecho",
  abdomen: "Abdomen",
  espalda: "Espalda",
} as const;

type Stat = keyof typeof STAT_LABELS;

type MascotaProps = {
  clave: string;
  nombre: string;
  fase: string;
  imagenUrl: string | null;
  inactiva: boolean;
  progreso: number;
  stats: Record<Stat, number>;
};

export default function Mascota({
  clave,
  nombre,
  fase,
  imagenUrl,
  inactiva,
  progreso,
  stats,
}: MascotaProps) {
  return (
    <>
      <section
        data-mascota={clave}
        className="flex min-h-40 flex-col items-center gap-2 overflow-hidden rounded-2xl border border-border bg-surface p-5 text-center"
      >
        <h2 className="text-lg font-medium">{nombre}</h2>

        <button
          type="button"
          popoverTarget="mascota-stats"
          aria-label={`Ver estadísticas de ${nombre}`}
          className="rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {inactiva ? (
            <span
              role="img"
              aria-label={`Tumba de ${nombre}`}
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-2 text-sm font-medium text-muted"
            >
              Tumba
            </span>
          ) : imagenUrl ? (
            <Image
              src={imagenUrl}
              alt={`${nombre}, tu mascota virtual`}
              width={128}
              height={128}
              className={`${styles.wiggle} h-28 w-28 shrink-0 object-contain`}
            />
          ) : (
            <span className="flex h-28 w-28 items-center justify-center text-sm text-muted">
              Imagen no disponible
            </span>
          )}
        </button>

        <p className="text-sm text-muted">
          {inactiva ? "Más de una semana sin actividad." : fase}
        </p>
      </section>

      <div
        id="mascota-stats"
        popover="auto"
        role="dialog"
        aria-labelledby="mascota-stats-title"
        className="m-auto w-[min(90vw,24rem)] rounded-2xl border border-border bg-surface p-5 text-foreground shadow-2xl [&::backdrop]:bg-black/70"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="mascota-stats-title" className="text-lg font-medium">
              Estadísticas de {nombre}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Realizar misiones sumará puntos a estos atributos.
            </p>
          </div>
          <button
            type="button"
            popoverTarget="mascota-stats"
            popoverTargetAction="hide"
            aria-label="Cerrar estadísticas"
            className="rounded-lg px-2 py-1 text-muted hover:bg-surface-2 hover:text-foreground"
          >
            ×
          </button>
        </div>

        {inactiva ? (
          <div className="mx-auto mt-4 flex h-28 w-28 items-center justify-center rounded-2xl border border-border bg-surface-2 text-sm font-medium text-muted">
            Tumba
          </div>
        ) : imagenUrl ? (
          <Image
            src={imagenUrl}
            alt={nombre}
            width={128}
            height={128}
            className={`${styles.wiggleContinuo} mx-auto mt-4 h-28 w-28 object-contain`}
          />
        ) : (
          <p className="mt-4 text-center text-sm text-muted">Imagen no disponible</p>
        )}

        <dl className="mt-4 flex flex-col gap-2">
          {(Object.entries(STAT_LABELS) as [Stat, string][]).map(([stat, label]) => (
            <div
              key={stat}
              className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-sm"
            >
              <dt>{label}</dt>
              <dd className="font-medium text-accent">{stats[stat]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section
        aria-labelledby="metas-title"
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="metas-title" className="font-medium">
              Tareas y metas
            </h2>
            <p className="mt-1 text-sm text-muted">
              Completa metas para hacer evolucionar a {nombre}.
            </p>
          </div>
          <span className="text-sm font-medium text-accent">{progreso}%</span>
        </div>

        <progress
          aria-label="Progreso para la siguiente evolución"
          value={progreso}
          max={100}
          className="h-2 w-full accent-accent"
        >
          {progreso}%
        </progress>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <h3 className="text-sm font-medium">Metas diarias</h3>
            <p className="mt-2 text-sm text-muted">Aún no hay metas diarias.</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <h3 className="text-sm font-medium">Metas semanales</h3>
            <p className="mt-2 text-sm text-muted">Aún no hay metas semanales.</p>
          </div>
        </div>
      </section>
    </>
  );
}
