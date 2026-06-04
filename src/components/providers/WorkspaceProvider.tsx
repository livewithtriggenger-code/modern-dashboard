"use client";

import { createContext, useContext, ReactNode } from "react";

interface WorkspaceContextType {
  workspaceId: string;
  role: "owner" | "admin" | "member";
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({
  children,
  workspaceId,
  role,
}: {
  children: ReactNode;
  workspaceId: string;
  role: "owner" | "admin" | "member";
}) {
  return (
    <WorkspaceContext.Provider value={{ workspaceId, role }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
