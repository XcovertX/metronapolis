// app/components/scenes/GraphScene.tsx
"use client";

import BaseScene from "./BaseScene";
import { useMemo } from "react";
import { useLoopState } from "../LoopStateContext";
import { useDialog } from "../DialogContext";
import { TIME } from "@/app/game/timeRules";
import { getEventOptions } from "@/app/game/events";
import { canTraverse } from "@/app/game/movementRules";


import {
  getScene,
  getExit,
  type SceneId,
  type Direction,
} from "../../game/sceneGraph";

import type { PlayerOption } from "../OptionsContext";

const DIR_LABEL: Record<Direction, string> = {
  n: "North",
  e: "East",
  s: "South",
  w: "West",
  up: "Up",
  down: "Down",
};

const DIR_ORDER: Direction[] = ["n", "e", "s", "w", "up", "down"];

function formatMoveLabel(dir: Direction, toTitle: string) {
  return `${DIR_LABEL[dir]} → ${toTitle}`;
}

export default function GraphScene() {
  const {
    scene,
    advanceTime,
    goToScene,
    timeMinutes,
    flags,
    inventory,
    setFlags,
    addItem,
    removeItem,
    npcState,
    setNpcState,
    credits, 
    addCredits, 
    spendCredits,
    pushMessage,
  } = useLoopState();

  const { startDialog } = useDialog();
  const def = useMemo(() => getScene(scene), [scene]);

  const options = useMemo((): PlayerOption[] => {
    const opts: PlayerOption[] = [];

    // Event-driven ACTIONS (left)
    opts.push(
      ...getEventOptions(
        { scene, timeMinutes, flags, inventory, npcState, credits },
        { advanceTime, setFlags, addItem, removeItem, setNpcState, startDialog, addCredits, spendCredits, pushMessage}
      )
    );

    // MOVEMENT (right D-pad)
    for (const dir of DIR_ORDER) {
      const next = getExit(scene, dir);
      if (!next) continue;

      const allowed = canTraverse(
        scene,
        dir,
        next as SceneId,
        { flags, inventory, npcState, timeMinutes }
      );
      if (!allowed) continue;

      const nextDef = getScene(next);
      const timeCost = dir === "up" || dir === "down" ? TIME.VERTICAL_MOVE : TIME.DEFAULT_ACTION;

      opts.push({
        id: `move-${dir}-${next}`,
        kind: "move",
        dir,
        label: formatMoveLabel(dir, nextDef.title),
        onSelect: () => {
          advanceTime(timeCost);
          goToScene(next as SceneId);
        },
      });
    }

    // Global wait (action)
    opts.push({
      id: "wait",
      kind: "action",
      label: "Wait.",
      onSelect: () => advanceTime(TIME.DEFAULT_ACTION),
    });

    return opts;
  }, [
    scene,
    timeMinutes,
    flags,
    inventory,
    npcState,
    advanceTime,
    setFlags,
    addItem,
    removeItem,
    setNpcState,
    startDialog,
    goToScene,
  ]);

  const description = useMemo(() => {
    // Keep this generic; if you want “cat is here” text, we can inject it via an event too.
    return [
      "The city feels close here—every decision costs time.",
      `You are at: ${def.title}.`,
    ];
  }, [def.title]);

  return (
    <BaseScene
      id={def.id}
      title={def.title}
      background={def.background}
      description={description}
      options={options}
    />
  );
}
