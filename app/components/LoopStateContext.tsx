// app/components/LoopStateContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type SceneId =
  | "apt-bedroom"
  | "apt-living"
  | "apt-kitchen"
  | "lobby"
  | "street"
  | "cafe"
  | "alley"
  | "transit"
  | "rooftop";

export type InventoryItem = {
  id: string;
  name: string;
  description?: string;
};

type LoopFlags = {
  transitUnlocked: boolean;
  rooftopUnlocked: boolean;
  hasWokenUp: boolean;
  // add more as needed later
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

// 11:55, so walking to lobby/street can line up with lunch timing
const INITIAL_TIME = 12 * 60 - 5;

const initialFlags: LoopFlags = {
  transitUnlocked: false,
  rooftopUnlocked: false,
  hasWokenUp: false,
};

const initialInventory: InventoryItem[] = [];

export function LoopStateProvider({ children }: { children: ReactNode }) {
  const [timeMinutes, setTimeMinutes] = useState(INITIAL_TIME);
  const [scene, setScene] = useState<SceneId>("apt-bedroom");
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
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const resetLoop = () => {
    setTimeMinutes(INITIAL_TIME);
    setScene("apt-bedroom");
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
