import { Skeleton } from "@/components/ui/skeleton";

/**
 * Page-shaped placeholder for a route that is still loading.
 *
 * Replaces the full-page spinner, which unmounted the title, the stat cards
 * and the filters on every fetch and then re-rendered them, so the page
 * visibly jumped. A skeleton keeps the layout stable while the data arrives.
 */
export function PageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto my-8 w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8"
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="border-b p-4">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
