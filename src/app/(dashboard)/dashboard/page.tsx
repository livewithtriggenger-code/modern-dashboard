import { PendingFollowUpsWidget } from "@/components/dashboard/PendingFollowUpsWidget";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to NexusAI CRM. Core data layer active.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards for Phase 3 */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card text-card-foreground shadow h-32"
          />
        ))}
        <PendingFollowUpsWidget />
      </div>
    </div>
  );
}
