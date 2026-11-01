"use client";

import Link from "next/link";
import { FcPrint as Printer } from "react-icons/fc";
import { IoArrowBackOutline as ArrowLeft } from "react-icons/io5";

import { Button } from "@/components/ui/button";

/**
 * Print controls for a document route. Hidden on paper, like the results
 * reports — browsers' "Save as PDF" is the download path, so no PDF service is
 * needed.
 */
export function PrintBar({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft />
            {backLabel}
          </Link>
        </Button>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <p className="hidden text-xs text-muted-foreground sm:block">
          Print, or choose “Save as PDF” as the destination
        </p>
        <Button size="sm" onClick={() => window.print()}>
          <Printer />
          Print / Save PDF
        </Button>
      </div>
    </div>
  );
}
