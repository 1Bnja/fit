import Image from "next/image";
import localFont from "next/font/local";
import styles from "./Mascota.module.css";
import MisionCard from "./MisionCard";
import type { MisionAsignada } from "@/lib/misiones";

const blackFlag = localFont({ src: "./fonts/BlackFlag.ttf" });

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
  misionesDiarias: MisionAsignada[];
  misionesSemanales: MisionAsignada[];
  minimoStatSiguiente: number;
};

export default function Mascota({
  clave,
  nombre,
  fase,
  imagenUrl,
  inactiva,
  progreso,
  stats,
  misionesDiarias,
  misionesSemanales,
  minimoStatSiguiente,
}: MascotaProps) {
  return (
    <>
      <section
        data-mascota={clave}
        className={styles.holderMascota}
      >
        <h2 className={styles.nombreMascota}>{nombre}</h2>

        <button
          type="button"
          popoverTarget="mascota-stats"
          aria-label={`Ver estadísticas de ${nombre}`}
          className={styles.triggerMascota}
        >
          {inactiva ? (
            <span
              role="img"
              aria-label={`Tumba de ${nombre}`}
              className={styles.tumbaHolder}
            >
              Tumba
            </span>
          ) : imagenUrl ? (
            <span className={`${styles.wiggle} ${styles.marcoImagenMascota}`}>
              <Image
                src={imagenUrl}
                alt={`${nombre}, tu mascota virtual`}
                fill
                loading="eager"
                sizes="9rem"
                className={styles.imagenMascota}
              />
            </span>
          ) : (
            <span className={styles.sinImagenHolder}>
              Imagen no disponible
            </span>
          )}
        </button>

        <p className={styles.faseMascota}>
          {inactiva ? "Más de una semana sin actividad." : fase}
        </p>
      </section>

      <div
        id="mascota-stats"
        popover="auto"
        role="dialog"
        aria-labelledby="mascota-stats-title"
        className={styles.popoverCarta}
      >
        <button
          type="button"
          popoverTarget="mascota-stats"
          popoverTargetAction="hide"
          aria-label="Cerrar estadísticas"
          className={styles.cerrarPopover}
        >
          ×
        </button>

        <div className={styles.contenidoPopover}>
          <section className={styles.statsCarta}>
            <h2 id="mascota-stats-title" className={styles.tituloStats}>
              Estadísticas de {nombre}
            </h2>
            <p className={styles.descripcionStats}>
              Realizar misiones sumará puntos a estos atributos.
            </p>
            <dl className={styles.listaStats}>
              {(Object.entries(STAT_LABELS) as [Stat, string][]).map(([stat, label]) => {
                const puntos = stats[stat];
                const requisito = Math.max(minimoStatSiguiente, 1);
                const porcentaje =
                  minimoStatSiguiente > 0 ? Math.min(100, (puntos / requisito) * 100) : 0;

                return (
                  <div
                    key={stat}
                    className={styles.filaStat}
                  >
                    <progress
                      aria-label={`Progreso de ${label}`}
                      aria-valuetext={
                        minimoStatSiguiente > 0
                          ? `${puntos} puntos de ${requisito} requeridos`
                          : `${puntos} puntos; requisito no configurado`
                      }
                      max={100}
                      value={porcentaje}
                      className={styles.progresoStat}
                    />
                    <dt className={styles.textoStat}>{label}</dt>
                    <dd className={styles.textoStat}>{puntos}</dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <div className={styles.escenaCarta} aria-label={`Carta de ${nombre}`}>
            <div className={styles.carta}>
              <div className={`${styles.caraCarta} ${styles.traseraCarta}`}>
                <Image
                  src="/images/mascota/cartatrasera.png"
                  alt=""
                  fill
                  loading="eager"
                  sizes="18rem"
                  className={styles.fondoCarta}
                />
              </div>

              <div className={`${styles.caraCarta} ${styles.frontalCarta}`}>
                <Image
                  src="/images/mascota/cartafrontal.png"
                  alt=""
                  fill
                  loading="eager"
                  sizes="18rem"
                  className={styles.fondoCarta}
                />
                <div className={`${styles.contenidoCarta} ${blackFlag.className}`}>
                  <p className={styles.nombreCarta}>{nombre}</p>
                  {inactiva ? (
                    <span className={styles.tumbaCarta}>
                      Tumba
                    </span>
                  ) : imagenUrl ? (
                    <span className={`${styles.wiggleContinuo} ${styles.marcoImagenCarta}`}>
                      <Image
                        src={imagenUrl}
                        alt={`${nombre}, tu mascota virtual`}
                        fill
                        sizes="(max-width: 639px) 5rem, 7rem"
                        className={styles.imagenCarta}
                      />
                    </span>
                  ) : (
                    <span className={styles.sinImagenCarta}>Imagen no disponible</span>
                  )}
                  <p className={styles.faseCarta}>
                    {inactiva ? "Inactiva" : fase}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section
        aria-labelledby="metas-title"
        className={styles.metas}
      >
        <div className={styles.encabezadoMetas}>
          <div>
            <h2 id="metas-title" className={styles.tituloMetas}>
              Tareas y metas
            </h2>
            <p className={styles.descripcionMetas}>
              Completa metas para hacer evolucionar a {nombre}.
            </p>
          </div>
          <span className={styles.porcentajeMetas}>{progreso}%</span>
        </div>

        <progress
          aria-label="Progreso para la siguiente evolución"
          max={100}
          value={progreso}
          className={styles.barraEvolucion}
        />

        <div className={styles.gridMetas}>
          <div className={styles.grupoMetas}>
            <h3 className={styles.tituloGrupoMetas}>Metas diarias</h3>
            {!misionesDiarias.length ? (
              <p className={styles.estadoMetas}>Día de descanso: no tienes rutina asignada.</p>
            ) : (
              <div className={styles.listaMisiones}>
                {misionesDiarias.map((mision) => (
                  <MisionCard key={mision.id} mision={mision} registrable />
                ))}
              </div>
            )}
          </div>
          <div className={styles.grupoMetas}>
            <h3 className={styles.tituloGrupoMetas}>Metas semanales</h3>
            {!misionesSemanales.length ? (
              <p className={styles.estadoMetas}>
                Crea y programa una rutina para obtener metas.
              </p>
            ) : (
              <div className={styles.listaMisiones}>
                {misionesSemanales.map((mision) => (
                  <MisionCard key={mision.id} mision={mision} />
                ))}
              </div>
            )}
          </div>
        </div>

      </section>
    </>
  );
}
