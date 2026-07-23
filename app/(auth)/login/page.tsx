"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Envelope, Eye, EyeOff, Loader, Lock } from "reicon-react";
import { login, type AuthState } from "@/app/actions/auth";
import loginGym from "@/public/images/login-gym.jpg";
import loginLogo from "@/public/images/login-logo.png";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  return (
    <div className="relative min-h-[100dvh] flex-1 overflow-hidden bg-background text-foreground">
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

        <section className="flex flex-1 flex-col justify-center py-10">
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-semibold leading-tight">Inicia sesión</h1>
            <p className="mt-2 text-sm leading-6 text-foreground/70">
              Continúa con tus rutinas y registros.
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
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
                  className="h-12 rounded-lg border-border bg-surface/95 pl-11 pr-4 text-foreground shadow-lg shadow-black/15 transition-colors duration-200 placeholder:text-muted hover:border-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
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
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  required
                  className="h-12 rounded-lg border-border bg-surface/95 pl-11 pr-12 text-foreground shadow-lg shadow-black/15 transition-colors duration-200 placeholder:text-muted hover:border-muted focus:border-accent focus:ring-2 focus:ring-accent/25"
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

            <button
              type="submit"
              disabled={pending}
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-lg shadow-black/25 transition-[opacity,transform] duration-200 hover:opacity-90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {pending ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Ingresando
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-foreground/75">
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              className="font-medium text-foreground underline decoration-accent underline-offset-4 transition-opacity duration-200 hover:opacity-80 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Regístrate
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
