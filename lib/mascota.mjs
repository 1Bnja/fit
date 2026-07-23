/**
 * @param {string | null | undefined} ultimaActividad
 * @param {number} [ahora]
 */
export function mascotaEstaInactiva(ultimaActividad, ahora = Date.now()) {
  if (!ultimaActividad) return false;

  const limite = new Date(ahora);
  limite.setUTCDate(limite.getUTCDate() - 7);
  return Date.parse(ultimaActividad) < limite.getTime();
}

/**
 * @template {{ xp_requerida: number, stat_minima_requerida?: number }} T
 * @param {T[]} fases
 * @param {number} xp
 * @param {Record<string, number>} [stats]
 * @returns {{ faseActual: T | null, siguiente: T | null, progreso: number }}
 */
export function obtenerEvolucionMascota(fases, xp, stats = {}) {
  const ordenadas = [...fases].sort((a, b) => a.xp_requerida - b.xp_requerida);
  if (!ordenadas.length) return { faseActual: null, siguiente: null, progreso: 0 };

  const faseActual =
    ordenadas
      .filter(
        (fase) =>
          fase.xp_requerida <= xp &&
          Object.values(stats).every((valor) => valor >= (fase.stat_minima_requerida ?? 0))
      )
      .at(-1) ?? ordenadas[0];
  const siguiente = ordenadas[ordenadas.indexOf(faseActual) + 1];
  if (!siguiente) return { faseActual, siguiente: null, progreso: 100 };

  const progreso = Math.round(
    ((xp - faseActual.xp_requerida) * 100) /
      (siguiente.xp_requerida - faseActual.xp_requerida)
  );

  return { faseActual, siguiente, progreso: Math.max(0, Math.min(100, progreso)) };
}
