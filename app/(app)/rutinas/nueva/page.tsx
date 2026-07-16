"use client";

import { useActionState } from "react";
import { crearRutina, type FormState } from "@/app/actions/rutinas";

const initialState: FormState = {};

export default function NuevaRutinaPage() {
  const [state, formAction, pending] = useActionState(crearRutina, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <h1 className="text-xl font-medium">Nueva rutina</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-sm text-muted">
          Nombre
        </label>
        <input id="nombre" name="nombre" type="text" required autoFocus />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Creando..." : "Crear"}
      </button>
    </form>
  );
}
