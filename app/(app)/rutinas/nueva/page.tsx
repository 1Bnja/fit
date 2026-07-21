"use client";

import { useActionState } from "react";
import { Dumbbell } from "reicon-react";
import Field from "@/components/Field";
import { crearRutina, type FormState } from "@/app/actions/rutinas";

const initialState: FormState = {};

export default function NuevaRutinaPage() {
  const [state, formAction, pending] = useActionState(crearRutina, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <h1 className="text-xl font-medium">Nueva rutina</h1>

      <Field label="Nombre" icon={<Dumbbell size={16} />}>
        <input id="nombre" name="nombre" type="text" placeholder="Ej. Empuje" required autoFocus />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creando..." : "Crear"}
      </button>
    </form>
  );
}
