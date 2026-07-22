export default function GruposLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 rounded-md bg-surface-2" />
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-xl border border-border bg-surface" />
          <div className="h-9 w-20 rounded-xl bg-surface-2" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <div className="h-9 w-9 rounded-lg bg-surface-2" />
            <div className="h-4 w-32 rounded-md bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
