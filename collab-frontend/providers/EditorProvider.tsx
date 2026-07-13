"use client";

import { createContext, useContext, useState } from "react";

interface EditorContextValue {
  activeUsers: number;
  setActiveUsers: (n: number) => void;
  users: string[];
  setUsers: (u: string[]) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [activeUsers, setActiveUsers] = useState(0);
  const [users, setUsers] = useState<string[]>([]);

  return (
    <EditorContext.Provider value={{ activeUsers, setActiveUsers, users, setUsers }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside EditorProvider");
  return ctx;
}
