"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const CLAVE_MASCOTA_VALIDA = /^[a-z0-9][a-z0-9_-]{0,49}$/;

export async function seleccionarMascota(formData: FormData) {
  const clave = String(formData.get("mascota_clave") ?? "").trim();

  if (!CLAVE_MASCOTA_VALIDA.test(clave)) {
    redirect("/mascotas?error=mascota-invalida");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("seleccionar_mascota", {
    p_clave: clave,
  });

  if (error) {
    redirect("/mascotas?error=no-se-pudo-seleccionar");
  }

  revalidatePath("/home");
  revalidatePath("/mascotas");
  redirect("/home");
}
