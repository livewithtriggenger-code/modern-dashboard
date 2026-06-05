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
  
  const baseStyles = "relative h-[42px] px-6 text-[13px] font-bold rounded-[12px] flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]"
  
  const variants = {
    primary: cn(
      "bg-gradient-to-b from-blue-500 to-indigo-600 text-white",
      "border border-indigo-500/50",
      "shadow-[0_2px_12px_rgba(79,70,229,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]",
      "hover:shadow-[0_8px_24px_-4px_rgba(79,70,229,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-0.5 hover:from-blue-400 hover:to-indigo-500",
      "active:shadow-[0_2px_4px_rgba(79,70,229,0.3)] active:translate-y-0",
      "focus-visible:ring-indigo-500"
    ),
    secondary: cn(
      "bg-slate-800/80 text-slate-200 backdrop-blur-sm",
      "border border-slate-700/60",
      "shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
      "hover:bg-slate-700 hover:text-white hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 hover:border-slate-600",
      "active:shadow-[0_2px_4px_rgba(0,0,0,0.4)] active:translate-y-0",
      "focus-visible:ring-slate-500"
    ),
    outline: cn(
      "bg-transparent text-slate-400",
      "border border-slate-700",
      "hover:bg-slate-800/50 hover:text-slate-200 hover:border-slate-600",
      "active:bg-slate-800",
      "focus-visible:ring-slate-600"
    )
  }

  return (
    <button 
      className={cn(baseStyles, variants[variant], (disabled || loading) && "opacity-50 pointer-events-none", className)}
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
