"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Categoria } from "@/lib/categorias";

export type FormState = { error?: string };

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

  revalidatePath(`/rutinas/${rutinaId}`);
}

export async function agregarEjercicios(
  rutinaId: string,
  ejercicios: { id: string; nombre: string; esCustom: boolean }[]
) {
  const supabase = await createClient();

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
      es_custom: e.esCustom,
      orden: orden++,
    }))
  );

  revalidatePath(`/rutinas/${rutinaId}`);
}

export async function quitarEjercicio(rutinaId: string, rutinaEjercicioId: string) {
  const supabase = await createClient();
  await supabase.from("rutina_ejercicios").delete().eq("id", rutinaEjercicioId);
  revalidatePath(`/rutinas/${rutinaId}`);
}

export async function moverEjercicio(
  rutinaId: string,
  rutinaEjercicioId: string,
  direccion: "arriba" | "abajo"
) {
  const supabase = await createClient();
  const { data: ejercicios } = await supabase
    .from("rutina_ejercicios")
    .select("id, orden")
    .eq("rutina_id", rutinaId)
    .order("orden", { ascending: true });

  if (!ejercicios) return;

  const idx = ejercicios.findIndex((e) => e.id === rutinaEjercicioId);
  const otroIdx = direccion === "arriba" ? idx - 1 : idx + 1;
  if (idx === -1 || otroIdx < 0 || otroIdx >= ejercicios.length) return;

  const actual = ejercicios[idx];
  const otro = ejercicios[otroIdx];

  await Promise.all([
    supabase.from("rutina_ejercicios").update({ orden: otro.orden }).eq("id", actual.id),
    supabase.from("rutina_ejercicios").update({ orden: actual.orden }).eq("id", otro.id),
  ]);

  revalidatePath(`/rutinas/${rutinaId}`);
}

export async function crearEjercicioCustom(
  rutinaId: string,
  nombre: string,
  categoria: Categoria
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("ejercicios_custom")
    .insert({ user_id: user!.id, nombre, categoria })
    .select("id")
    .single();

  if (error || !data) return;

  await agregarEjercicios(rutinaId, [{ id: data.id, nombre, esCustom: true }]);
}
