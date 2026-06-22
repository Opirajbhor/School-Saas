"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  Layers,
  Library,
  PencilLine,
  School,
  Settings,
} from "lucide-react";
import { RxDashboard } from "react-icons/rx";
import { PiStudentDuotone } from "react-icons/pi";
import { LuUsers } from "react-icons/lu";
import Link from "next/link";
const nav = [
  {
    group: "Overview",
    items: [{ name: "Dashboard", icon: RxDashboard }],
  },
  {
    group: "People",
    items: [
      { name: "Students", icon: PiStudentDuotone },
      { name: "Teachers", icon: LuUsers },
    ],
  },
  {
    group: "Academics",
    items: [
      { name: "Classes", icon: School },
      { name: "Sections", icon: Layers },
      { name: "Subjects", icon: Library },
      { name: "Enrollment", icon: BookOpen },
    ],
  },
  {
    group: "Assessment",
    items: [
      { name: "Exams", icon: ClipboardList },
      { name: "Marks Entry", icon: PencilLine },
      { name: "Results", icon: GraduationCap },
      { name: "Reports", icon: FileBarChart },
    ],
  },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">
              Scholarly
            </span>
            <span className="text-xs text-muted-foreground">Result System</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map((section) => (
          <div key={section.group} className="mb-5">
            {!collapsed && (
              <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {section.group}
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item.name}>
                  <Link
                    href="#"
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center",
                    )}
                  >
                    <item.icon className="size-4.5 shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="#"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            collapsed && "justify-center",
          )}
        >
          <Settings className="size-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
