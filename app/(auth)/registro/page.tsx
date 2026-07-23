"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Envelope,
  Eye,
  EyeOff,
  Loader,
  Lock,
  User,
} from "reicon-react";
import { registro, type AuthState } from "@/app/actions/auth";
import loginGym from "@/public/images/login-gym.jpg";
import loginLogo from "@/public/images/login-logo.png";

const initialState: AuthState = {};

const inputClassName =
  "h-12 rounded-lg border-border bg-surface/95 pl-11 pr-4 text-foreground shadow-lg shadow-black/15 transition-colors duration-200 placeholder:text-muted hover:border-muted focus:border-accent focus:ring-2 focus:ring-accent/25";

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(registro, initialState);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  return (
    <div className="relative min-h-[100dvh] flex-1 overflow-x-hidden bg-background text-foreground">
      <Image
        src={loginGym}
        alt=""
        fill
        sizes="100vw"
        aria-hidden="true"
        className="object-cover object-[58%_center] opacity-70 sm:object-center"
        priority
      />
      <div className="absolute inset-0 bg-background/70" aria-hidden="true" />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-8">
        <header className="flex flex-col items-center text-center">
          <span className="relative block h-20 w-20 overflow-hidden rounded-xl shadow-lg shadow-black/30">
            <Image
              src={loginLogo}
              alt="Logo de Fit"
              fill
              sizes="80px"
              className="object-cover object-center"
            />
          </span>
          <span className="mt-3 text-lg font-semibold">Fit</span>
          <p className="mt-1 text-xs text-foreground/70">Entrena. Registra. Progresa.</p>
        </header>

        <section className="flex flex-1 flex-col justify-center py-8 sm:py-10">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold leading-tight">Crea tu cuenta</h1>
            <p className="mt-2 text-sm leading-6 text-foreground/70">
              Empieza a registrar tus entrenamientos.
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Nombre</span>
                <span className="relative flex items-center">
                  <User
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 text-muted"
                  />
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    autoComplete="given-name"
                    placeholder="Nombre"
                    required
                    className={`${inputClassName} min-w-0`}
                  />
                </span>
              </label>

              <label className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Apellido</span>
                <span className="relative flex items-center">
                  <User
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 text-muted"
                  />
                  <input
                    id="apellido"
                    name="apellido"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Apellido"
                    required
                    className={`${inputClassName} min-w-0`}
                  />
                </span>
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Nombre de usuario</span>
              <span className="relative flex items-center">
                <User
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 text-muted"
                />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="tu_usuario"
                  required
                  className={inputClassName}
                />
              </span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Correo</span>
              <span className="relative flex items-center">
                <Envelope
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 text-muted"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="tu@correo.com"
                  required
                  className={inputClassName}
                />
              </span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Contraseña</span>
              <span className="relative flex items-center">
                <Lock
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 text-muted"
                />
                <input
                  id="password"
                  name="password"
                  type={mostrarPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className={`${inputClassName} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((visible) => !visible)}
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={mostrarPassword}
                  className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {state.error && (
              <p
                role="alert"
                className="rounded-lg border border-danger bg-background/90 px-4 py-3 text-sm leading-5 text-danger"
              >
                {state.error}
              </p>
            )}

            {state.info && (
              <p
                role="status"
                className="rounded-lg border border-accent bg-background/90 px-4 py-3 text-sm leading-5 text-foreground"
              >
                {state.info}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-lg shadow-black/25 transition-[opacity,transform] duration-200 hover:opacity-90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {pending ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Creando cuenta
                </>
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-foreground/75">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline decoration-accent underline-offset-4 transition-opacity duration-200 hover:opacity-80 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Inicia sesión
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
