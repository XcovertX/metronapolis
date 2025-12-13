// app/game/timeEngine.ts
import type { SceneId } from "./sceneGraph";
import { getCatDeltaMessages } from "./npcs/cat";
import { getSwitchDeltaMessages, checkSwitchMugging } from "./npcs/switch";

export type TimeEngineCtx = {
  scene: SceneId;
  flags: any;
  inventory: string[];
  npcState: any;
};

export type TimeStepResult = {
  messages: string[];
  death?: boolean;
};

export function runTimeStep(
  prevTime: number,
  nextTime: number,
  ctx: TimeEngineCtx
): TimeStepResult {
  const messages: string[] = [];

  // 1) Entity delta messages (scheduler-owned)
  messages.push(...getCatDeltaMessages(prevTime, nextTime, ctx.scene));
  messages.push(...getSwitchDeltaMessages(prevTime, nextTime, ctx.scene));

  // 2) Hazard check (also entity-owned)
  const mug = checkSwitchMugging(prevTime, nextTime, ctx.scene, ctx.flags);
  if (mug.messages.length) messages.push(...mug.messages);
  if (mug.death) return { messages, death: true };

  return { messages };
}
