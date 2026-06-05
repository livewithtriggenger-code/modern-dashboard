import * as React from "react"

export function LegacyBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#0B0F19] overflow-hidden">
      {/* Image Asset Layers */}
      
      {/* Primary background layer - brings abstract data structures */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.25] mix-blend-screen transition-opacity duration-1000"
        style={{ backgroundImage: "url('/legacy/backgrounds/primary-bg.png')" }}
      />
      
      {/* Secondary accent layer - adds floating clusters and depth */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.35] mix-blend-lighten transition-opacity duration-1000"
        style={{ backgroundImage: "url('/legacy/backgrounds/secondary-bg.png')" }}
      />
      
      {/* Decorative overlay layer - adds node network aesthetics */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.15] mix-blend-screen transition-opacity duration-1000"
        style={{ backgroundImage: "url('/legacy/backgrounds/overlay-bg.png')" }}
      />

      {/* Modern SaaS Gradient Mesh Overlay for Dark Mode */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0B0F19]/80 to-slate-950/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[150px]" />
      <div className="absolute top-[40%] left-[50%] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[100px]" />
      
      {/* Subtle frost overlay for dark readability */}
      <div className="absolute inset-0 bg-[#0B0F19]/30 backdrop-blur-[2px]" />
    </div>
  )
}
