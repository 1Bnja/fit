export const MASCOTA_CLAVE = "ovejita";

const UNA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @param {string | null | undefined} ultimaActividad
 * @param {number} [ahora]
 */
export function mascotaEstaInactiva(ultimaActividad, ahora = Date.now()) {
  return Boolean(
    ultimaActividad && ahora - Date.parse(ultimaActividad) > UNA_SEMANA_MS
  );
}
