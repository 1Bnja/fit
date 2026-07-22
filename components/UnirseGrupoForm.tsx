"use client";

import { useActionState } from "react";
import { Link as LinkIcon } from "reicon-react";
import Field from "@/components/Field";
import { unirseAGrupo, type FormState } from "@/app/actions/grupos";

const initialState: FormState = {};

export default function UnirseGrupoForm({ codigoInicial }: { codigoInicial: string }) {
  const [state, formAction, pending] = useActionState(unirseAGrupo, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <h1 className="text-xl font-medium">Unirse a un grupo</h1>
      <p className="text-sm text-muted">Ingresa el código de invitación que te compartieron.</p>

      <Field label="Código" icon={<LinkIcon size={16} />}>
        <input
          id="codigo"
          name="codigo"
          type="text"
          placeholder="ABC123"
          defaultValue={codigoInicial}
          maxLength={6}
          className="uppercase tracking-widest"
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
        {pending ? "Uniéndote..." : "Unirse"}
      </button>
    </form>
  );
}
