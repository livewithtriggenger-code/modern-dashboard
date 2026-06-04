"use client";

import * as React from "react";
import { useUIStore } from "@/store/ui-store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Users, Settings, LayoutDashboard, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setCommandPaletteOpen]);

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setCommandPaletteOpen(false);
      command();
    },
    [setCommandPaletteOpen]
  );

  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/leads"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Search Leads</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/ai-memory"))}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            <span>AI Memory</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Workspace Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
