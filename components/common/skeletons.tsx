import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return (
    <div className={cn("bg-muted animate-pulse rounded-full", className)} />
  );
}

export function SkeletonHeader() {
  return (
    <div className="mb-8">
      <Bar className="h-3.5 w-28" />
      <Bar className="mt-4 h-8 w-64 max-w-full rounded-tight" />
      <Bar className="mt-3 h-4 w-80 max-w-full" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-hairline rounded-feature bg-surface border p-6 sm:p-8",
        className,
      )}
    >
      <Bar className="h-3 w-32" />
      <Bar className="mt-4 h-7 w-56 max-w-full rounded-tight" />
      <Bar className="mt-3 h-4 w-72 max-w-full" />
      <Bar className="mt-7 h-1.5 w-full" />
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 py-4">
          <div className="min-w-0 flex-1">
            <Bar className="h-4 w-44 max-w-full" />
            <Bar className="mt-2 h-3 w-28" />
          </div>
          <Bar className="h-4 w-10" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTiles({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="border-hairline rounded-panel bg-surface border px-4 py-3.5"
        >
          <Bar className="h-3 w-16" />
          <Bar className="mt-3 h-6 w-12 rounded-tight" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProse({ lines = 6 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <Bar
          key={index}
          className="h-4"
          // Ragged right edge reads as text rather than a loading block.
        />
      ))}
    </div>
  );
}
