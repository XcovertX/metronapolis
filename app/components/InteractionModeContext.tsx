// app/components/InteractionModeContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useExamine } from "./ExamineContext";

export type InteractionMode = "walk" | "examine" | "talk" | "take" | null;

type InteractionModeValue = {
  mode: InteractionMode;

  /** toggle a mode on/off (click same mode again => clears) */
  toggle: (m: Exclude<InteractionMode, null>) => void;

  /** set mode directly */
  setMode: (m: InteractionMode) => void;

  /** clear to null */
  clear: () => void;

  /**
   * One-shot “arm” for examine.
   * Useful when you want “tap Eye, then click something, then auto-disable”.
   */
  armOnce: (m: Exclude<InteractionMode, null>) => void;

  /** call when an interaction was consumed */
  consume: () => void;

  /** true if current mode is one-shot armed */
  isOneShot: boolean;
};

const InteractionModeContext = createContext<InteractionModeValue | undefined>(undefined);

function cursorForMode(mode: InteractionMode): string {
  switch (mode) {
    case "examine":
      return "zoom-in";
    case "take":
      return "copy"; // placeholder; swap to custom later
    case "talk":
      return "text"; // placeholder
    case "walk":
      return ""; // default
    default:
      return "";
  }
}

export function InteractionModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<InteractionMode>(null);
  const [isOneShot, setIsOneShot] = useState(false);

  // If you want “open examine popup consumes one-shot examine”, we can listen here.
  // This keeps consumption behavior centralized.
  const { active: examineActive } = useExamine();

  const toggle = (m: Exclude<InteractionMode, null>) => {
    setIsOneShot(false);
    setMode((prev) => (prev === m ? null : m));
  };

  const clear = () => {
    setIsOneShot(false);
    setMode(null);
  };

  const armOnce = (m: Exclude<InteractionMode, null>) => {
    setIsOneShot(true);
    setMode(m);
  };

  const consume = () => {
    if (isOneShot) {
      setIsOneShot(false);
      setMode(null);
    }
  };

  // Cursor behavior
  useEffect(() => {
    const prev = document.body.style.cursor;
    const next = cursorForMode(mode);
    document.body.style.cursor = next;
    return () => {
      document.body.style.cursor = prev;
    };
  }, [mode]);

  // ✅ Auto-consume one-shot examine after popup opens
  useEffect(() => {
    if (!examineActive) return;
    if (mode === "examine") consume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examineActive]);

  const value = useMemo(
    () => ({ mode, toggle, setMode, clear, armOnce, consume, isOneShot }),
    [mode, isOneShot]
  );

  return <InteractionModeContext.Provider value={value}>{children}</InteractionModeContext.Provider>;
}

export function useInteractionMode() {
  const ctx = useContext(InteractionModeContext);
  if (!ctx) throw new Error("useInteractionMode must be used inside InteractionModeProvider");
  return ctx;
}
