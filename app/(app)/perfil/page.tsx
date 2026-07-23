import { createClient } from "@/lib/supabase/server";
import PerfilForm from "@/components/PerfilForm";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nombre, apellido, username, peso_kg, estatura_cm, avatar_url, nivel_entrenamiento")
    .eq("id", user!.id)
    .single();

  return <PerfilForm perfil={perfil} email={user!.email ?? ""} />;
}
