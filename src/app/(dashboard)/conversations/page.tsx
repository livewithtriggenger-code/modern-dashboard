import { ConversationsPageClient } from "@/components/conversations/ConversationsPageClient";

export default function ConversationsPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col -m-4 md:-m-6 lg:-m-8">
      <ConversationsPageClient />
    </div>
  );
}
