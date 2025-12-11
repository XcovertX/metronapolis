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

export type InventoryItem = {
  id: string;
  name: string;
  description?: string;
};

type LoopFlags = {
  bikeStolen: boolean;
};

type LoopStateContextValue = {
  timeMinutes: number;
  scene: SceneId;
  flags: LoopFlags;
  inventory: InventoryItem[];
  advanceTime: (minutes: number) => void;
  goToScene: (scene: SceneId) => void;
  setFlags: (update: (prev: LoopFlags) => LoopFlags) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (id: string) => void;
  resetLoop: () => void;
};

const LoopStateContext = createContext<LoopStateContextValue | undefined>(
  undefined
);

const INITIAL_TIME = 12 * 60 - 5; // 11:55

const initialFlags: LoopFlags = {
  bikeStolen: false,
};

const initialInventory: InventoryItem[] = [];

export function LoopStateProvider({ children }: { children: ReactNode }) {
  const [timeMinutes, setTimeMinutes] = useState(INITIAL_TIME);
  const [scene, setScene] = useState<SceneId>("static-corner");
  const [flags, updateFlags] = useState<LoopFlags>(initialFlags);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);

  const advanceTime = (minutes: number) => {
    setTimeMinutes((prev) => prev + minutes);
  };

  const goToScene = (next: SceneId) => {
    setScene(next);
  };

  const setFlags = (update: (prev: LoopFlags) => LoopFlags) => {
    updateFlags((prev) => update(prev));
  };

  const addItem = (item: InventoryItem) => {
    setInventory((prev) => {
      // Avoid duplicates by id
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const resetLoop = () => {
    setTimeMinutes(INITIAL_TIME);
    setScene("static-corner");
    updateFlags(initialFlags);
    setInventory(initialInventory);
  };

  return (
    <LoopStateContext.Provider
      value={{
        timeMinutes,
        scene,
        flags,
        inventory,
        advanceTime,
        goToScene,
        setFlags,
        addItem,
        removeItem,
        resetLoop,
      }}
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
