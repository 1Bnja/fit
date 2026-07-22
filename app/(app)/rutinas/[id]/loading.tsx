export default function RutinaLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-6 w-40 rounded-md bg-surface-2" />

      <div>
        <div className="mb-2 h-4 w-16 rounded-md bg-surface-2" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 w-10 rounded-full border border-border bg-surface" />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 h-4 w-24 rounded-md bg-surface-2" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-2xl border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
