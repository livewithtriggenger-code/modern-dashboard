import { MemoryPageClient } from "@/components/memory/MemoryPageClient";

export default function MemoryPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI Memory</h1>
        <p className="text-muted-foreground mt-2">
          Audit and manage autonomous context extracted by the AI.
        </p>
      </div>
      <MemoryPageClient />
    </div>
  );
}
