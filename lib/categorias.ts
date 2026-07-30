// Dos niveles: la categoría es lo que se ve en el grid, el músculo es la unidad
// real de clasificación (y la que van a usar los rankeds). La categoría siempre
// se deriva del músculo, nunca se guarda por ejercicio.

export const MUSCULOS = [
  "pecho",
  "espalda",
  "hombros",
  "biceps",
  "triceps",
  "cuadriceps",
  "isquios",
  "gemelos",
  "core",
] as const;

export type Musculo = (typeof MUSCULOS)[number];

export const CATEGORIAS = ["pecho", "espalda", "brazos", "piernas", "abdomen"] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const MUSCULOS_POR_CATEGORIA: Record<Categoria, readonly Musculo[]> = {
  pecho: ["pecho"],
  espalda: ["espalda"],
  brazos: ["hombros", "biceps", "triceps"],
  piernas: ["cuadriceps", "isquios", "gemelos"],
  abdomen: ["core"],
};

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  brazos: "Brazos",
  piernas: "Piernas",
  abdomen: "Abdomen",
};

export const MUSCULO_LABEL: Record<Musculo, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  biceps: "Bíceps y Antebrazo",
  triceps: "Tríceps",
  cuadriceps: "Cuádriceps y Cadera",
  isquios: "Isquiotibiales y Glúteos",
  gemelos: "Gemelos",
  core: "Abdomen y Core",
};

const CATEGORIA_DE_MUSCULO = Object.fromEntries(
  Object.entries(MUSCULOS_POR_CATEGORIA).flatMap(([categoria, musculos]) =>
    musculos.map((musculo) => [musculo, categoria as Categoria])
  )
) as Record<Musculo, Categoria>;

export function categoriaDe(musculo: Musculo): Categoria {
  return CATEGORIA_DE_MUSCULO[musculo];
}
