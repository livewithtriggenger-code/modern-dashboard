import { AppointmentsPageClient } from "@/components/appointments/AppointmentsPageClient";

export default function AppointmentsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground mt-2">
          Manage your schedule and Google Calendar meetings.
        </p>
      </div>
      <AppointmentsPageClient />
    </div>
  );
}
