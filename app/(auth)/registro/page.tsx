"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registro, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(registro, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h1 className="text-lg font-medium">Crear cuenta</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="nombre" className="text-sm text-muted">
            Nombre
          </label>
          <input id="nombre" name="nombre" type="text" required />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="apellido" className="text-sm text-muted">
            Apellido
          </label>
          <input id="apellido" name="apellido" type="text" required />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm text-muted">
          Nombre de usuario
        </label>
        <input id="username" name="username" type="text" required />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-muted">
          Correo
        </label>
        <input id="email" name="email" type="email" required />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-muted">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required minLength={6} />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.info && <p className="text-sm text-accent">{state.info}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-accent">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
