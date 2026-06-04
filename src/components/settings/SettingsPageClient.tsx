"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { IntegrationSettingsTab } from "./IntegrationSettingsTab";
import { BusinessKnowledgeTab } from "./BusinessKnowledgeTab";

export function SettingsPageClient() {
  return (
    <div className="w-full">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations & API</TabsTrigger>
          <TabsTrigger value="knowledge">Business Knowledge</TabsTrigger>
        </TabsList>
        <TabsContent value="general"><GeneralSettingsTab /></TabsContent>
        <TabsContent value="integrations"><IntegrationSettingsTab /></TabsContent>
        <TabsContent value="knowledge"><BusinessKnowledgeTab /></TabsContent>
      </Tabs>
    </div>
  );
}
