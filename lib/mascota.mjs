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
 * @template {{ numero: number, imagen_url?: string | null, updated_at?: string | null }} T
 * @param {T[]} fases
 * @param {number | null | undefined} numeroFaseActual
 * @returns {string | null}
 */
export function obtenerImagenFaseDisponible(fases, numeroFaseActual) {
  if (numeroFaseActual == null) return null;

  const faseConImagen = fases
    .filter((fase) => fase.numero <= numeroFaseActual && fase.imagen_url)
    .sort((a, b) => b.numero - a.numero)[0];
  if (!faseConImagen?.imagen_url) return null;
  if (!/^https?:\/\//i.test(faseConImagen.imagen_url)) {
    return faseConImagen.imagen_url.startsWith("/") ? faseConImagen.imagen_url : null;
  }

  try {
    const url = new URL(faseConImagen.imagen_url);
    if (faseConImagen.updated_at) {
      url.searchParams.set("v", faseConImagen.updated_at);
    }
    return url.toString();
  } catch {
    return null;
  }
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

  const calcularPorcentaje = (valor, inicio, objetivo) => {
    if (objetivo <= inicio) return 100;
    return ((valor - inicio) * 100) / (objetivo - inicio);
  };
  const progresoXp = calcularPorcentaje(
    xp,
    faseActual.xp_requerida,
    siguiente.xp_requerida
  );
  const statsActuales = Object.values(stats);
  const progresoStats = statsActuales.length
    ? Math.min(
        ...statsActuales.map((valor) =>
          calcularPorcentaje(
            valor,
            faseActual.stat_minima_requerida ?? 0,
            siguiente.stat_minima_requerida ?? 0
          )
        )
      )
    : 100;
  const progreso = Math.round(Math.min(progresoXp, progresoStats));

  return { faseActual, siguiente, progreso: Math.max(0, Math.min(100, progreso)) };
}
