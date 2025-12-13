// app/components/LoopStateContext.tsx
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { SceneId } from "../game/sceneGraph";
import { getScene } from "../game/sceneGraph";

type LoopFlags = {
  hasWokenUp: boolean;
  rheaMet?: boolean;
  rheaWarned?: boolean;
};

export type NPCState = {
  catMood: "calm" | "skittish" | "hostile";
  rheaTrust: 0 | 1 | 2 | 3;
  miloSuspicion: 0 | 1 | 2 | 3;
  vexFavor: 0 | 1 | 2 | 3;
  sablePatience: 0 | 1 | 2 | 3;
  switchSpooked: boolean;
};

type LoopState = {
  scene: SceneId;
  timeMinutes: number;
  loopCount: number;

  flags: LoopFlags;
  setFlags: React.Dispatch<React.SetStateAction<LoopFlags>>;

  npcState: NPCState;
  setNpcState: React.Dispatch<React.SetStateAction<NPCState>>;

  inventory: string[];
  addItem: (item: string) => void;
  removeItem: (item: string) => void;
  hasItem: (item: string) => boolean;

  advanceTime: (minutes: number) => void;
  goToScene: (scene: SceneId) => void;
  resetLoop: () => void;

  sceneDef: ReturnType<typeof getScene>;
};

const LoopStateContext = createContext<LoopState | undefined>(undefined);

const START_SCENE: SceneId = "apt-bedroom";

const initialFlags: LoopFlags = {
  hasWokenUp: false,
};

const initialNPCState: NPCState = {
  catMood: "calm",
  rheaTrust: 0,
  miloSuspicion: 0,
  vexFavor: 0,
  sablePatience: 2,
  switchSpooked: false,
};

export function LoopStateProvider({ children }: { children: ReactNode }) {
  const [scene, setScene] = useState<SceneId>(START_SCENE);
  const [timeMinutes, setTimeMinutes] = useState<number>(12 * 60);
  const [loopCount, setLoopCount] = useState<number>(1);

  const [flags, setFlags] = useState<LoopFlags>(initialFlags);
  const [npcState, setNpcState] = useState<NPCState>(initialNPCState);
  const [inventory, setInventory] = useState<string[]>([]);

  const sceneDef = useMemo(() => getScene(scene), [scene]);

  const advanceTime = (minutes: number) => setTimeMinutes((t) => Math.max(0, t + minutes));
  const goToScene = (next: SceneId) => setScene(next);

  const resetLoop = () => {
    setLoopCount((c) => c + 1);
    setScene(START_SCENE);
    setTimeMinutes(12 * 60);
    setFlags(initialFlags);
    setNpcState(initialNPCState);
    setInventory([]);
  };

  const addItem = (item: string) => setInventory((p) => (p.includes(item) ? p : [...p, item]));
  const removeItem = (item: string) => setInventory((p) => p.filter((x) => x !== item));
  const hasItem = (item: string) => inventory.includes(item);

  return (
    <LoopStateContext.Provider
      value={{
        scene,
        timeMinutes,
        loopCount,
        flags,
        setFlags,
        npcState,
        setNpcState,
        inventory,
        addItem,
        removeItem,
        hasItem,
        advanceTime,
        goToScene,
        resetLoop,
        sceneDef,
      }}
    >
      {children}
    </LoopStateContext.Provider>
  );
}

export function useLoopState() {
  const ctx = useContext(LoopStateContext);
  if (!ctx) throw new Error("useLoopState must be used within LoopStateProvider");
  return ctx;
}
