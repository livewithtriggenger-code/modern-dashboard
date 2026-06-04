"use client";
import { useSettings } from "@/hooks/use-settings";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function BusinessKnowledgeTab() {
  const { knowledgeQuery, addKnowledge, deleteKnowledge } = useSettings();
  const { data: knowledge, isLoading } = knowledgeQuery;
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");

  const handleAdd = () => {
    if (!key || !val) return;
    addKnowledge.mutate({ key, value: val }, {
      onSuccess: () => {
        setKey("");
        setVal("");
      }
    });
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Knowledge Base Entry</CardTitle>
          <CardDescription>Provide facts, FAQs, or policies that the AI should know.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Topic / Key</Label>
            <Input placeholder="e.g. Refund Policy" value={key} onChange={(e) => setKey(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea placeholder="We offer a 30-day money back guarantee..." className="min-h-[100px]" value={val} onChange={(e) => setVal(e.target.value)} />
          </div>
          <Button onClick={handleAdd} disabled={addKnowledge.isPending}>Add Entry</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Active Knowledge Base</h3>
        {knowledge?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No knowledge entries found.</p>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          knowledge?.map((k: any) => (
            <Card key={k.id}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">{k.key}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => deleteKnowledge.mutate(k.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{k.value}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
