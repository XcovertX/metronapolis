// app/components/OptionsContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
} from "react";

import type { DecisionSpec } from "../game/events/decisionTypes";

export type OptionKind = "move" | "action";

export type PlayerOption = {
  id: string;
  label: string;

  /** "move" shows on the RIGHT panel, "action" shows on the LEFT panel */
  kind?: OptionKind;

  /** optional - useful later for keybinds / UI icons */
  dir?: "n" | "e" | "s" | "w" | "up" | "down";

  /**
   * ✅ New: decision payload.
   * If provided, OptionsWindow will call commitDecision(spec, outcome) and advance time.
   */
  decision?: {
    spec: DecisionSpec;
    outcomeId: string;

    /**
     * Optional override of the time cost to advance right now.
     * If omitted, commitDecision uses learned time if available, otherwise defaultTimeCost.
     */
    appliedTimeCost?: number;

    /** Optional parent pointer for tree edges */
    parentEventId?: string;

    /** Optional extra metadata for analytics/HUD */
    meta?: Record<string, any>;
  };

  /**
   * ✅ New: side effects to run AFTER the decision is committed (time advanced + logged).
   * Example: goToScene(), openExamine(), setFlags(), etc.
   */
  afterCommit?: () => void;

  /**
   * Backwards compat: if you have an option that isn't part of the decision system yet.
   * Prefer `decision + afterCommit` going forward.
   */
  onSelect?: () => void;
};

type OptionsContextValue = {
  options: PlayerOption[];
  setOptions: (opts: PlayerOption[]) => void;
  clearOptions: () => void;
};

const OptionsContext = createContext<OptionsContextValue | undefined>(undefined);

export function OptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptionsState] = useState<PlayerOption[]>([]);

  const setOptions = useCallback((opts: PlayerOption[]) => {
    setOptionsState(opts);
  }, []);

  const clearOptions = useCallback(() => {
    setOptionsState([]);
  }, []);

  return (
    <OptionsContext.Provider value={{ options, setOptions, clearOptions }}>
      {children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  const ctx = useContext(OptionsContext);
  if (!ctx) throw new Error("useOptions must be used within an OptionsProvider");
  return ctx;
}
