// app/components/ExamineModeContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ExamineModeValue = {
  examineMode: boolean;
  toggleExamineMode: () => void;
  setExamineMode: (v: boolean) => void;
};

const ExamineModeContext = createContext<ExamineModeValue | undefined>(undefined);

export function ExamineModeProvider({ children }: { children: React.ReactNode }) {
  const [examineMode, setExamineMode] = useState(false);

  const toggleExamineMode = () => setExamineMode((v) => !v);

  // Cursor change (future: swap to custom eye cursor)
  useEffect(() => {
    const prev = document.body.style.cursor;
    document.body.style.cursor = examineMode ? "zoom-in" : "";
    return () => {
      document.body.style.cursor = prev;
    };
  }, [examineMode]);

  const value = useMemo(
    () => ({ examineMode, toggleExamineMode, setExamineMode }),
    [examineMode]
  );

  return <ExamineModeContext.Provider value={value}>{children}</ExamineModeContext.Provider>;
}

export function useExamineMode() {
  const ctx = useContext(ExamineModeContext);
  if (!ctx) throw new Error("useExamineMode must be used inside ExamineModeProvider");
  return ctx;
}
