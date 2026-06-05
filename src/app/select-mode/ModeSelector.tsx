"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUserMode } from "@/actions/mode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Table, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ModeSelector() {
  const [loadingMode, setLoadingMode] = useState<"legacy" | "v2" | null>(null);

  const router = useRouter();

  const handleSelectMode = async (mode: "legacy" | "v2") => {
    try {
      setLoadingMode(mode);
      const result = await setUserMode(mode);
      if (result && result.redirectTo) {
        router.push(result.redirectTo);
      }
    } catch (error) {
      console.error("Failed to set mode:", error);
      setLoadingMode(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
      {/* V2 Card */}
      <Card className={cn(
        "relative overflow-hidden border-2 transition-all duration-200 hover:shadow-xl",
        "border-violet-500/20 hover:border-violet-500/50"
      )}>
        <div className="absolute top-0 right-0 p-4">
          <Badge variant="default" className="bg-violet-600 hover:bg-violet-700">Recommended</Badge>
        </div>
        <CardHeader className="pb-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">NexusAI V2</CardTitle>
          <CardDescription className="text-base">
            The next-generation CRM with real-time AI capabilities and advanced automation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {[
              "Supabase PostgreSQL Database",
              "Real-time UI updates & sync",
              "Advanced AI follow-up sequences",
              "Integrated notification system",
              "Modern API architecture"
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="pt-4 pb-6 px-6">
          <Button 
            className="w-full bg-violet-600 hover:bg-violet-700" 
            size="lg"
            disabled={loadingMode !== null}
            onClick={() => handleSelectMode("v2")}
          >
            {loadingMode === "v2" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing V2 Workspace...</>
            ) : (
              <>Select NexusAI V2 <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Legacy Card */}
      <Card className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-xl border-slate-200"
      )}>
        <CardHeader className="pb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-4">
            <Table className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">Legacy CRM (V1)</CardTitle>
          <CardDescription className="text-base">
            Your familiar Google Sheets-powered workflows, modernized visually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {[
              "Powered by your Google Sheets",
              "Direct Telegram integration",
              "Familiar V1 routing & layout",
              "Bring your own API keys",
              "100% data isolation from V2"
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="pt-4 pb-6 px-6">
          <Button 
            variant="outline" 
            className="w-full" 
            size="lg"
            disabled={loadingMode !== null}
            onClick={() => handleSelectMode("legacy")}
          >
            {loadingMode === "legacy" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing Legacy Workspace...</>
            ) : (
              <>Continue with Legacy <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
