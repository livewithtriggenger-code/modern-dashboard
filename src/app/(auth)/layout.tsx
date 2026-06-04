import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | NexusAI CRM",
  description: "Sign in to your NexusAI CRM workspace.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-950 border-r border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            NexusAI CRM
          </span>
        </div>

        <div className="space-y-6">
          <blockquote className="text-zinc-300 text-xl leading-relaxed font-light">
            &ldquo;The AI layer that closes deals while you sleep.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-700 flex items-center justify-center text-white text-sm font-medium">
              T
            </div>
            <div>
              <p className="text-white text-sm font-medium">Team NexusAI</p>
              <p className="text-zinc-500 text-xs">AI-Powered Sales Intelligence</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-zinc-600 text-xs">
          <span>End-to-end encrypted</span>
          <span>GDPR ready</span>
          <span>Multi-workspace</span>
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        {children}
      </div>
    </div>
  );
}
