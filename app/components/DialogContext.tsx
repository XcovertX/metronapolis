// app/components/DialogContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useLoopState } from "./LoopStateContext";

export type DialogNode = {
  id: string;
  npc: string;
  text: string;
  responses: {
    label: string;
    timeCost: number;
    next?: string;
    setFlags?: (prev: any) => any;
  }[];
};

type DialogContextValue = {
  activeNode: DialogNode | null;
  startDialog: (nodeId: string) => void;
  chooseResponse: (response: DialogNode["responses"][0]) => void;
  endDialog: () => void;
};

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children, nodes }: { children: ReactNode; nodes: Record<string, DialogNode> }) {
  const [activeNode, setActiveNode] = useState<DialogNode | null>(null);
  const { advanceTime, setFlags } = useLoopState();

  const startDialog = (nodeId: string) => {
    setActiveNode(nodes[nodeId]);
  };

  const chooseResponse = (response: DialogNode["responses"][0]) => {
    advanceTime(response.timeCost);

    if (response.setFlags) {
      setFlags((prev) => response.setFlags!(prev));
    }

    if (response.next) {
      setActiveNode(nodes[response.next]);
    } else {
      setActiveNode(null);
    }
  };

  const endDialog = () => setActiveNode(null);

  return (
    <DialogContext.Provider value={{ activeNode, startDialog, chooseResponse, endDialog }}>
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside DialogProvider");
  return ctx;
}
