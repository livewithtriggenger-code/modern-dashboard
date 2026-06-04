import { AnalyticsDashboardClient } from "@/components/analytics/AnalyticsDashboardClient";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Monitor your CRM performance and AI engine metrics.</p>
      </div>
      <AnalyticsDashboardClient />
    </div>
  );
}
