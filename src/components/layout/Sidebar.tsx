"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BrainCircuit,
  CalendarDays,
  ListTodo,
  LineChart,
  Settings,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Conversations", href: "/conversations", icon: MessageSquare },
  { name: "AI Memory", href: "/ai-memory", icon: BrainCircuit },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Analytics", href: "/analytics", icon: LineChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-background transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full lg:hidden"
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-2 px-6 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
          <span className="text-lg font-bold text-white">N</span>
        </div>
        <span className="text-xl font-semibold tracking-tight">NexusAI</span>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon
                  className={cn("h-4 w-4", isActive ? "text-violet-600 dark:text-violet-400" : "")}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
