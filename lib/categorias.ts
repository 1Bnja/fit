export const CATEGORIAS = ["pecho", "espalda", "brazos", "piernas", "abdomen"] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  brazos: "Brazos",
  piernas: "Piernas",
  abdomen: "Abdomen",
};
