import raw from "@/data/exercises.json";
import type { Musculo } from "@/lib/categorias";

export interface Exercise {
  id: string;
  nombre: string;
  /** Nombre en inglés. Solo se usa para que el buscador encuentre "bench press". */
  en: string;
  musculo: Musculo;
  secundarios: Musculo[];
}

// La integridad del catálogo (músculos válidos, ids únicos) la valida
// scripts/check-catalogo.mjs en CI, no en runtime.
const exercises = raw as Exercise[];

const porId = new Map(exercises.map((e) => [e.id, e]));

export function exerciseById(id: string): Exercise | undefined {
  return porId.get(id);
}

export function exercisesByMusculo(musculo: Musculo): Exercise[] {
  return exercises.filter((e) => e.musculo === musculo);
}

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Busca en el nombre y en el nombre en inglés, ignorando tildes. */
export function buscar(query: string): Exercise[] {
  const q = normalizar(query.trim());
  if (!q) return [];
  return exercises.filter(
    (e) => normalizar(e.nombre).includes(q) || normalizar(e.en).includes(q)
  );
}
