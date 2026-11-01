"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  // the desktop sidebar is hidden below md, so phones get the same nav in a
  // sheet instead of having no navigation at all
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // The shell owns the viewport: the rail and the topbar stay put and only
    // the content column scrolls. Relying on position: sticky on the rail left
    // it scrolling with the page.
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="dark gap-0 bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-72"
        >
          <SheetTitle className="sr-only">Main navigation</SheetTitle>
          <Sidebar variant="mobile" onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
