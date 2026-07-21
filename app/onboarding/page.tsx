"use client";

import { useActionState } from "react";
import { Dumbbell, Scale, Ruler } from "reicon-react";
import Field from "@/components/Field";
import { completarOnboarding, type OnboardingState } from "@/app/actions/onboarding";

const initialState: OnboardingState = {};

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(completarOnboarding, initialState);

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Dumbbell size={24} />
          </div>
        </div>
        <form
          action={formAction}
          className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
        >
          <div>
            <h1 className="text-lg font-medium">Completa tu perfil</h1>
            <p className="text-sm text-muted">Necesitamos tu peso y estatura para empezar.</p>
          </div>

          <Field label="Peso (kg)" icon={<Scale size={16} />}>
            <input id="peso_kg" name="peso_kg" type="number" step="0.1" min="0" required />
          </Field>

          <Field label="Estatura (cm)" icon={<Ruler size={16} />}>
            <input id="estatura_cm" name="estatura_cm" type="number" step="0.1" min="0" required />
          </Field>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Guardando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
