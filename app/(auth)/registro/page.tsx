"use client";

import { useActionState } from "react";
import Link from "next/link";
import { User, Envelope, Lock } from "reicon-react";
import Field from "@/components/Field";
import { registro, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(registro, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h1 className="text-lg font-medium">Crear cuenta</h1>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" icon={<User size={16} />}>
          <input id="nombre" name="nombre" type="text" required />
        </Field>
        <Field label="Apellido" icon={<User size={16} />}>
          <input id="apellido" name="apellido" type="text" required />
        </Field>
      </div>

      <Field label="Nombre de usuario" icon={<User size={16} />}>
        <input id="username" name="username" type="text" required />
      </Field>

      <Field label="Correo" icon={<Envelope size={16} />}>
        <input id="email" name="email" type="email" placeholder="tu@correo.com" required />
      </Field>

      <Field label="Contraseña" icon={<Lock size={16} />}>
        <input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} />
      </Field>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.info && <p className="text-sm text-accent">{state.info}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-accent">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
