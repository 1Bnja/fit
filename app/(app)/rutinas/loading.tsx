export default function RutinasLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 rounded-md bg-surface-2" />
        <div className="h-9 w-32 rounded-xl bg-surface-2" />
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <div className="h-9 w-9 rounded-lg bg-surface-2" />
            <div className="h-4 w-36 rounded-md bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
