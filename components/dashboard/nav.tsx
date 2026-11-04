"use client";

import { cn } from "@/src/lib/utils";
import type { Icon } from "@phosphor-icons/react";
import { CalendarBlank, ClipboardText, Ticket, SealCheck as ClipboardCheck, ChartBar as BarChart3, IdentificationCard as IdCard, GenderMale as UserRound, UsersThree as Users, Buildings as School, FileText, PencilSimple as PencilLine, GraduationCap, SquaresFour as LayoutDashboard, Books as BookOpen, TreeStructure as Layers } from "@phosphor-icons/react/ssr";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/src/better-auth/auth-client";

// Phosphor (regular weight) everywhere: monochrome, currentColor, one distinct
// mark per destination. design.md wants quiet glyphs that let the purple carry
// the emphasis, and a weight system (light/regular/bold) instead of a second set.
import { useT } from "@/components/i18n/locale-provider";
import type { Dictionary } from "@/src/i18n/dictionaries/en";

type NavKey = keyof Dictionary["nav"]["items"];
type GroupKey = keyof Dictionary["nav"]["groups"];

type NavItem = { key: NavKey; name: string; link: string; icon: Icon };

export const navGroups: { group: string; groupKey: GroupKey; items: NavItem[] }[] = [
  {
    group: "Overview",
    groupKey: "overview",
    items: [{ key: "dashboard", name: "Dashboard", link: "/dashboard", icon: LayoutDashboard }],
  },
  {
    group: "People",
    groupKey: "people",
    items: [
      { key: "students", name: "Students", link: "/dashboard/students", icon: Users },
      { key: "teachers", name: "Teachers", link: "/dashboard/teachers", icon: UserRound },
      { key: "idCards", name: "ID cards", link: "/dashboard/id-cards", icon: IdCard },
    ],
  },
  {
    group: "Academics",
    groupKey: "academics",
    items: [
      { key: "classes", name: "Classes", link: "/dashboard/classes", icon: School },
      { key: "subjects", name: "Subjects", link: "/dashboard/subjects", icon: BookOpen },
      { key: "groups", name: "Groups", link: "/dashboard/groups", icon: Layers },
      {
        key: "teacherAssignment",
        name: "Teacher assignment",
        link: "/dashboard/teacher-assignment",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    group: "Assessment",
    groupKey: "assessment",
    items: [
      { key: "exams", name: "Exams", link: "/dashboard/exam", icon: FileText },
      {
        key: "attendance",
        name: "Attendance sheets",
        link: "/dashboard/attendance",
        icon: ClipboardText,
      },
      {
        key: "admitCards",
        name: "Admit cards",
        link: "/dashboard/admit-cards",
        icon: Ticket,
      },
      {
        key: "routine",
        name: "Exam routine",
        link: "/dashboard/exam/routine",
        icon: CalendarBlank,
      },
      {
        key: "marksEntry",
        name: "Marks entry",
        link: "/dashboard/exam/mark-input",
        icon: PencilLine,
      },
      { key: "results", name: "Results", link: "/dashboard/results", icon: BarChart3 },
    ],
  },
];

export function DashboardBrand({
  collapsed = false,
  brand = null,
}: {
  collapsed?: boolean;
  brand?: { name: string; nameBangla: string; logo: string | null } | null;
}) {
  const { data: session } = authClient.useSession();

  // the second line tells you which seat you are in — several people share one
  // institute and the role decides what the sidebar lets you open
  const t = useT();
  const role = session?.user?.role;
  const roleLabel =
    role === "admin"
      ? t.roles.admin
      : role === "teacher" || role === "user"
        ? t.roles.teacher
        : role === "superadmin"
          ? t.roles.superadmin
          : t.roles.unknown;

  return (
    <Link
      href="/dashboard"
      className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4"
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg",
          brand?.logo
            ? "border border-sidebar-border bg-white"
            : "bg-primary text-primary-foreground",
        )}
      >
        {brand?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logo}
            alt={brand.name}
            className="size-full object-contain p-0.5"
          />
        ) : (
          <GraduationCap className="size-5" />
        )}
      </div>
      {!collapsed && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span
            className="truncate text-sm font-semibold text-foreground"
            title={brand?.name ?? "Educare"}
          >
            {brand?.name ?? "Educare"}
          </span>
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
  const t = useT();

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
      {navGroups.map((section) => (
        <div key={section.group} className="mb-5">
          {!collapsed && (
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t.nav.groups[section.groupKey]}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.link;
              const label = t.nav.items[item.key] ?? item.name;
              return (
                <li key={item.link}>
                  <Link
                    href={item.link}
                    onClick={onNavigate}
                    title={collapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors",
                      "hover:bg-accent hover:text-foreground",
                      collapsed && "justify-center px-0",
                      // the active item used to be a saturated green pill whose
                      // hover turned it grey. A quiet surface plus a left rail
                      // reads as "you are here" without shouting.
                      active && "bg-accent font-semibold text-foreground",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <item.icon
                      className="size-4 shrink-0"
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
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
