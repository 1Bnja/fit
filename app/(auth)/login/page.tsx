"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Envelope, Lock } from "reicon-react";
import Field from "@/components/Field";
import { login, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h1 className="text-lg font-medium">Iniciar sesión</h1>

      <Field label="Correo" icon={<Envelope size={16} />}>
        <input id="email" name="email" type="email" placeholder="tu@correo.com" required />
      </Field>

      <Field label="Contraseña" icon={<Lock size={16} />}>
        <input id="password" name="password" type="password" placeholder="••••••••" required />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-accent">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
