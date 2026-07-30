"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PerfilState = { error?: string; success?: boolean };

export async function actualizarPerfil(
  _prev: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const pesoKg = Number(formData.get("peso_kg"));
  const estaturaCm = Number(formData.get("estatura_cm"));
  const nivelEntrenamiento = String(formData.get("nivel_entrenamiento") ?? "principiante");
  const foto = formData.get("foto");

  if (!nombre || !username) return { error: "Nombre y usuario son obligatorios." };
  if (!["principiante", "intermedio", "avanzado"].includes(nivelEntrenamiento)) {
    return { error: "El nivel de entrenamiento no es válido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const update: Record<string, unknown> = {
    nombre,
    apellido,
    username,
    nivel_entrenamiento: nivelEntrenamiento,
  };
  if (pesoKg) update.peso_kg = pesoKg;
  if (estaturaCm) update.estatura_cm = estaturaCm;

  if (foto instanceof File && foto.size > 0) {
    const path = `${user!.id}/avatar`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, foto, { upsert: true, contentType: foto.type });

    if (uploadError) return { error: `No se pudo subir la foto: ${uploadError.message}` };

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    update.avatar_url = `${publicUrl}?v=${Date.now()}`;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user!.id);

  if (error) {
    if (error.code === "23505") return { error: "Ese nombre de usuario ya está en uso." };
    return { error: "No se pudo guardar. Intenta de nuevo." };
  }

  revalidatePath("/perfil");
  return { success: true };
}
