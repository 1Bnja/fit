import { iniciales, colorAvatar } from "@/lib/formato";

export default function Avatar({
  nombre,
  apellido,
  avatarUrl,
  size = 36,
}: {
  nombre?: string | null;
  apellido?: string | null;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  const seed = `${nombre ?? ""}${apellido ?? ""}` || "?";

  return (
    <span
      style={{ width: size, height: size, backgroundColor: colorAvatar(seed), fontSize: size * 0.4 }}
      className="flex shrink-0 items-center justify-center rounded-full font-medium text-white"
    >
      {iniciales(nombre, apellido)}
    </span>
  );
}
