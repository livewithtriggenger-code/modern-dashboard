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
  Table,
  BarChart3
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/legacy/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/legacy/leads", icon: Users },
  { name: "Conversations", href: "/legacy/conversations", icon: MessageSquare },
  { name: "Appointments", href: "/legacy/appointments", icon: Calendar },
  { name: "AI Memory", href: "/legacy/memory", icon: Brain },
  { name: "Analytics", href: "/legacy/analytics", icon: BarChart3 },
  { name: "Settings", href: "/legacy/settings", icon: Settings },
];

export function LegacySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col w-64 h-full bg-[#0B0F19]/95 backdrop-blur-2xl border-r border-slate-800/60 text-slate-300 shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-20">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mr-3 shadow-[0_0_12px_rgba(79,70,229,0.4)]">
          <Table className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-white text-[15px] tracking-wide uppercase">Legacy CRM</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-300 relative overflow-hidden group",
                isActive
                  ? "bg-slate-800/50 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.2)]"
                  : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
              )}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
              )}
              <item.icon className={cn("w-4 h-4 relative z-10 transition-colors", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-400")} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/60">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all duration-300 group"
        >
          <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
