"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FcHome as House } from "react-icons/fc";
import { IoChevronForwardOutline as ChevronRight } from "react-icons/io5";

import { navGroups } from "./nav";
import { superNavGroups } from "../super-admin/super-nav";

/** Routes that are not nav entries but still deserve a readable name. */
const EXTRA_LABELS: Record<string, string> = {
  "/dashboard/students/add-new": "Add student",
  "/dashboard/exam/mark-input": "Mark entry",
  "/dashboard/profile": "Settings",
  "/dashboard/results": "Results",
  "/super-admin/subjects/assignment": "Assignment",
  "/super-admin/exam/mark-types": "Mark types",
  "/super-admin/exam/grade-ranges": "Grade ranges",
  "/super-admin/exam/mark-config": "Mark config",
};

/** uuid-ish segments are ids, not pages */
const looksLikeId = (segment: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment) || segment.length > 24;

const prettify = (segment: string) => {
  const words = decodeURIComponent(segment).replace(/[-_]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export function Breadcrumbs() {
  const pathname = usePathname() ?? "";
  const isPlatform = pathname.startsWith("/super-admin");

  const byLink = new Map(
    [...navGroups, ...superNavGroups]
      .flatMap((group) => group.items)
      .map((item) => [item.link, item.name]),
  );

  const root = isPlatform
    ? { label: "Platform", href: "/super-admin/institutes" }
    : { label: "Dashboard", href: "/dashboard" };

  const segments = pathname.split("/").filter(Boolean);
  // drop the first segment ("dashboard" | "super-admin"), it is the root crumb
  const trail = segments.slice(1);

  const crumbs = trail.map((segment, index) => {
    const href = `/${[segments[0], ...trail.slice(0, index + 1)].join("/")}`;
    const label =
      EXTRA_LABELS[href] ??
      byLink.get(href) ??
      (looksLikeId(segment) ? "Details" : prettify(segment));

    return { href, label };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
      <ol className="flex items-center gap-1.5 text-xs">
        <li>
          <Link
            href={root.href}
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <House className="size-3.5" />
            <span className="sr-only sm:not-sr-only">{root.label}</span>
          </Link>
        </li>

        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />
              {last ? (
                <span
                  aria-current="page"
                  className="truncate font-medium text-foreground"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
