import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "border-hairline bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        mint:
          "border-[#1aae39]/25 bg-tint-mint text-[#146c2e] dark:border-[#1aae39]/30 dark:bg-[#13301f] dark:text-[#8fe3a5]",
        peach:
          "border-[#dd5b00]/25 bg-tint-peach text-[#793400] dark:border-[#dd5b00]/30 dark:bg-[#33200f] dark:text-[#ffb079]",
        lavender:
          "border-[#5645d4]/20 bg-tint-lavender text-[#391c57] dark:border-[#7b3ff2]/30 dark:bg-[#241a44] dark:text-[#d6b6f6]",
        sky:
          "border-[#0075de]/20 bg-tint-sky text-[#0b4a80] dark:border-[#0075de]/30 dark:bg-[#0f2440] dark:text-[#9ccbf5]",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-hairline-strong text-charcoal [a]:hover:bg-muted dark:border-input dark:text-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
