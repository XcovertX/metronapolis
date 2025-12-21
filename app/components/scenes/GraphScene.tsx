// app/components/scenes/GraphScene.tsx
"use client";

import BaseScene from "./BaseScene";
import { useMemo } from "react";
import { useLoopState} from "../LoopStateContext";
import { useDialog } from "../DialogContext";
import { TIME } from "@/app/game/timeRules";
import { getEventOptions } from "@/app/game/events";
import { canTraverse } from "@/app/game/movementRules";
import type { DecisionSpec } from "../../game/events/decisionTypes";

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
    // NOTE: if getEventOptions still returns PlayerOption with onSelect that calls advanceTime,
    // it will still work (OptionsWindow has backwards compat).
    // You can migrate those next to emit decision-based options too.
    opts.push(
      ...getEventOptions(
        { scene, timeMinutes, flags, inventory, npcState, credits },
        {
          // ⚠️ old action API dependencies (kept for compatibility)
          // Prefer migrating these event options to `decision + afterCommit`.
          advanceTime: () => {
            // no-op placeholder if your getEventOptions signature requires it;
            // If it MUST advance time internally, keep passing through from LoopStateContext instead.
          },
          setFlags,
          addItem,
          removeItem,
          setNpcState,
          startDialog,
          addCredits,
          spendCredits,
          pushMessage,
        } as any
      )
    );

    // MOVEMENT (right D-pad) — ✅ now decision-based
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
      const timeCost =
        dir === "up" || dir === "down" ? TIME.VERTICAL_MOVE : TIME.DEFAULT_ACTION;

      const NAV_SPEC: DecisionSpec = {
        id: `nav_${scene}_via_${dir}`,
        title: `Navigate: ${def.title}`,
        kind: "navigate",
        outcomes: [
          {
            id: `to_${next}`,
            title: nextDef.title,
            defaultTimeCost: timeCost,
          },
        ],
      };

      opts.push({
        id: `move-${dir}-${next}`,
        kind: "move",
        dir,
        label: formatMoveLabel(dir, nextDef.title),

        decision: {
          spec: NAV_SPEC,
          outcomeId: `to_${next}`,
          meta: { kind: "navigate", from: scene, to: next, dir },
        },

        afterCommit: () => {
          goToScene(next as SceneId);
        },
      });
    }

    // Global wait (action) — ✅ decision-based
    const WAIT_SPEC: DecisionSpec = {
      id: `wait_${scene}`,
      title: "Wait",
      kind: "custom",
      outcomes: [
        { id: "wait", title: "Wait", defaultTimeCost: TIME.DEFAULT_ACTION },
      ],
    };

    opts.push({
      id: "wait",
      kind: "action",
      label: "Wait.",
      decision: {
        spec: WAIT_SPEC,
        outcomeId: "wait",
        meta: { kind: "custom", action: "wait", scene },
      },
      // no afterCommit needed
    });

    return opts;
  }, [
    scene,
    def.title,
    flags,
    inventory,
    npcState,
    timeMinutes,
    credits,
    setFlags,
    addItem,
    removeItem,
    setNpcState,
    startDialog,
    addCredits,
    spendCredits,
    pushMessage,
    goToScene,
  ]);

  const description = useMemo(() => {
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
      bgNative={{ w: 0, h: 0 }}
    />
  );
}
