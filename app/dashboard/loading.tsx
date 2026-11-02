import { PageSkeleton } from "@/components/dashboard/page-skeleton";

// Route-level skeleton: navigation paints this immediately while the server
// resolves the page's data, instead of blocking on a blank screen.
export default function Loading() {
  return <PageSkeleton />;
}
