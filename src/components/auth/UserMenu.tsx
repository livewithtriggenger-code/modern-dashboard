"use client";

import { useTransition } from "react";
import { signOut } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface UserMenuProps {
  email: string;
  name?: string | null;
}

export function UserMenu({ email, name }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="User menu">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-violet-600 text-white text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-foreground truncate">
            {name ?? "User"}
          </p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/settings" className="flex items-center gap-2 w-full">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isPending}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
