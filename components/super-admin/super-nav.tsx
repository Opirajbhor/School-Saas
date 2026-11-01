"use client";

import { cn } from "@/src/lib/utils";
import type { IconType } from "react-icons";
import { FcDepartment as Building2, FcDepartment as School, FcDocument as FileText, FcLibrary as BookOpen, FcOrgUnit as Layers, FcPlanner as CalendarRange, FcPrivacy as ShieldCheck } from "react-icons/fc";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { name: string; link: string; icon: IconType };

// Platform-wide defaults only. Every entry here writes rows with
// institute_id = NULL, which is why this section is superadmin-only.
export const superNavGroups: { group: string; items: NavItem[] }[] = [
  {
    group: "Platform",
    items: [
      {
        name: "Institutes",
        link: "/super-admin/institutes",
        icon: Building2,
      },
    ],
  },
  {
    group: "Academics",
    items: [
      {
        name: "Sessions",
        link: "/super-admin/academic-sessions",
        icon: CalendarRange,
      },
      { name: "Classes", link: "/super-admin/classes", icon: School },
      { name: "Groups", link: "/super-admin/groups", icon: Layers },
      { name: "Subjects", link: "/super-admin/subjects", icon: BookOpen },
    ],
  },
  {
    group: "Assessment",
    items: [{ name: "Exams", link: "/super-admin/exam", icon: FileText }],
  },
  {
    group: "Access",
    items: [
      {
        name: "Superadmins",
        link: "/super-admin/superadmins",
        icon: ShieldCheck,
      },
    ],
  },
];

export function SuperNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
      {superNavGroups.map((section) => (
        <div key={section.group} className="mb-5">
          {!collapsed && (
            <p className="px-3 pb-2 text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
              {section.group}
            </p>
          )}

          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              // /super-admin/subjects/assignment should keep Subjects lit
              const active =
                pathname === item.link || pathname.startsWith(`${item.link}/`);

              return (
                <li key={item.link}>
                  <Link
                    href={item.link}
                    onClick={onNavigate}
                    title={collapsed ? item.name : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors",
                      "hover:bg-accent hover:text-foreground",
                      collapsed && "justify-center px-0",
                      active && "bg-accent font-medium text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <item.icon
                      className="size-4 shrink-0"
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
