"use client";

import { cn } from "@/src/lib/utils";
import type { Icon } from "@phosphor-icons/react";
import { SealCheck as ClipboardCheck, ChartBar as BarChart3, IdentificationCard as IdCard, GenderMale as UserRound, UsersThree as Users, Buildings as School, FileText, PencilSimple as PencilLine, GraduationCap, SquaresFour as LayoutDashboard, Books as BookOpen, TreeStructure as Layers } from "@phosphor-icons/react/ssr";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/src/better-auth/auth-client";

// Phosphor (regular weight) everywhere: monochrome, currentColor, one distinct
// mark per destination. design.md wants quiet glyphs that let the purple carry
// the emphasis, and a weight system (light/regular/bold) instead of a second set.
type NavItem = { name: string; link: string; icon: Icon };

export const navGroups: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [{ name: "Dashboard", link: "/dashboard", icon: LayoutDashboard }],
  },
  {
    group: "People",
    items: [
      { name: "Students", link: "/dashboard/students", icon: Users },
      { name: "Teachers", link: "/dashboard/teachers", icon: UserRound },
      { name: "ID cards", link: "/dashboard/id-cards", icon: IdCard },
    ],
  },
  {
    group: "Academics",
    items: [
      { name: "Classes", link: "/dashboard/classes", icon: School },
      { name: "Subjects", link: "/dashboard/subjects", icon: BookOpen },
      { name: "Groups", link: "/dashboard/groups", icon: Layers },
      {
        name: "Teacher assignment",
        link: "/dashboard/teacher-assignment",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    group: "Assessment",
    items: [
      { name: "Exams", link: "/dashboard/exam", icon: FileText },
      {
        name: "Marks entry",
        link: "/dashboard/exam/mark-input",
        icon: PencilLine,
      },
      { name: "Results", link: "/dashboard/results", icon: BarChart3 },
    ],
  },
];

export function DashboardBrand({ collapsed = false }: { collapsed?: boolean }) {
  const { data: session } = authClient.useSession();

  // the second line tells you which seat you are in — several people share one
  // institute and the role decides what the sidebar lets you open
  const roleLabel =
    session?.user?.role === "admin"
      ? "Institute admin"
      : session?.user?.role === "teacher" || session?.user?.role === "user"
        ? "Teacher"
        : session?.user?.role === "superadmin"
          ? "Platform admin"
          : "School management";

  return (
    <Link
      href="/dashboard"
      className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="size-5" />
      </div>
      {!collapsed && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">Educare</span>
          <span className="truncate text-xs text-muted-foreground">
            {roleLabel}
          </span>
        </div>
      )}
    </Link>
  );
}

export function DashboardNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
      {navGroups.map((section) => (
        <div key={section.group} className="mb-5">
          {!collapsed && (
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {section.group}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.link;
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
                      // the active item used to be a saturated green pill whose
                      // hover turned it grey. A quiet surface plus a left rail
                      // reads as "you are here" without shouting.
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
