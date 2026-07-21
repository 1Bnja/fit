import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export default function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactElement<{ className?: string }>;
}) {
  const input = isValidElement(children)
    ? cloneElement(children, {
        className: `pl-9 ${children.props.className ?? ""}`.trim(),
      })
    : (children as ReactNode);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-muted">{icon}</span>
        {input}
      </span>
    </label>
  );
}
