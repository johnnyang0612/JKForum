export default function PostDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
      {/* Title area */}
      <div className="space-y-3">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="h-8 w-3/4 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>

      {/* Author card */}
      <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="h-12 w-12 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-muted" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>

      {/* Actions */}
      <div className="h-12 rounded border bg-muted" />

      {/* Replies */}
      <div className="h-6 w-32 rounded bg-muted" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
