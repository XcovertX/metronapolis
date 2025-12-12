// app/components/DialogContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useLoopState } from "./LoopStateContext";

export type DialogConditionContext = {
  flags: any;
  inventory: any[];
  timeMinutes: number;
};

export type DialogResponse = {
  label: string;
  timeCost: number;
  next?: string;
  setFlags?: (prev: any) => any;
  condition?: (ctx: DialogConditionContext) => boolean;
};

export type DialogNode = {
  id: string;
  npc: string;
  text: string;
  condition?: (ctx: DialogConditionContext) => boolean;
  responses: DialogResponse[];
};

type DialogContextValue = {
  activeNode: DialogNode | null;
  startDialog: (nodeId: string) => void;
  chooseResponse: (response: DialogResponse) => void;
  endDialog: () => void;
};

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

function checkCondition(
  condition: ((ctx: DialogConditionContext) => boolean) | undefined,
  ctx: DialogConditionContext
): boolean {
  if (!condition) return true;
  return condition(ctx);
}

export function DialogProvider({
  children,
  nodes,
}: {
  children: ReactNode;
  nodes: Record<string, DialogNode>;
}) {
  const [activeNode, setActiveNode] = useState<DialogNode | null>(null);

  const { advanceTime, setFlags, flags, inventory, timeMinutes } = useLoopState();

  const dialogCtx: DialogConditionContext = {
    flags,
    inventory,
    timeMinutes,
  };

  const startDialog = (nodeId: string) => {
    const node = nodes[nodeId];

    if (!node) {
      console.warn(`Dialog node "${nodeId}" not found`);
      return;
    }

    // If the node has a condition and it fails, don't start the dialog
    if (!checkCondition(node.condition, dialogCtx)) {
      console.warn(`Dialog node "${nodeId}" blocked by condition`);
      return;
    }

    setActiveNode(node);
  };

  const chooseResponse = (response: DialogResponse) => {
    // Extra safety: if response condition fails, ignore click
    if (!checkCondition(response.condition, dialogCtx)) {
      console.warn("Dialog response blocked by condition");
      return;
    }

    advanceTime(response.timeCost);

    if (response.setFlags) {
      setFlags((prev: any) => response.setFlags!(prev));
    }

    if (response.next) {
      const nextNode = nodes[response.next];

      if (!nextNode) {
        console.warn(`Dialog node "${response.next}" not found`);
        setActiveNode(null);
        return;
      }

      // Check next node's condition too
      if (!checkCondition(nextNode.condition, dialogCtx)) {
        console.warn(`Dialog node "${response.next}" blocked by condition`);
        setActiveNode(null);
        return;
      }

      setActiveNode(nextNode);
    } else {
      setActiveNode(null);
    }
  };

  const endDialog = () => setActiveNode(null);

  return (
    <DialogContext.Provider
      value={{ activeNode, startDialog, chooseResponse, endDialog }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside DialogProvider");
  return ctx;
}
