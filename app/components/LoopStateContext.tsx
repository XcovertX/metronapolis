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

import { getScene, type SceneId } from "@/app/game/sceneGraph";
import { runTimeStep } from "@/app/game/timeEngine";
import { InventoryItem } from "@/app/game/items/types";
import { canEnterScene } from "@/app/game/movementRules";
import type { DecisionEvent, DecisionKnowledge, DecisionSpec, DecisionOutcomeSpec } from "@/app/game/events/decisionTypes";

// A tiny id helper (good enough for local logs)
function uid(prefix = "e") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// --------------------
// existing types...
// --------------------
export type LoopFlags = {
  hasWokenUp: boolean;
  rheaMet?: boolean;
  rheaWarned?: boolean;
  catObserved?: boolean;
  neighborDoorUnlocked?: boolean;
  miloMet?: boolean;
  vexMet?: boolean;
  sableMet?: boolean;
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
  lastScene: SceneId;

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

  // --------------------
  // Decision-tree system
  // --------------------
  decisionPath: DecisionEvent[];              // per-loop path (HUD tree)
  decisionKnowledge: DecisionKnowledge;       // persists across loops

  /**
   * Commit a decision outcome. You provide:
   * - spec: what decision + outcomes exist
   * - outcomeId: chosen outcome
   * - appliedTimeCost: actual mins to advance (full path or brevity)
   * - parentEventId: optional, for tree edges
   */
  commitDecision: (args: {
    spec: DecisionSpec;
    outcomeId: string;
    appliedTimeCost?: number;   // if omitted, uses learned time if known else default spec time
    parentEventId?: string;
    meta?: Record<string, any>;
  }) => void;

  /** Brevity becomes available once ALL outcomes have been seen at least once */
  isDecisionBrevityAvailable: (spec: DecisionSpec) => boolean;

  /** Get outcomes with best-known time cost (learned or default) */
  getBrevityOutcomes: (spec: DecisionSpec) => Array<DecisionOutcomeSpec & { timeCost: number; learned: boolean }>;
};

const LoopStateContext = createContext<LoopStateValue | undefined>(undefined);

// --- defaults ---
const START_SCENE: SceneId = "apt-bedroom";
const START_TIME_MINUTES = 12 * 60;

