"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Brain,
  Clock,
  Settings,
  LogOut,
  Table
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/legacy/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/legacy/leads", icon: Users },
  { name: "Conversations", href: "/legacy/conversations", icon: MessageSquare },
  { name: "Appointments", href: "/legacy/appointments", icon: Calendar },
  { name: "AI Memory", href: "/legacy/memory", icon: Brain },
  { name: "Settings", href: "/legacy/settings", icon: Settings },
];

export function LegacySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col w-64 h-full bg-slate-900 border-r border-slate-800 text-slate-300">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-800">
        <Table className="w-6 h-6 text-violet-500 mr-2" />
        <span className="font-bold text-white text-lg tracking-tight">Legacy CRM</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-500/10 text-violet-400"
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-violet-400" : "text-slate-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
