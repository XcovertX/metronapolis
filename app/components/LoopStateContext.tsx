// app/components/LoopStateContext.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getScene, type SceneId } from "../game/sceneGraph";
import { runTimeStep } from "../game/timeEngine";
import { InventoryItem } from "../game/items/types";

export type LoopFlags = {
  hasWokenUp: boolean;

  // examples used so far
  rheaMet?: boolean;
  rheaWarned?: boolean;
  catObserved?: boolean;
};

export type NPCState = {
  catMood: "calm" | "skittish" | "hostile";
  rheaTrust: 0 | 1 | 2 | 3;
  miloSuspicion: 0 | 1 | 2 | 3;
  vexFavor: 0 | 1 | 2 | 3;
  sablePatience: 0 | 1 | 2 | 3;
  switchSpooked: boolean;
};

type LoopStateValue = {
  // world position
  scene: SceneId;
  sceneDef: ReturnType<typeof getScene>;
  goToScene: (id: SceneId) => void;

  // time
  timeMinutes: number;
  advanceTime: (mins: number) => void;

  // loop
  loopCount: number;
  resetLoop: () => void;

  // state
  flags: LoopFlags;
  setFlags: React.Dispatch<React.SetStateAction<LoopFlags>>;

  npcState: NPCState;
  setNpcState: React.Dispatch<React.SetStateAction<NPCState>>;

  inventory: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  removeItem: (id: string) => void;
  hasItem: (id: string) => boolean;

  credits: number;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  canAfford: (amount: number) => boolean;

  pushMessage: (text: string) => void;

  // scene messages (ambient/delta popups)
  sceneMessages: string[];
  clearSceneMessages: () => void;
};

const LoopStateContext = createContext<LoopStateValue | undefined>(undefined);

// --- defaults ---
const START_SCENE: SceneId = "apt-bedroom";
const START_TIME_MINUTES = 12 * 60;

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
  const [timeMinutes, setTimeMinutes] = useState<number>(START_TIME_MINUTES);
  const [loopCount, setLoopCount] = useState<number>(1);

  const [flags, setFlags] = useState<LoopFlags>(initialFlags);
  const [npcState, setNpcState] = useState<NPCState>(initialNPCState);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [credits, setCredits] = useState<number>(0);

  const [sceneMessages, setSceneMessages] = useState<string[]>([]);
  const [lastEventAt, setLastEventAt] = useState<number>(() => Date.now());

  // --- refs so time engine always sees latest state ---
  const sceneRef = useRef<SceneId>(scene);
  const timeRef = useRef<number>(timeMinutes);
  const flagsRef = useRef<LoopFlags>(flags);
  const npcRef = useRef<NPCState>(npcState);
  const invRef = useRef<InventoryItem[]>(inventory);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    timeRef.current = timeMinutes;
  }, [timeMinutes]);

  useEffect(() => {
    flagsRef.current = flags;
  }, [flags]);

  useEffect(() => {
    npcRef.current = npcState;
  }, [npcState]);

  useEffect(() => {
    invRef.current = inventory;
  }, [inventory]);

  const sceneDef = useMemo(() => getScene(scene), [scene]);

  const pushMessages = useCallback((msgs: string[]) => {
    if (!msgs.length) return;
    setSceneMessages((prev) => [...prev, ...msgs].slice(-8)); // keep last few
  }, []);

  const clearSceneMessages = useCallback(() => setSceneMessages([]), []);

  /**
   * The ONLY place we should advance time.
   * This ensures delta/ambient messages are computed consistently.
   */
  const stepTime = useCallback(
    (mins: number, reason: "action" | "idle") => {
      if (!mins || mins <= 0) return;

      const prev = timeRef.current;
      const next = prev + mins;

      // update state + ref
      timeRef.current = next;
      setTimeMinutes(next);

      // run time engine (entity deltas + ambient)
      const result = runTimeStep(prev, next, {
        scene: sceneRef.current,
        flags: flagsRef.current,
        inventory: invRef.current.map((item) => item.id),
        npcState: npcRef.current,
      });

      pushMessages(result.messages);

      // If time engine declares death, reset loop after a short beat
      if (result.death) {
        // Give the message overlay a moment to show
        setTimeout(() => {
          resetLoop();
        }, 700);
        return;
      }

      // reset idle timer whenever time changes
      setLastEventAt(Date.now());
    },
    [pushMessages]
  );

  const advanceTime = useCallback(
    (mins: number) => stepTime(mins, "action"),
    [stepTime]
  );

  const goToScene = useCallback((id: SceneId) => {
    sceneRef.current = id;
    setScene(id);
  }, []);

  const addItem = (item: InventoryItem) => {
    setInventory((prev) => [...prev, item]);
  };

  const removeItem = (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const hasItem = (id: string) => {
    return inventory.some((i) => i.id === id);
  };

  const addCredits = useCallback((amount: number) => {
    setCredits((prev) => Math.max(0, prev + amount));
  }, []);

  const canAfford = useCallback((amount: number) => credits >= amount, [credits]);

  const spendCredits = useCallback((amount: number) => {
    if (amount <= 0) return true;

    let didSpend = false;
    setCredits((prev) => {
      if (prev < amount) return prev;
      didSpend = true;
      return prev - amount;
    });
    return didSpend;
  }, []);

  const pushMessage = useCallback((text: string) => {
    if (!text) return;
    pushMessages([text]);
  }, [pushMessages]);

  const resetLoop = useCallback(() => {
    setLoopCount((c) => c + 1);

    // reset core world state
    sceneRef.current = START_SCENE;
    timeRef.current = START_TIME_MINUTES;

    flagsRef.current = initialFlags;
    npcRef.current = initialNPCState;
    invRef.current = [];

    setScene(START_SCENE);
    setTimeMinutes(START_TIME_MINUTES);
    setFlags(initialFlags);
    setNpcState(initialNPCState);
    setInventory([]);

    setCredits(0);

    setSceneMessages([]);
    setLastEventAt(Date.now());
  }, []);

  // Idle tick: if 60s passes with no action/time-change, advance +1 minute.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastEventAt >= 60_000) {
        stepTime(1, "idle");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastEventAt, stepTime]);

  const value: LoopStateValue = {
    scene,
    sceneDef,
    goToScene,

    timeMinutes,
    advanceTime,

    loopCount,
    resetLoop,

    flags,
    setFlags,

    npcState,
    setNpcState,

    inventory,
    addItem,
    removeItem,
    hasItem,

    credits,
    addCredits,
    spendCredits,
    canAfford,

    pushMessage,

    sceneMessages,
    clearSceneMessages,
  };

  return <LoopStateContext.Provider value={value}>{children}</LoopStateContext.Provider>;
}

export function useLoopState() {
  const ctx = useContext(LoopStateContext);
  if (!ctx) throw new Error("useLoopState must be used inside LoopStateProvider");
  return ctx;
}
