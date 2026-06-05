import { LegacySidebar } from "@/legacy/components/layout/LegacySidebar";
import { LegacyHeader } from "@/legacy/components/layout/LegacyHeader";
import { LegacyBackground } from "@/legacy/components/layout/LegacyBackground";

export default function LegacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent font-sans">
      <LegacyBackground />
      <LegacySidebar />
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <LegacyHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
