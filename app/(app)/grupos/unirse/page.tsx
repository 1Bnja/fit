import UnirseGrupoForm from "@/components/UnirseGrupoForm";

export default async function UnirseGrupoPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  return <UnirseGrupoForm codigoInicial={(codigo ?? "").toUpperCase()} />;
}
