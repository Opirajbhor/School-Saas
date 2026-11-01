import { ArrowClockwise as LoaderIcon } from "@phosphor-icons/react/ssr";


import { cn } from "@/utils/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export function SpinnerCustom() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-4 mx-auto">
      <Spinner />
      <h1 className="text-xl font-medium">Loading Your Data</h1>
    </div>
  );
}
