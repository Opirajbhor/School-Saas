"use client";

import { cn } from "@/src/lib/utils";
import { Gear as Settings } from "@phosphor-icons/react/ssr";

import Link from "next/link";
import { DashboardBrand, DashboardNav } from "./nav";

type SidebarProps = {
  collapsed?: boolean;
  /** "mobile" renders inside the sheet, which supplies its own surface. */
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function Sidebar({
  collapsed = false,
  variant = "desktop",
  onNavigate,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        // `dark` puts the rail on the dark token set even in a light theme, so
        // it always reads as the app's navigation surface
        "dark flex-col border-sidebar-border bg-sidebar text-sidebar-foreground",
        variant === "desktop"
          ? // the shell fixes the page at viewport height and scrolls the
            // content column, so the rail is pinned by layout rather than by
            // position: sticky (which was not holding)
            "hidden h-full shrink-0 border-r transition-[width] duration-200 md:flex"
          : "flex h-full w-full",
        variant === "desktop" && (collapsed ? "w-19" : "w-64"),
      )}
    >
      <DashboardBrand collapsed={collapsed} />
      <DashboardNav collapsed={collapsed} onNavigate={onNavigate} />

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
