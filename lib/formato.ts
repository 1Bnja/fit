// Dark-surface-validated categorical steps (see dataviz palette), plus the
// app's own accent as the first slot.
const PALETTE = ["#6c5ce7", "#3987e5", "#199e70", "#c98500", "#9085e9", "#e66767", "#d55181", "#d95926"];

export function iniciales(nombre?: string | null, apellido?: string | null) {
  const a = nombre?.trim()?.[0] ?? "";
  const b = apellido?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function colorAvatar(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function tiempoRelativo(fecha: Date) {
  const min = Math.floor((Date.now() - fecha.getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias}d`;
  return fecha.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" });
}
