import * as React from "react"
import { cn } from "@/lib/utils"

export function LegacyCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "p-6 lg:p-8 rounded-[24px] bg-[#131B2B]/80 backdrop-blur-2xl border border-slate-700/50",
        "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(0,0,0,0.4)]",
        "hover:shadow-[0_16px_48px_-8px_rgba(37,99,235,0.2),0_8px_24px_-4px_rgba(37,99,235,0.1)]",
        "hover:-translate-y-0.5 transition-all duration-500 ease-out",
        "relative overflow-hidden group",
        "ring-1 ring-white/5", // Inner highlight effect for dark mode depth
        className
      )}
      {...props}
    >
      {/* Subtle top glare effect for 3D glass edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
