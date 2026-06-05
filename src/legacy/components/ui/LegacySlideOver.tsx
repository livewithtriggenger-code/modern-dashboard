"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { LegacyButton } from "./LegacyButton";

interface LegacySlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
  showHeader?: boolean;
}

export function LegacySlideOver({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-md",
  showHeader = true,
}: LegacySlideOverProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm z-[100] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Slide Over Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[110] bg-[#131B2B] shadow-2xl shadow-black/50 border-l border-slate-700/50 flex flex-col transition-transform duration-300 ease-in-out w-full",
          width,
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-[#0B0F19]/50">
            <h2 className="text-[16px] font-black text-white tracking-tight">
              {title || "Details"}
            </h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-[#131B2B] hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-700/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
}
