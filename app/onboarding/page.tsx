"use client";

import { useActionState } from "react";
import { completarOnboarding, type OnboardingState } from "@/app/actions/onboarding";

const initialState: OnboardingState = {};

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(completarOnboarding, initialState);

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 flex flex-col gap-4"
      >
        <h1 className="text-lg font-medium">Completa tu perfil</h1>
        <p className="text-sm text-muted">Necesitamos tu peso y estatura para empezar.</p>

        <div className="flex flex-col gap-1">
          <label htmlFor="peso_kg" className="text-sm text-muted">
            Peso (kg)
          </label>
          <input id="peso_kg" name="peso_kg" type="number" step="0.1" min="0" required />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="estatura_cm" className="text-sm text-muted">
            Estatura (cm)
          </label>
          <input id="estatura_cm" name="estatura_cm" type="number" step="0.1" min="0" required />
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Continuar"}
        </button>
      </form>
    </div>
  );
}
