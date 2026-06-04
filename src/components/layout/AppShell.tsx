"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandPalette } from "./CommandPalette";
import { useUIStore } from "@/store/ui-store";

interface AppShellProps {
  children: ReactNode;
  userEmail: string;
  userName?: string | null;
}

export function AppShell({ children, userEmail, userName }: AppShellProps) {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="h-screen w-full bg-background flex text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Header userEmail={userEmail} userName={userName} />
        <main className="flex-1 overflow-y-auto bg-muted/20 focus:outline-none p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <CommandPalette />
    </div>
  );
}
