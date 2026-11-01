import { cn } from "@/utils/utils"
import { IoReloadOutline as Loader2Icon } from "react-icons/io5";function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
