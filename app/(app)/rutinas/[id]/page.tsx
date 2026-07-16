import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RutinaEditor from "@/components/RutinaEditor";

export default async function RutinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rutina } = await supabase
    .from("rutinas")
    .select("id, nombre")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!rutina) notFound();

  const { data: ejercicios } = await supabase
    .from("rutina_ejercicios")
    .select("id, ejercicio_nombre, es_custom")
    .eq("rutina_id", id)
    .order("orden", { ascending: true });

  const { data: dias } = await supabase
    .from("rutina_dias")
    .select("dia_semana")
    .eq("rutina_id", id)
    .eq("user_id", user!.id);

  return (
    <RutinaEditor
      rutinaId={rutina.id}
      nombre={rutina.nombre}
      ejerciciosIniciales={ejercicios ?? []}
      diasIniciales={(dias ?? []).map((d) => d.dia_semana)}
    />
  );
}
