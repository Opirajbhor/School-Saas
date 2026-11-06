"use client";

import { Button } from "@/components/ui/button";

import { List as Menu, DotsSixVertical as PanelLeft } from "@phosphor-icons/react/ssr";

import { currentSession } from "@/src/lib/utils/current-session";
import { authClient } from "@/src/better-auth/auth-client";
import DashboardProfile from "./dashboard-profile";
import { NotificationBell } from "./notification-bell";
import { Breadcrumbs } from "./breadcrumbs";
import { ModeToggle } from "../theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useT } from "@/components/i18n/locale-provider";

export function Topbar({
  onToggleSidebar,
  onOpenMobile,
}: {
  onToggleSidebar: () => void;
  onOpenMobile: () => void;
}) {
  const { data: session } = authClient.useSession();
  const t = useT();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      {/* below md the sidebar is gone, so this opens the sheet instead */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMobile}
        aria-label={t.topbar.openNav}
        className="text-muted-foreground md:hidden"
      >
        <Menu className="size-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label={t.topbar.toggleSidebar}
        className="hidden text-muted-foreground md:inline-flex"
      >
        <PanelLeft className="size-5" />
      </Button>

      <Breadcrumbs />

      <div className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" />
        {t.topbar.session}{" "}
        <span className="font-medium tabular-nums text-foreground">
          {currentSession}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <LanguageSwitcher />
        <ModeToggle />
        <NotificationBell />

        <Separator />
        <DashboardProfile user={session?.user} />
      </div>
    </header>
  );
}

function Separator() {
  return <div className="mx-1 hidden h-6 w-px bg-border lg:block" />;
}
