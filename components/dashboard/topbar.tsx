"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, PanelLeft, Search } from "lucide-react";
import { currentSession } from "@/src/lib/utils/current-session";
import { authClient } from "@/src/better-auth/auth-client";
import Image from "next/image";

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="text-muted-foreground"
      >
        <PanelLeft className="size-5" />
      </Button>

      <div className="relative hidden flex-1 sm:block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students, exams, results..."
          className="h-9 border-border bg-secondary/60 pl-9 text-sm"
        />
      </div>
      <div>
        <h2>
          Current Session -{" "}
          <span className="text-primary font-bold">{currentSession}</span>
        </h2>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative text-muted-foreground"
        >
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
        </Button>

        <Separator />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-secondary">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                <Image
                  src={user?.image || "/avatar.png"}
                  alt={user?.name || "user"}
                  height={30}
                  width={30}
                  className="rounded-full"
                />
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left leading-tight lg:block">
              <p className="text-sm font-medium text-foreground">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>School Settings</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function Separator() {
  return <div className="mx-1 hidden h-6 w-px bg-border lg:block" />;
}
