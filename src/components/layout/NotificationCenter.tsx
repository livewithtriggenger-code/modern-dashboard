"use client";

import { Bell, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications, useRealtimeNotifications } from "@/hooks/use-notifications";
import Link from "next/link";
import { useState } from "react";

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export function NotificationCenter() {
  const { query, markRead, markAllRead } = useNotifications();
  useRealtimeNotifications();
  const [open, setOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifications = query.data || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div className="relative p-2.5 cursor-pointer hover:bg-accent rounded-md flex items-center justify-center">
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => markAllRead.mutate()}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground mt-20">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {notifications.map((n: any) => (
                <div 
                  key={n.id} 
                  className={`flex flex-col gap-1 p-4 border-b transition-colors hover:bg-muted/50 ${!n.is_read ? 'bg-violet-50/50 dark:bg-violet-950/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-medium text-sm leading-none">{n.title}</h5>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {n.created_at ? timeAgo(n.created_at) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {n.link && (
                      <Link href={n.link} onClick={() => setOpen(false)} className="inline-flex items-center justify-center rounded-md text-[10px] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-6 px-2">
                        View <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    )}
                    {!n.is_read && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] px-2 ml-auto"
                        onClick={() => markRead.mutate(n.id)}
                      >
                        <Check className="w-3 h-3 mr-1" /> Mark read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
