import Image from "next/image";
import { seleccionarMascota } from "@/app/actions/mascotas";
import styles from "./SelectorMascotas.module.css";

export type MascotaSeleccionable = {
  clave: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string | null;
};

type SelectorMascotasProps = {
  mascotas: MascotaSeleccionable[];
  claveSeleccionada: string | null;
};

export default function SelectorMascotas({
  mascotas,
  claveSeleccionada,
}: SelectorMascotasProps) {
  if (!mascotas.length) {
    return (
      <p className={styles.estadoVacio}>
        Todavía no hay mascotas disponibles para elegir.
      </p>
    );
  }

  return (
    <ul className={styles.lista}>
      {mascotas.map((mascota, index) => {
        const seleccionada = mascota.clave === claveSeleccionada;

        return (
          <li key={mascota.clave}>
            <article
              className={styles.tarjeta}
              data-seleccionada={seleccionada || undefined}
            >
              <div className={styles.retrato}>
                {mascota.imagenUrl ? (
                  <Image
                    src={mascota.imagenUrl}
                    alt={`${mascota.nombre} en su fase inicial`}
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 639px) 78vw, (max-width: 1023px) 42vw, 20rem"
                    className={styles.imagen}
                  />
                ) : (
                  <span className={styles.sinImagen} aria-hidden="true">
                    ?
                  </span>
                )}
              </div>

              <div className={styles.contenido}>
                <div className={styles.encabezado}>
                  <h2 className={styles.nombre}>{mascota.nombre}</h2>
                  {seleccionada ? (
                    <span className={styles.insignia}>Actual</span>
                  ) : null}
                </div>
                <p className={styles.descripcion}>
                  {mascota.descripcion || "Lista para acompañarte en tus rutinas."}
                </p>

                <form action={seleccionarMascota}>
                  <input
                    type="hidden"
                    name="mascota_clave"
                    value={mascota.clave}
                  />
                  <button
                    type="submit"
                    className={styles.boton}
                    disabled={seleccionada}
                  >
                    {seleccionada ? "Mascota seleccionada" : `Elegir a ${mascota.nombre}`}
                  </button>
                </form>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
