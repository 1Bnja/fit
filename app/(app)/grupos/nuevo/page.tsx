"use client";

import { useActionState } from "react";
import { Users } from "reicon-react";
import Field from "@/components/Field";
import { crearGrupo, type FormState } from "@/app/actions/grupos";

const initialState: FormState = {};

export default function NuevoGrupoPage() {
  const [state, formAction, pending] = useActionState(crearGrupo, initialState);

  return (
    <form action={formAction} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-medium">Nuevo grupo</h1>

      <Field label="Nombre" icon={<Users size={16} />}>
        <input
          id="nombre"
          name="nombre"
          type="text"
          placeholder="Ej. Gym con los panas"
          required
          autoFocus
        />
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
