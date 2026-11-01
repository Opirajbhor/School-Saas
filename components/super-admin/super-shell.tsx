"use client";

import { useState } from "react";
import Link from "next/link";
import { FcGraduationCap as GraduationCap } from "react-icons/fc";
import { IoMenuOutline as Menu, IoReorderTwoOutline as PanelLeft } from "react-icons/io5";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { cn } from "@/src/lib/utils";
import { SuperNav } from "./super-nav";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import SuperAdminLogout from "@/app/super-admin/(main)/SuperAdminLogout";

function SuperSidebar({
  collapsed = false,
  variant = "desktop",
  onNavigate,
}: {
  collapsed?: boolean;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={cn(
        // always the dark token set, matching the institute dashboard rail
        "dark flex-col border-sidebar-border bg-sidebar text-sidebar-foreground",
        variant === "desktop"
          ? "hidden h-full shrink-0 border-r transition-[width] duration-200 md:flex"
          : "flex h-full w-full",
        variant === "desktop" && (collapsed ? "w-19" : "w-64"),
      )}
    >
      <Link
        href="/super-admin/institutes"
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </span>
        {!collapsed && (
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">
              Educare
            </span>
            <span className="text-xs text-muted-foreground">Platform admin</span>
          </span>
        )}
      </Link>

      <SuperNav collapsed={collapsed} onNavigate={onNavigate} />

      <div className="border-t border-sidebar-border p-3">
        <div className={cn(collapsed && "flex justify-center")}>
          <SuperAdminLogout />
        </div>
      </div>
    </aside>
  );
}

/**
 * Platform-admin shell: same fixed-viewport pattern as the institute dashboard,
 * so the rail stays put and only the content column scrolls.
 */
export function SuperShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <SuperSidebar collapsed={collapsed} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="dark gap-0 bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-72"
        >
          <SheetTitle className="sr-only">Platform navigation</SheetTitle>
          <SuperSidebar variant="mobile" onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="text-muted-foreground md:hidden"
          >
            <Menu className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((value) => !value)}
            aria-label="Toggle sidebar"
            className="hidden text-muted-foreground md:inline-flex"
          >
            <PanelLeft className="size-5" />
          </Button>

          <Breadcrumbs />

          <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
            Platform defaults · shared with every institute
          </span>
          <ModeToggle />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
