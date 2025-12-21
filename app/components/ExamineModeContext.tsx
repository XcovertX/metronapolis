// app/components/ExamineModeContext.tsx
"use client";

import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { useInteractionMode } from "./InteractionModeContext";

type ExamineModeValue = {
  examineMode: boolean;
  toggleExamineMode: () => void;
  setExamineMode: (v: boolean) => void;

  /** optional helpers */
  armExamineOnce: () => void;
  consumeExamine: () => void;
  isOneShot: boolean;
};

const ExamineModeContext = createContext<ExamineModeValue | undefined>(undefined);

/**
 * ✅ Drop-in compat layer.
 * Internally uses InteractionModeContext as the single source of truth.
 */
export function ExamineModeProvider({ children }: { children: ReactNode }) {
  const { mode, toggle, setMode, clear, armOnce, consume, isOneShot } = useInteractionMode();

  const value = useMemo<ExamineModeValue>(() => {
    const examineMode = mode === "examine";

    return {
      examineMode,
      toggleExamineMode: () => toggle("examine"),
      setExamineMode: (v: boolean) => (v ? setMode("examine") : clear()),
      armExamineOnce: () => armOnce("examine"),
      consumeExamine: () => consume(),
      isOneShot,
    };
  }, [mode, toggle, setMode, clear, armOnce, consume, isOneShot]);

  return <ExamineModeContext.Provider value={value}>{children}</ExamineModeContext.Provider>;
}

export function useExamineMode() {
  const ctx = useContext(ExamineModeContext);
  if (!ctx) throw new Error("useExamineMode must be used inside ExamineModeProvider");
  return ctx;
}
