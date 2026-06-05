import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface LegacyInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string
  isSecret?: boolean
  multiline?: boolean
}

export function LegacyInput({ 
  label, 
  isSecret, 
  multiline, 
  className,
  value,
  onChange,
  ...props 
}: LegacyInputProps) {
  const [show, setShow] = React.useState(false)

  const inputClasses = cn(
    "w-full text-[13px] text-slate-100 rounded-[12px] bg-slate-900/60 border border-slate-700/60",
    "px-4 py-3 font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]",
    "transition-all duration-300",
    "focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60",
    "placeholder:text-slate-500",
    isSecret && !multiline && "pr-11",
    className
  )

  const renderContent = () => {
    if (multiline) {
      const displayValue = isSecret && !show 
        ? (value ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••' : '')
        : value;

      return (
        <textarea
          className={cn(inputClasses, "resize-none h-32 leading-relaxed")}
          value={displayValue}
          onChange={(e) => {
            if (!isSecret || show) {
              onChange?.(e as any)
            }
          }}
          onFocus={() => {
            if (isSecret && !show) setShow(true)
          }}
          {...(props as any)}
        />
      )
    }

    return (
      <div className="relative">
        <input
          type={isSecret && !show ? "password" : "text"}
          className={inputClasses}
          value={value}
          onChange={onChange}
          {...(props as any)}
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded-md hover:bg-slate-800"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
          {label}
        </label>
        {isSecret && multiline && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest pr-1"
          >
            {show ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Show</>}
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  )
}
