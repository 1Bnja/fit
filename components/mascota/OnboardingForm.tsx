"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Dumbbell, Scale, Ruler } from "reicon-react";
import { completarOnboarding, type OnboardingState } from "@/app/actions/onboarding";
import Field from "@/components/Field";
import styles from "./OnboardingForm.module.css";

export type MascotaInicial = {
  clave: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string | null;
};

const initialState: OnboardingState = {};

export default function OnboardingForm({
  mascotas,
  catalogoDisponible,
}: {
  mascotas: MascotaInicial[];
  catalogoDisponible: boolean;
}) {
  const [state, formAction, pending] = useActionState(completarOnboarding, initialState);

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Dumbbell size={24} />
          </div>
        </div>

        <form
          action={formAction}
          className="flex w-full flex-col gap-5 rounded-2xl border border-border bg-surface p-6"
        >
          <div>
            <h1 className="text-lg font-medium">Completa tu perfil</h1>
            <p className="text-sm text-muted">
              Ingresa tus datos y elige la mascota que progresará contigo.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Peso (kg)" icon={<Scale size={16} />}>
              <input
                id="peso_kg"
                name="peso_kg"
                type="number"
                step="0.1"
                min="20"
                max="500"
                required
              />
            </Field>

            <Field label="Estatura (cm)" icon={<Ruler size={16} />}>
              <input
                id="estatura_cm"
                name="estatura_cm"
                type="number"
                step="0.1"
                min="50"
                max="300"
                required
              />
            </Field>
          </div>

          <fieldset className={styles.selector} disabled={pending || !catalogoDisponible}>
            <legend className={styles.leyenda}>Elige tu mascota inicial</legend>
            <p className={styles.ayuda}>
              Todas evolucionan con las mismas reglas; la diferencia es visual.
            </p>

            {catalogoDisponible ? (
              <div className={styles.opciones}>
                {mascotas.map((mascota, index) => (
                  <label key={mascota.clave} className={styles.opcion}>
                    <input
                      type="radio"
                      name="mascota_clave"
                      value={mascota.clave}
                      defaultChecked={index === 0}
                      required
                      className={styles.radio}
                    />
                    <span className={styles.tarjeta}>
                      <span className={styles.marcoImagen}>
                        {mascota.imagenUrl ? (
                          <Image
                            src={mascota.imagenUrl}
                            alt=""
                            fill
                            loading={index === 0 ? "eager" : "lazy"}
                            sizes="(max-width: 639px) 42vw, 9rem"
                            className={styles.imagen}
                          />
                        ) : (
                          <span className={styles.sinImagen}>Imagen pendiente</span>
                        )}
                      </span>
                      <span className={styles.nombre}>{mascota.nombre}</span>
                      <span className={styles.descripcion}>{mascota.descripcion}</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className={styles.errorCatalogo}>
                No se pudo cargar el catálogo de mascotas. Aplica la migración y vuelve a
                intentarlo.
              </p>
            )}
          </fieldset>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}

          <button
            type="submit"
            disabled={pending || !catalogoDisponible}
            className="mt-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Guardando..." : "Comenzar"}
          </button>
        </form>
      </div>
    </div>
  );
}
