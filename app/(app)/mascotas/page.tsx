import Link from "next/link";
import { redirect } from "next/navigation";
import SelectorMascotas, {
  type MascotaSeleccionable,
} from "@/components/mascota/SelectorMascotas";
import { obtenerImagenFaseDisponible } from "@/lib/mascota.mjs";
import { createClient } from "@/lib/supabase/server";

type MascotaFase = {
  numero: number;
  imagen_url: string | null;
  updated_at: string | null;
};

type MascotaCatalogo = {
  clave: string;
  nombre: string;
  descripcion: string;
  mascota_fases: MascotaFase[] | null;
};

const MENSAJES_ERROR: Record<string, string> = {
  "mascota-invalida": "La mascota elegida no es válida.",
  "no-se-pudo-seleccionar":
    "No se pudo cambiar la mascota. Intenta nuevamente.",
};

export default async function MascotasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: mascotas, error: catalogoError }, { data: mascotaUsuario }] =
    await Promise.all([
      supabase
        .from("mascotas")
        .select(
          "clave, nombre, descripcion, mascota_fases(numero, imagen_url, updated_at)"
        )
        .eq("disponible", true)
        .eq("mascota_fases.numero", 1)
        .order("orden"),
      supabase
        .from("usuario_mascotas")
        .select("mascotas(clave)")
        .eq("user_id", user.id)
        .eq("seleccionada", true)
        .maybeSingle(),
    ]);

  const relacionSeleccionada = mascotaUsuario?.mascotas;
  const mascotaSeleccionada = Array.isArray(relacionSeleccionada)
    ? relacionSeleccionada[0]
    : relacionSeleccionada;
  const opciones: MascotaSeleccionable[] = (
    (mascotas ?? []) as MascotaCatalogo[]
  ).map((mascota) => ({
    clave: mascota.clave,
    nombre: mascota.nombre,
    descripcion: mascota.descripcion,
    imagenUrl: obtenerImagenFaseDisponible(mascota.mascota_fases ?? [], 1),
  }));
  const { error } = await searchParams;
  const mensajeError = catalogoError
    ? "No se pudo cargar el catálogo de mascotas."
    : error
      ? MENSAJES_ERROR[error]
      : null;

  return (
    <section aria-labelledby="titulo-mascotas">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 id="titulo-mascotas" className="text-xl font-medium">
            Elige tu mascota
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Cada mascota conserva su propio progreso. Puedes cambiarla cuando
            quieras y continuar donde la dejaste.
          </p>
        </div>
        <Link
          href="/home"
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Volver
        </Link>
      </div>

      {mensajeError ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
        >
          {mensajeError}
        </p>
      ) : null}

      <SelectorMascotas
        mascotas={opciones}
        claveSeleccionada={mascotaSeleccionada?.clave ?? null}
      />
    </section>
  );
}