const initialFlags: LoopFlags = { hasWokenUp: false };

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
  const [lastScene, setLastScene] = useState<SceneId>(START_SCENE);
  const [timeMinutes, setTimeMinutes] = useState<number>(START_TIME_MINUTES);
  const [loopCount, setLoopCount] = useState<number>(1);

  const [flags, setFlags] = useState<LoopFlags>(initialFlags);
  const [npcState, setNpcState] = useState<NPCState>(initialNPCState);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [credits, setCredits] = useState<number>(0);

  const [sceneMessages, setSceneMessages] = useState<string[]>([]);
  const [lastEventAt, setLastEventAt] = useState<number>(() => Date.now());

  // ✅ Decision tracking state
  const [decisionPath, setDecisionPath] = useState<DecisionEvent[]>([]);
  const [decisionKnowledge, setDecisionKnowledge] = useState<DecisionKnowledge>({});

  // --- refs so time engine always sees latest state ---
  const sceneRef = useRef<SceneId>(scene);
  const timeRef = useRef<number>(timeMinutes);
  const flagsRef = useRef<LoopFlags>(flags);
  const npcRef = useRef<NPCState>(npcState);
  const invRef = useRef<InventoryItem[]>(inventory);

  useEffect(() => { sceneRef.current = scene; }, [scene]);
  useEffect(() => { timeRef.current = timeMinutes; }, [timeMinutes]);
  useEffect(() => { flagsRef.current = flags; }, [flags]);
  useEffect(() => { npcRef.current = npcState; }, [npcState]);
  useEffect(() => { invRef.current = inventory; }, [inventory]);

  const sceneDef = useMemo(() => getScene(scene), [scene]);

  const pushMessages = useCallback((msgs: string[]) => {
    if (!msgs.length) return;
    setSceneMessages((prev) => [...prev, ...msgs].slice(-8));
  }, []);

  const clearSceneMessages = useCallback(() => setSceneMessages([]), []);

  /**
   * The ONLY place we should advance time.
   */
  const stepTime = useCallback(
    (mins: number, reason: "action" | "idle") => {
      if (!mins || mins <= 0) return;

      const prev = timeRef.current;
      const next = prev + mins;

      timeRef.current = next;
      setTimeMinutes(next);

      const result = runTimeStep(prev, next, {
        scene: sceneRef.current,
        flags: flagsRef.current,
        inventory: invRef.current.map((item) => item.id),
        npcState: npcRef.current,
      });

      pushMessages(result.messages);

      if (result.death) {
        setTimeout(() => { resetLoop(); }, 700);
        return;
      }

      setLastEventAt(Date.now());
    },
    [pushMessages]
  );

  const advanceTime = useCallback((mins: number) => stepTime(mins, "action"), [stepTime]);

  const goToScene = useCallback((id: SceneId) => {
    setLastScene(sceneRef.current);
    sceneRef.current = id;
    setScene(id);
  }, []);

  const addItem = (item: InventoryItem) => setInventory((prev) => [...prev, item]);
  const removeItem = (id: string) => setInventory((prev) => prev.filter((i) => i.id !== id));
  const hasItem = (id: string) => inventory.some((i) => i.id === id);

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

  const pushMessage = useCallback(
    (text: string) => {
      if (!text) return;
      pushMessages([text]);
    },
    [pushMessages]
  );

  // --------------------
  // Decision helpers
  // --------------------
  const isDecisionBrevityAvailable = useCallback(
    (spec: DecisionSpec) => {
      const k = decisionKnowledge[spec.id];
      if (!k) return false;
      // all outcomes must have been seen at least once
      return spec.outcomes.every((o) => !!k.seenOutcomeIds[o.id]);
    },
    [decisionKnowledge]
  );

  const getBrevityOutcomes = useCallback(
    (spec: DecisionSpec) => {
      const k = decisionKnowledge[spec.id];
      return spec.outcomes.map((o) => {
        const learned = !!k?.learnedOutcomeTimeCost?.[o.id];
        const timeCost = learned ? k.learnedOutcomeTimeCost[o.id] : o.defaultTimeCost;
        return { ...o, timeCost, learned };
      });
    },
    [decisionKnowledge]
  );

  const commitDecision = useCallback(
    (args: {
      spec: DecisionSpec;
      outcomeId: string;
      appliedTimeCost?: number;
      parentEventId?: string;
      meta?: Record<string, any>;
    }) => {
      const { spec, outcomeId, parentEventId, meta } = args;

      // Determine best time cost:
      const k = decisionKnowledge[spec.id];
      const learned = k?.learnedOutcomeTimeCost?.[outcomeId];
      const defaultCost = spec.outcomes.find((o) => o.id === outcomeId)?.defaultTimeCost ?? 0;

      const appliedTimeCost =
        typeof args.appliedTimeCost === "number"
          ? args.appliedTimeCost
          : typeof learned === "number"
          ? learned
          : defaultCost;

      // 1) Append path event (HUD tree)
      const ev: DecisionEvent = {
        eventId: uid("dec"),
        loop: loopCount,
        atMinute: timeRef.current,
        decisionId: spec.id,
        outcomeId,
        appliedTimeCost,
        parentEventId,
        meta,
      };
      setDecisionPath((prev) => [...prev, ev]);

      // 2) Update knowledge (persist across loops)
      setDecisionKnowledge((prev) => {
        const cur = prev[spec.id] ?? { seenOutcomeIds: {}, learnedOutcomeTimeCost: {} };

        // mark seen always, ensure type is Record<string, true>
        const nextSeen: Record<string, true> = { ...cur.seenOutcomeIds };
        nextSeen[outcomeId] = true;

        // If this commit represents a "full" traversal (or otherwise correct),
        // you can overwrite learned time cost. Up to you when you pass appliedTimeCost.
        const nextLearned = { ...cur.learnedOutcomeTimeCost, [outcomeId]: appliedTimeCost };

        return {
          ...prev,
          [spec.id]: { seenOutcomeIds: nextSeen, learnedOutcomeTimeCost: nextLearned },
        };
      });

      // 3) Advance time through the single allowed gate
      if (appliedTimeCost > 0) advanceTime(appliedTimeCost);
    },
    [advanceTime, decisionKnowledge, loopCount]
  );

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

    // ✅ Per-loop decision path resets so HUD shows "this loop's run"
    setDecisionPath([]);

    // ✅ IMPORTANT: decisionKnowledge does NOT reset (player remembers across loops)
  }, []);

  // Idle tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastEventAt >= 60_000) stepTime(1, "idle");
    }, 1000);
    return () => clearInterval(interval);
  }, [lastEventAt, stepTime]);

  const value: LoopStateValue = {
    scene,
    sceneDef,
    goToScene,
    lastScene,

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

    // decision system
    decisionPath,
    decisionKnowledge,
    commitDecision,
    isDecisionBrevityAvailable,
    getBrevityOutcomes,
  };

  return <LoopStateContext.Provider value={value}>{children}</LoopStateContext.Provider>;
}

export function useLoopState() {
  const ctx = useContext(LoopStateContext);
  if (!ctx) throw new Error("useLoopState must be used inside LoopStateProvider");
  return ctx;
}
