import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LegacyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  loading?: boolean
  loadingText?: string
}

export function LegacyButton({ 
  children, 
  variant = 'primary', 
  loading, 
  loadingText = "Loading...", 
  className,
  disabled,
  ...props 
}: LegacyButtonProps) {
  
  const baseStyles = "relative h-[42px] px-6 text-[13px] font-bold rounded-[12px] flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
  
  const variants = {
    primary: cn(
      "bg-gradient-to-b from-[#3b82f6] to-[#2563eb] text-white",
      "border border-[#1d4ed8]/50",
      "shadow-[0_2px_12px_rgba(37,99,235,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]",
      "hover:shadow-[0_8px_24px_-4px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-0.5 hover:from-[#4f8ff7] hover:to-[#2b6aed]",
      "active:shadow-[0_2px_4px_rgba(37,99,235,0.2)] active:translate-y-0",
      "focus-visible:ring-blue-500"
    ),
    secondary: cn(
      "bg-white/80 text-slate-700 backdrop-blur-sm",
      "border border-slate-200/80",
      "shadow-[0_2px_8px_rgba(0,0,0,0.02)]",
      "hover:bg-white hover:text-slate-900 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-slate-300/80",
      "active:shadow-[0_2px_4px_rgba(0,0,0,0.02)] active:translate-y-0",
      "focus-visible:ring-slate-400"
    ),
    outline: cn(
      "bg-transparent text-slate-600",
      "border border-slate-300",
      "hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400",
      "active:bg-slate-100",
      "focus-visible:ring-slate-400"
    )
  }

  return (
    <button 
      className={cn(baseStyles, variants[variant], (disabled || loading) && "opacity-60 pointer-events-none", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
      {/* Subtle shine effect on primary button */}
      {variant === 'primary' && !disabled && !loading && (
        <div className="absolute inset-0 -translate-x-full hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      )}
    </button>
  )
}
