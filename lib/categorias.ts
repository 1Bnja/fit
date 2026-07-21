export const CATEGORIAS = ["pecho", "espalda", "brazos", "piernas"] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  brazos: "Brazos",
  piernas: "Piernas",
};
