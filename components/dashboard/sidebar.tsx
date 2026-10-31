"use client";

import { cn } from "@/src/lib/utils";
import { Settings } from "lucide-react";
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
        "flex-col border-sidebar-border bg-sidebar",
        variant === "desktop"
          ? // sticky keeps the rail in view while the content column scrolls;
            // h-screen + self-start stops it stretching to the page height,
            // which is what made it scroll away before
            "sticky top-0 hidden h-screen shrink-0 self-start border-r transition-[width] duration-200 md:flex"
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
          <Settings className="size-4 shrink-0" strokeWidth={1.75} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
