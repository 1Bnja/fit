import raw from "@/data/exercises.json";
import type { Categoria } from "@/lib/categorias";

export interface Exercise {
  id: string;
  nombre: string;
  categoria: Categoria;
}

const exercises = raw as Exercise[];

export function getExercises(): Exercise[] {
  return exercises;
}

export function exercisesByCategoria(categoria: Categoria): Exercise[] {
  return exercises.filter((e) => e.categoria === categoria);
}
