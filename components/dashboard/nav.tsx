"use client";

import { cn } from "@/src/lib/utils";
import {
  BarChart3,
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  PencilLine,
  School,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// One icon set (lucide only) and one distinct glyph per destination. The
// previous list mixed lucide with filled react-icons duotone glyphs, and three
// different pages shared the same icon, so the menu was unreadable at a glance.
type NavItem = { name: string; link: string; icon: LucideIcon };

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
    ],
  },
  {
    group: "Academics",
    items: [
      {
        name: "Sessions",
        link: "/dashboard/academic-sessions",
        icon: CalendarRange,
      },
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
  return (
    <Link
      href="/dashboard"
      className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="size-5" />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">Educare</span>
          <span className="text-xs text-muted-foreground">School management</span>
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
                      strokeWidth={active ? 2 : 1.75}
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
