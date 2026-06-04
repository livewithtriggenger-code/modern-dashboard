"use client";

import { updateWorkspaceSettings } from "@/actions/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, Building2, Zap, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  workspaceId: string;
  initialSettings: {
    business_name?: string | null;
    timezone?: string | null;
    telegram_connected?: boolean | null;
    calendar_connected?: boolean | null;
  } | null;
}

const STEPS = [
  { id: 1, title: "Business Info", icon: Building2 },
  { id: 2, title: "Integrations", icon: Zap },
  { id: 3, title: "Launch", icon: Rocket },
];

export function OnboardingWizard({
  workspaceId,
  initialSettings,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStepOne(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("workspaceId", workspaceId);

    startTransition(async () => {
      const result = await updateWorkspaceSettings(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setStep(2);
      }
    });
  }

  function handleFinish() {
    startTransition(async () => {
      router.push("/");
    });
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all text-sm",
                  isCompleted &&
                    "bg-violet-600 border-violet-600 text-white",
                  isActive &&
                    "border-violet-600 text-violet-500 bg-violet-600/10",
                  !isCompleted &&
                    !isActive &&
                    "border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="hidden sm:block">
                <p
                  className={cn(
                    "text-xs font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.title}
                </p>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-2",
                    isCompleted ? "bg-violet-600" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Business Info */}
      {step === 1 && (
        <form onSubmit={handleStepOne} className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div>
              <h2 className="font-medium text-foreground">Business Information</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This helps the AI personalize conversations for your business.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                name="businessName"
                defaultValue={initialSettings?.business_name ?? ""}
                placeholder="Acme Corp"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={initialSettings?.timezone ?? "America/New_York"}
                placeholder="America/New_York"
                disabled={isPending}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving…
              </span>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      )}

      {/* Step 2: Integrations */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div>
              <h2 className="font-medium text-foreground">Connect Integrations</h2>
              <p className="text-sm text-muted-foreground mt-1">
                You can configure integrations now or later in Settings.
              </p>
            </div>

            {/* Integration Tiles */}
            <div className="space-y-3">
              {[
                {
                  name: "Telegram",
                  desc: "Primary messaging channel",
                  connected: initialSettings?.telegram_connected,
                  href: "/settings",
                },
                {
                  name: "Google Calendar",
                  desc: "Appointment sync",
                  connected: initialSettings?.calendar_connected,
                  href: "/settings",
                },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {integration.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {integration.desc}
                    </p>
                  </div>
                  {integration.connected ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Configure in Settings
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Launch */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 flex items-center justify-center mx-auto">
              <Rocket className="w-8 h-8 text-violet-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-lg">
                You&apos;re all set!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your workspace is ready. Head to the dashboard to start managing
                leads with AI.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleFinish}
              disabled={isPending}
            >
              {isPending ? "Loading…" : "Go to Dashboard →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
