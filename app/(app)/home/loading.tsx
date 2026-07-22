export default function HomeLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div>
        <div className="h-6 w-40 rounded-md bg-surface-2" />
        <div className="mt-3 flex gap-3">
          <div className="h-9 w-24 rounded-xl border border-border bg-surface" />
          <div className="h-9 w-24 rounded-xl border border-border bg-surface" />
        </div>
      </div>

      <div>
        <div className="mb-2 h-4 w-28 rounded-md bg-surface-2" />
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
    </div>
  );
}
