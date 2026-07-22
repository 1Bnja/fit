export default function GrupoLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-20 rounded-2xl border border-border bg-surface" />

      {Array.from({ length: 3 }).map((_, s) => (
        <div key={s}>
          <div className="mb-2 h-4 w-32 rounded-md bg-surface-2" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-12 rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
