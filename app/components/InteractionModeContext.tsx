// app/components/InteractionModeContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type InteractionMode = null | "walk" | "examine" | "talk" | "take";

type InteractionModeCtx = {
  mode: InteractionMode;
  setMode: (m: InteractionMode) => void;
  toggle: (m: Exclude<InteractionMode, null>) => void;
  clear: () => void;

  /**
   * Helper: only run the handler if the user is currently in that mode.
   * Optionally auto-clear after success (default true).
   */
  attempt: (
    requiredMode: Exclude<InteractionMode, null>,
    handler: () => void,
    opts?: { autoClear?: boolean }
  ) => void;
};

const Ctx = createContext<InteractionModeCtx | undefined>(undefined);

export function InteractionModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<InteractionMode>(null);

  const toggle = (m: Exclude<InteractionMode, null>) => {
    setMode((prev) => (prev === m ? null : m));
  };

  const clear = () => setMode(null);

  const attempt: InteractionModeCtx["attempt"] = (requiredMode, handler, opts) => {
    if (mode !== requiredMode) return;
    handler();
    if (opts?.autoClear ?? true) setMode(null);
  };

  // Cursor feedback
  useEffect(() => {
    const body = document.body;
    const prev = body.style.cursor;
    
    if (mode === "walk") body.style.cursor = "crosshair";
    else if (mode === "examine") body.style.cursor = "zoom-in";
    else if (mode === "talk") body.style.cursor = "cell"; // placeholder “speech” vibe
    else if (mode === "take") body.style.cursor = "grab";
    else body.style.cursor = "";

    return () => {
      body.style.cursor = prev;
    };
  }, [mode]);

  const value = useMemo(
    () => ({ mode, setMode, toggle, clear, attempt }),
    [mode]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInteractionMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInteractionMode must be used inside InteractionModeProvider");
  return ctx;
}
