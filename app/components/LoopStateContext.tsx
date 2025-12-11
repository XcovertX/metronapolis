// app/components/LoopStateContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type SceneId =
  | "static-corner"
  | "shop-front"
  | "boy-street"
  | "death-reset";

type LoopFlags = {
  bikeStolen: boolean;
};

type LoopStateContextValue = {
  timeMinutes: number;
  scene: SceneId;
  flags: LoopFlags;
  advanceTime: (minutes: number) => void;
  goToScene: (scene: SceneId) => void;
  setFlags: (update: (prev: LoopFlags) => LoopFlags) => void;
  resetLoop: () => void;
};

const LoopStateContext = createContext<LoopStateContextValue | undefined>(
  undefined
);

const INITIAL_TIME = 12 * 60 - 5; // 11:55, so walking to shop hits 12:00

const initialFlags: LoopFlags = {
  bikeStolen: false,
};

export function LoopStateProvider({ children }: { children: ReactNode }) {
  const [timeMinutes, setTimeMinutes] = useState(INITIAL_TIME);
  const [scene, setScene] = useState<SceneId>("static-corner");
  const [flags, updateFlags] = useState<LoopFlags>(initialFlags);

  const advanceTime = (minutes: number) => {
    setTimeMinutes((prev) => prev + minutes);
  };

  const goToScene = (next: SceneId) => {
    setScene(next);
  };

  const setFlags = (update: (prev: LoopFlags) => LoopFlags) => {
    updateFlags((prev) => update(prev));
  };

  const resetLoop = () => {
    setTimeMinutes(INITIAL_TIME);
    setScene("static-corner");
    updateFlags(initialFlags);
  };

  return (
    <LoopStateContext.Provider
      value={{ timeMinutes, scene, flags, advanceTime, goToScene, setFlags, resetLoop }}
    >
      {children}
    </LoopStateContext.Provider>
  );
}

export function useLoopState() {
  const ctx = useContext(LoopStateContext);
  if (!ctx) {
    throw new Error("useLoopState must be used within a LoopStateProvider");
  }
  return ctx;
}
