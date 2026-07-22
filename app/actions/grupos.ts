"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string };

const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I/L, ambiguos al leerlos

function generarCodigo() {
  return Array.from({ length: 6 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join(
    ""
  );
}

export async function crearGrupo(_prev: FormState, formData: FormData): Promise<FormState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Ingresa un nombre para el grupo." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("grupos")
    .insert({ nombre, codigo: generarCodigo(), creado_por: user!.id })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear el grupo." };

  redirect(`/grupos/${data.id}`);
}

export async function unirseAGrupo(_prev: FormState, formData: FormData): Promise<FormState> {
  const codigo = String(formData.get("codigo") ?? "").trim();
  if (!codigo) return { error: "Ingresa un código." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("unirse_a_grupo", { p_codigo: codigo });

  if (error || !data?.length) return { error: "Código inválido." };

  redirect(`/grupos/${data[0].id}`);
}

export async function salirDeGrupo(grupoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("grupo_miembros").delete().eq("grupo_id", grupoId).eq("user_id", user!.id);
  redirect("/grupos");
}
