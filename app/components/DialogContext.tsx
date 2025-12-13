// app/components/DialogContext.tsx
"use client";

import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useLoopState } from "./LoopStateContext";

export type DialogConditionContext = {
  flags: any;
  inventory: any[];
  timeMinutes: number;
  npcState?: any;
};

/**
 * IMPORTANT:
 * Do NOT store functions inside dialog node objects if those nodes are imported into Client Components,
 * because Next can complain about function serialization.
 *
 * Use conditionId instead (string), and resolve to a function via conditionRegistry.
 */
export type ConditionId = string;

export type DialogResponse = {
  label: string;
  timeCost: number;
  next?: string;

  // State mutation
  setFlags?: (prev: any) => any;

  // Optional condition
  conditionId?: ConditionId;
};

export type DialogNode = {
  id: string;
  npc: string;
  text: string;

  conditionId?: ConditionId;
  responses: DialogResponse[];
};

type DialogContextValue = {
  activeNode: DialogNode | null;
  startDialog: (nodeId: string) => void;
  chooseResponse: (response: DialogResponse) => void;
  endDialog: () => void;
};

/**
 * Registry of condition functions (client-side).
 * Add to this as you need, but keep ids stable.
 */
const conditionRegistry: Record<ConditionId, (ctx: DialogConditionContext) => boolean> = {
  // examples:
  // "has:keycard": (ctx) => ctx.inventory.includes("maintenanceKeycard"),
  // "time:before_1220": (ctx) => ctx.timeMinutes <= 12 * 60 + 20,
};

function checkCondition(conditionId: ConditionId | undefined, ctx: DialogConditionContext): boolean {
  if (!conditionId) return true;
  const fn = conditionRegistry[conditionId];
  if (!fn) {
    // Unknown condition => fail closed (safer) OR true (looser). Choose one.
    console.warn(`Dialog condition "${conditionId}" not found`);
    return false;
  }
  return fn(ctx);
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({
  children,
  nodes,
}: {
  children: ReactNode;
  nodes: Record<string, DialogNode>;
}) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const { advanceTime, setFlags, flags, inventory, timeMinutes, npcState } = useLoopState();

  const activeNode = useMemo(() => {
    if (!activeNodeId) return null;
    return nodes[activeNodeId] ?? null;
  }, [activeNodeId, nodes]);

  const startDialog = (nodeId: string) => {
    if (!nodes[nodeId]) {
      console.warn(`Dialog node "${nodeId}" not found`);
      setActiveNodeId(null);
      return;
    }
    setActiveNodeId(nodeId);
  };

  const endDialog = () => setActiveNodeId(null);

  const chooseResponse = (response: DialogResponse) => {
    const ctx: DialogConditionContext = { flags, inventory, timeMinutes, npcState };

    // if response is condition-gated, enforce it
    if (!checkCondition(response.conditionId, ctx)) return;

    advanceTime(response.timeCost);

    if (response.setFlags) {
      setFlags((prev) => response.setFlags!(prev));
    }

    if (response.next) {
      if (!nodes[response.next]) {
        console.warn(`Dialog node "${response.next}" not found`);
        setActiveNodeId(null);
        return;
      }
      setActiveNodeId(response.next);
    } else {
      setActiveNodeId(null);
    }
  };

  const value: DialogContextValue = {
    activeNode,
    startDialog,
    chooseResponse,
    endDialog,
  };

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside DialogProvider");
  return ctx;
}
