import * as React from "react"
import { cn } from "@/lib/utils"

export function LegacyCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "p-6 lg:p-8 rounded-[24px] bg-white/60 backdrop-blur-2xl border border-white/60",
        "shadow-[0_8px_32px_-4px_rgba(0,0,0,0.04),0_4px_12px_-2px_rgba(0,0,0,0.02)]",
        "hover:shadow-[0_16px_48px_-8px_rgba(37,99,235,0.08),0_8px_24px_-4px_rgba(37,99,235,0.04)]",
        "hover:-translate-y-0.5 transition-all duration-500 ease-out",
        "relative overflow-hidden group",
        className
      )}
      {...props}
    >
      {/* Subtle top glare effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
