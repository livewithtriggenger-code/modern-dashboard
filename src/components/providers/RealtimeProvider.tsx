"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "./WorkspaceProvider";
import { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeContextType {
  onlineUsers: string[];
  typingUsers: Record<string, string[]>; // threadId -> userIds or 'ai'
  setTyping: (threadId: string, isTyping: boolean) => void;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
}

const RealtimeContext = createContext<RealtimeContextType>({
  onlineUsers: [],
  typingUsers: {},
  setTyping: () => {},
  connectionStatus: "disconnected",
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { workspaceId } = useWorkspace();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "reconnecting">("disconnected");
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const supabase = createClient();
    const channel = supabase.channel(`workspace:${workspaceId}`, {
      config: {
        presence: { key: "current_user_id" }, // In a real app, use auth user ID
      },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        const { threadId, userId, isTyping } = payload.payload;
        setTypingUsers((prev) => {
          const current = prev[threadId] || [];
          if (isTyping) {
            return { ...prev, [threadId]: Array.from(new Set([...current, userId])) };
          } else {
            return { ...prev, [threadId]: current.filter(id => id !== userId) };
          }
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
          await channel.track({ status: "online" });
        } else if (status === "CLOSED") {
          setConnectionStatus("disconnected");
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("reconnecting");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [workspaceId]);

  const setTyping = (threadId: string, isTyping: boolean) => {
    if (channelRef.current && connectionStatus === "connected") {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { threadId, userId: "current_user_id", isTyping }
      });
    }
  };

  return (
    <RealtimeContext.Provider value={{ onlineUsers, typingUsers, setTyping, connectionStatus }}>
      {children}
    </RealtimeContext.Provider>
  );
}
