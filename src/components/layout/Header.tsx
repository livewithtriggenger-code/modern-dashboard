"use client";

import { useUIStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  userEmail: string;
  userName?: string | null;
}

export function Header({ userEmail, userName }: HeaderProps) {
  const { toggleSidebar, toggleCommandPalette } = useUIStore();
  const { connectionStatus, onlineUsers } = useRealtime();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="-m-2.5 p-2.5 lg:hidden"
        onClick={toggleSidebar}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-border lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center justify-between">
        <div className="flex flex-1">
          <Button
            variant="outline"
            className="w-full max-w-md justify-start text-sm text-muted-foreground shadow-sm relative"
            onClick={toggleCommandPalette}
          >
            <Search className="mr-2 h-4 w-4" />
            Search leads, conversations...
            <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Badge variant={connectionStatus === "connected" ? "default" : "destructive"} className="hidden sm:inline-flex bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none border-none">
            {connectionStatus === "connected" ? `Live (${onlineUsers.length})` : connectionStatus}
          </Badge>
          <ThemeToggle />
          
          <NotificationCenter />

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          <UserMenu email={userEmail} name={userName} />
        </div>
      </div>
    </header>
  );
}
