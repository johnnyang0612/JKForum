export default function MainLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-48 rounded-xl bg-muted" />

      {/* Content skeleton */}
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-lg bg-muted" />
          <div className="h-60 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
