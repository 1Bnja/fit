import OnboardingForm, {
  type MascotaInicial,
} from "@/components/mascota/OnboardingForm";
import { obtenerImagenFaseDisponible } from "@/lib/mascota.mjs";
import { createClient } from "@/lib/supabase/server";

type FaseCatalogo = {
  numero: number;
  imagen_url: string | null;
  updated_at: string | null;
};

type MascotaCatalogo = {
  clave: string;
  nombre: string;
  descripcion: string;
  mascota_fases: FaseCatalogo[] | null;
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mascotas")
    .select(`
      clave,
      nombre,
      descripcion,
      mascota_fases (
        numero,
        imagen_url,
        updated_at
      )
    `)
    .eq("disponible", true)
    .order("orden");

  const mascotas: MascotaInicial[] = ((data ?? []) as MascotaCatalogo[]).map((mascota) => ({
    clave: mascota.clave,
    nombre: mascota.nombre,
    descripcion: mascota.descripcion,
    imagenUrl: obtenerImagenFaseDisponible(mascota.mascota_fases ?? [], 1),
  }));

  return <OnboardingForm mascotas={mascotas} catalogoDisponible={!error && mascotas.length > 0} />;
}
