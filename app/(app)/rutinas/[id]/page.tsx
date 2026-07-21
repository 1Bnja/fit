import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RutinaEditor from "@/components/RutinaEditor";
import type { Registro } from "@/components/EjercicioRow";

export default async function RutinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: rutina }, { data: ejercicios }, { data: dias }] = await Promise.all([
    supabase.from("rutinas").select("id, nombre").eq("id", id).eq("user_id", user!.id).single(),
    supabase
      .from("rutina_ejercicios")
      .select("id, ejercicio_id, ejercicio_nombre, es_custom")
      .eq("rutina_id", id)
      .order("orden", { ascending: true }),
    supabase.from("rutina_dias").select("dia_semana").eq("rutina_id", id).eq("user_id", user!.id),
  ]);

  if (!rutina) notFound();

  const ejercicioIds = [...new Set((ejercicios ?? []).map((e) => e.ejercicio_id))];

  const { data: registros } = ejercicioIds.length
    ? await supabase
        .from("registros_ejercicio")
        .select("id, ejercicio_id, peso_kg, reps, created_at")
        .eq("user_id", user!.id)
        .in("ejercicio_id", ejercicioIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const historialPorEjercicio = new Map<string, Registro[]>();
  for (const registro of registros ?? []) {
    const lista = historialPorEjercicio.get(registro.ejercicio_id) ?? [];
    lista.push(registro);
    historialPorEjercicio.set(registro.ejercicio_id, lista);
  }

  return (
    <RutinaEditor
      rutinaId={rutina.id}
      nombre={rutina.nombre}
      ejerciciosIniciales={ejercicios ?? []}
      diasIniciales={(dias ?? []).map((d) => d.dia_semana)}
      historialPorEjercicio={Object.fromEntries(historialPorEjercicio)}
    />
  );
}
