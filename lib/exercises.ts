import raw from "@/data/exercises.json";
import { categoriaDe, type Categoria, type Musculo } from "@/lib/categorias";

type RawExercise = {
  id: string;
  nombre: string;
  /** Nombre en inglés. Solo se usa para que el buscador encuentre "bench press". */
  en: string;
  musculo: Musculo;
  secundarios: Musculo[];
};

export type Exercise = RawExercise & {
  categoria: Categoria;
};

// La integridad del catálogo (músculos válidos, ids únicos) la valida
// scripts/check-catalogo.mjs en CI, no en runtime.
const exercises = (raw as RawExercise[]).map((exercise) => ({
  ...exercise,
  categoria: categoriaDe(exercise.musculo),
}));

export function getExercises(): Exercise[] {
  return exercises;
}

export function exercisesByCategoria(categoria: Categoria): Exercise[] {
  return exercises.filter((e) => e.categoria === categoria);
}
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
