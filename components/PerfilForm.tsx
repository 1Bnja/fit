"use client";

import { useActionState, useState } from "react";
import { User, AtSign, Scale, Ruler, Camera } from "reicon-react";
import Field from "@/components/Field";
import Avatar from "@/components/Avatar";
import { actualizarPerfil, type PerfilState } from "@/app/actions/perfil";

type Perfil = {
  nombre: string | null;
  apellido: string | null;
  username: string | null;
  peso_kg: number | null;
  estatura_cm: number | null;
  avatar_url: string | null;
} | null;

const initialState: PerfilState = {};
const MAX_FOTO_BYTES = 10 * 1024 * 1024;

export default function PerfilForm({ perfil, email }: { perfil: Perfil; email: string }) {
  const [state, formAction, pending] = useActionState(actualizarPerfil, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [fotoError, setFotoError] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <h1 className="text-xl font-medium">Tu perfil</h1>

      <label className="relative mx-auto cursor-pointer">
        <Avatar
          nombre={perfil?.nombre}
          apellido={perfil?.apellido}
          avatarUrl={preview ?? perfil?.avatar_url}
          size={88}
        />
        <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-accent text-accent-foreground">
          <Camera size={14} />
        </span>
        <input
          type="file"
          name="foto"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(ev) => {
            const file = ev.target.files?.[0];
            if (!file) return;
            if (file.size > MAX_FOTO_BYTES) {
              setFotoError("La foto no puede pesar más de 10 MB.");
              ev.target.value = "";
              return;
            }
            setFotoError(null);
            setPreview(URL.createObjectURL(file));
          }}
        />
      </label>

      {fotoError && <p className="text-center text-sm text-danger">{fotoError}</p>}
      <p className="text-center text-sm text-muted">{email}</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" icon={<User size={16} />}>
          <input name="nombre" type="text" defaultValue={perfil?.nombre ?? ""} required />
        </Field>
        <Field label="Apellido" icon={<User size={16} />}>
          <input name="apellido" type="text" defaultValue={perfil?.apellido ?? ""} />
        </Field>
      </div>

      <Field label="Usuario" icon={<AtSign size={16} />}>
        <input name="username" type="text" defaultValue={perfil?.username ?? ""} required />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso (kg)" icon={<Scale size={16} />}>
          <input
            name="peso_kg"
            type="number"
            step="0.1"
            min="0"
            defaultValue={perfil?.peso_kg ?? ""}
          />
        </Field>
        <Field label="Estatura (cm)" icon={<Ruler size={16} />}>
          <input
            name="estatura_cm"
            type="number"
            step="0.1"
            min="0"
            defaultValue={perfil?.estatura_cm ?? ""}
          />
        </Field>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-accent">Perfil actualizado.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
