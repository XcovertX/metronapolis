// app/game/timeEngine.ts
import type { SceneId } from "./sceneGraph";
import { getCatDeltaMessages } from "./npcs/cat";

export type TimeEngineCtx = {
  scene: SceneId;
  flags: any;
  inventory: string[];
  npcState: any;
};

export type TimeStepResult = {
  messages: string[];
  // later: patches (setFlags/setNpcState), autoSceneChange, etc.
};

export function runTimeStep(
  prevTime: number,
  nextTime: number,
  ctx: TimeEngineCtx
): TimeStepResult {
  const messages: string[] = [];

  // 1) Entity delta messages (scheduler-owned)
  messages.push(...getCatDeltaMessages(prevTime, nextTime, ctx.scene));

  // 2) Scene ambient messages (optional later)
  // messages.push(...getAmbientMessages(prevTime, nextTime, ctx.scene, ctx));

  return { messages };
}
