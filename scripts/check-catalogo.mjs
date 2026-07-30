// Valida data/exercises.json. Corre en CI porque el catálogo se edita a mano y
// un músculo mal escrito no rompe nada visible: el ejercicio simplemente
// desaparece de su desplegable y de los rankeds, en silencio.
//
// Uso: npm run check:catalogo

import { readFileSync } from "node:fs";

// Espejo de MUSCULOS en lib/categorias.ts, que es la fuente de verdad. Este
// archivo es .mjs y no puede importar el .ts; si agregas un músculo allá,
// agrégalo acá (la lista cambia casi nunca).
const MUSCULOS = new Set([
  "pecho",
  "espalda",
  "hombros",
  "biceps",
  "triceps",
  "cuadriceps",
  "isquios",
  "gemelos",
  "core",
]);

const catalogo = JSON.parse(readFileSync(new URL("../data/exercises.json", import.meta.url)));
const errores = [];
const ids = new Set();

for (const [i, e] of catalogo.entries()) {
  const donde = e.id ?? `#${i}`;

  for (const campo of ["id", "nombre", "en", "musculo"]) {
    if (typeof e[campo] !== "string" || !e[campo]) errores.push(`${donde}: falta "${campo}"`);
  }
  if (ids.has(e.id)) errores.push(`${donde}: id duplicado`);
  ids.add(e.id);

  if (!MUSCULOS.has(e.musculo)) errores.push(`${donde}: músculo inválido "${e.musculo}"`);

  if (!Array.isArray(e.secundarios)) {
    errores.push(`${donde}: "secundarios" debe ser un array`);
    continue;
  }
  for (const m of e.secundarios) {
    if (!MUSCULOS.has(m)) errores.push(`${donde}: secundario inválido "${m}"`);
    if (m === e.musculo) errores.push(`${donde}: "${m}" está como principal y secundario`);
  }
  if (new Set(e.secundarios).size !== e.secundarios.length) {
    errores.push(`${donde}: secundarios repetidos`);
  }
}

if (errores.length) {
  console.error(`catálogo inválido (${errores.length}):`);
  for (const e of errores) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`catálogo ok: ${catalogo.length} ejercicios, ${new Set(catalogo.map((e) => e.musculo)).size} músculos`);
