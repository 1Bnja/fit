"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h1 className="text-lg font-medium">Iniciar sesión</h1>

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
        <input id="password" name="password" type="password" required />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-accent">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
