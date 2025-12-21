// app/components/ExamineContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useLoopState } from "./LoopStateContext";
import type { DecisionSpec } from "../game/events/decisionTypes";

export type ExaminePayload = {
  id?: string;
  title: string;
  body: string;
  image?: string;

  /**
   * ✅ Optional: log this examine as a decision + advance time via commitDecision.
   * If omitted, this is just a UI popup (no time / no decision log).
   */
  decision?: {
    spec: DecisionSpec;
    outcomeId: string;
    appliedTimeCost?: number;
    parentEventId?: string;
    meta?: Record<string, any>;
  };
};

type ExamineContextValue = {
  active: ExaminePayload | null;

  /** Backwards-compatible: open popup (and optionally log decision if payload.decision provided) */
  openExamine: (payload: ExaminePayload) => void;

  /** Convenience: open examine AND always log as a standard examine decision */
  openExamineDecision: (args: {
    decisionId: string; // globally unique: "exm_cat_basic", "exm_tv_glow"
    decisionTitle: string; // "Examine: The Cat"
    outcomeId?: string; // default "inspect"
    outcomeTitle?: string; // default "Inspect"
    defaultTimeCost: number; // usually TIME.DEFAULT_ACTION
    parentEventId?: string;
    meta?: Record<string, any>;

    // popup content
    payload: Omit<ExaminePayload, "decision">;
  }) => void;

  closeExamine: () => void;
};

const ExamineContext = createContext<ExamineContextValue | undefined>(undefined);

export function ExamineProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ExaminePayload | null>(null);

  const { commitDecision } = useLoopState();

  const openExamine = (payload: ExaminePayload) => {
    // ✅ If a decision payload is attached, commit it (logs + advances time),
    // then open the popup as the after-effect.
    if (payload.decision) {
      const { decision, ...rest } = payload;

      commitDecision({
        spec: decision.spec,
        outcomeId: decision.outcomeId,
        appliedTimeCost: decision.appliedTimeCost,
        parentEventId: decision.parentEventId,
        meta: decision.meta,
      });

      // Open popup after commit (same tick is fine)
      setActive(rest);
      return;
    }

    // ✅ Plain popup, no time/log
    setActive(payload);
  };

  const openExamineDecision: ExamineContextValue["openExamineDecision"] = (args) => {
    const outcomeId = args.outcomeId ?? "inspect";
    const outcomeTitle = args.outcomeTitle ?? "Inspect";

    const spec: DecisionSpec = {
      id: args.decisionId,
      title: args.decisionTitle,
      kind: "examine",
      outcomes: [
        { id: outcomeId, title: outcomeTitle, defaultTimeCost: args.defaultTimeCost },
        { id: "ignore", title: "Ignore", defaultTimeCost: 0 },
      ],
    };

    openExamine({
      ...args.payload,
      decision: {
        spec,
        outcomeId,
        appliedTimeCost: args.defaultTimeCost,
        parentEventId: args.parentEventId,
        meta: { kind: "examine", ...(args.meta ?? {}) },
      },
    });
  };

  const closeExamine = () => setActive(null);

  const value = useMemo(
    () => ({ active, openExamine, openExamineDecision, closeExamine }),
    [active]
  );

  return <ExamineContext.Provider value={value}>{children}</ExamineContext.Provider>;
}

export function useExamine() {
  const ctx = useContext(ExamineContext);
  if (!ctx) throw new Error("useExamine must be used within an ExamineProvider");
  return ctx;
}
