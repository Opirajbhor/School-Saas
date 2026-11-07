"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { authClient } from "@/src/better-auth/auth-client";

type Brand = { name: string; nameBangla: string; logo: string | null } | null;

type DashboardShellProps = {
  children: React.ReactNode;
  brand?: Brand;
};

export function DashboardShell({ children, brand = null }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  // the desktop sidebar is hidden below md, so phones get the same nav in a
  // sheet instead of having no navigation at all
  const [mobileOpen, setMobileOpen] = useState(false);

  // The cached session cookie can only be written by the auth API — never by a
  // page render — so it is rolled over here: once on mount and again whenever
  // the tab regains focus, at most every five minutes.
  useEffect(() => {
    let last = 0;

    const refresh = () => {
      if (Date.now() - last < 5 * 60_000) return;
      last = Date.now();
      void authClient.getSession();
    };

    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  return (
    // The shell owns the viewport: the rail and the topbar stay put and only
    // the content column scrolls. Relying on position: sticky on the rail left
    // it scrolling with the page.
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} brand={brand} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="dark gap-0 bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-72"
        >
          <SheetTitle className="sr-only">Main navigation</SheetTitle>
          <Sidebar
            variant="mobile"
            brand={brand}
            onNavigate={() => setMobileOpen(false)}
          />
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
