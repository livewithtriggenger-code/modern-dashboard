"use client";

import { useState } from "react";
import { ThreadList } from "./ThreadList";
import { ActiveChatPane } from "./ActiveChatPane";
import { AIContextPanel } from "./AIContextPanel";

export function ConversationsPageClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedThread, setSelectedThread] = useState<any>(null);

  return (
    <div className="flex flex-1 overflow-hidden border-t">
      {/* Thread List Sidebar */}
      <div className="w-80 flex-shrink-0 border-r bg-background flex flex-col">
        <ThreadList 
          selectedThreadId={selectedThread?.id} 
          onSelectThread={setSelectedThread} 
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
        {selectedThread ? (
          <ActiveChatPane thread={selectedThread} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      {/* AI Context Panel */}
      <div className="w-80 flex-shrink-0 border-l bg-background hidden lg:flex flex-col">
        {selectedThread ? (
          <AIContextPanel lead={selectedThread.leads} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
            Context panel will appear when a conversation is selected
          </div>
        )}
      </div>
    </div>
  );
}
