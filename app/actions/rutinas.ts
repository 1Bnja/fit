"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exerciseById } from "@/lib/exercises";

export type FormState = { error?: string };

async function invalidarMisionesActuales(supabase: Awaited<ReturnType<typeof createClient>>) {
  await supabase.rpc("invalidar_misiones_actuales");
  revalidatePath("/home");
}

export async function crearRutina(_prev: FormState, formData: FormData): Promise<FormState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Ingresa un nombre para la rutina." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("rutinas")
    .insert({ user_id: user!.id, nombre })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear la rutina." };

  redirect(`/rutinas/${data.id}`);
}

export async function eliminarRutina(rutinaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("rutinas").delete().eq("id", rutinaId).eq("user_id", user!.id);
  await invalidarMisionesActuales(supabase);
  redirect("/rutinas");
}

export async function asignarDias(rutinaId: string, dias: number[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("rutina_dias").delete().eq("rutina_id", rutinaId).eq("user_id", user!.id);

  if (dias.length) {
    await supabase
      .from("rutina_dias")
      .insert(dias.map((dia_semana) => ({ rutina_id: rutinaId, user_id: user!.id, dia_semana })));
  }

  await invalidarMisionesActuales(supabase);
  revalidatePath(`/rutinas/${rutinaId}`);
}

export async function agregarEjercicios(rutinaId: string, ids: string[]) {
  // El nombre sale del catálogo, no del cliente: es el que queda congelado en la
  // fila si el ejercicio después se edita o se saca del catálogo.
  const ejercicios = ids.map(exerciseById).filter((e) => e !== undefined);
  if (!ejercicios.length) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existentes } = await supabase
    .from("rutina_ejercicios")
    .select("orden")
    .eq("rutina_id", rutinaId)
    .order("orden", { ascending: false })
    .limit(1);

  let orden = (existentes?.[0]?.orden ?? -1) + 1;

  await supabase.from("rutina_ejercicios").insert(
    ejercicios.map((e) => ({
      rutina_id: rutinaId,
      ejercicio_id: e.id,
      ejercicio_nombre: e.nombre,
      es_custom: false,
      categoria: e.categoria,
      orden: orden++,
    }))
  );

  await invalidarMisionesActuales(supabase);
  revalidatePath(`/rutinas/${rutinaId}`);
}

export async function quitarEjercicio(rutinaId: string, rutinaEjercicioId: string) {
  const supabase = await createClient();
  await supabase.from("rutina_ejercicios").delete().eq("id", rutinaEjercicioId);
  await invalidarMisionesActuales(supabase);
  revalidatePath(`/rutinas/${rutinaId}`);
}

export async function reordenarEjercicios(rutinaId: string, idsEnOrden: string[]) {
  const supabase = await createClient();
  await Promise.all(
    idsEnOrden.map((id, orden) =>
      supabase.from("rutina_ejercicios").update({ orden }).eq("id", id)
    )
  );
  revalidatePath(`/rutinas/${rutinaId}`);
}
