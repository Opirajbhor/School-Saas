"use client";

import { Button } from "@/components/ui/button";

import { Bell, Menu, PanelLeft } from "lucide-react";
import { currentSession } from "@/src/lib/utils/current-session";
import { authClient } from "@/src/better-auth/auth-client";
import DashboardProfile from "./dashboard-profile";
import { ModeToggle } from "../theme-toggle";

export function Topbar({
  onToggleSidebar,
  onOpenMobile,
}: {
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
}) {
  const { data: session } = authClient.useSession();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      {/* below md the sidebar is gone, so this opens the sheet instead */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMobile}
        aria-label="Open navigation"
        className="text-muted-foreground md:hidden"
      >
        <Menu className="size-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="hidden text-muted-foreground md:inline-flex"
      >
        <PanelLeft className="size-5" />
      </Button>

      <div className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" />
        Session{" "}
        <span className="font-medium tabular-nums text-foreground">
          {currentSession}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ModeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="text-muted-foreground"
        >
          <Bell className="size-5" />
        </Button>

        <Separator />
        <DashboardProfile user={session?.user} />
      </div>
    </header>
  );
}

function Separator() {
  return <div className="mx-1 hidden h-6 w-px bg-border lg:block" />;
}
