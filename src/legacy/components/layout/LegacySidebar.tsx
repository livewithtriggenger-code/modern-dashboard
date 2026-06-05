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
  Settings,
  LogOut,
  Layers,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const mainNav = [
  { name: "Dashboard", href: "/legacy/dashboard", icon: LayoutDashboard, color: "text-blue-400" },
  { name: "Leads", href: "/legacy/leads", icon: Users, color: "text-purple-400" },
  { name: "Conversations", href: "/legacy/conversations", icon: MessageSquare, color: "text-amber-400" },
  { name: "Appointments", href: "/legacy/appointments", icon: Calendar, color: "text-emerald-400" },
  { name: "AI Memory", href: "/legacy/memory", icon: Brain, color: "text-indigo-400" },
  { name: "Analytics", href: "/legacy/analytics", icon: BarChart3, color: "text-pink-400" },
];

const bottomNav = [
  { name: "Settings", href: "/legacy/settings", icon: Settings, color: "text-slate-400" },
];

export function LegacySidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const NavItem = ({ item }: { item: typeof mainNav[0] }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 relative overflow-hidden group outline-none",
          isActive
            ? "bg-slate-800/70 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
        )}
      >
        {/* Active left indicator */}
        {isActive && (
          <span
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full",
              item.color.replace("text-", "bg-")
            )}
          />
        )}
        {/* Background sweep on active */}
        {isActive && (
          <span className="absolute inset-0 bg-gradient-to-r from-white/[0.04] to-transparent pointer-events-none" />
        )}
        <item.icon
          className={cn(
            "w-4 h-4 relative z-10 shrink-0 transition-colors duration-200",
            isActive ? item.color : "text-slate-500 group-hover:text-slate-400"
          )}
        />
        <span className="relative z-10 truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="flex flex-col w-64 h-full bg-[#080C15] border-r border-slate-800/60 text-slate-300 z-20">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-slate-800/60">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-3 shadow-[0_0_16px_rgba(59,130,246,0.3)] shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-black text-white text-[13px] tracking-widest uppercase">Legacy CRM</span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 tracking-wide">Business Intelligence</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col overflow-y-auto p-3 pt-4 gap-0.5">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600 px-3 mb-2">Navigation</p>
        {mainNav.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-slate-800/60 flex flex-col gap-0.5">
        {bottomNav.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-500 hover:bg-rose-500/8 hover:text-rose-400 transition-all duration-200 group outline-none"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:text-rose-400 transition-colors duration-200" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
