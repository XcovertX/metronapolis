// app/game/events/types.ts
import type { SceneId } from "../sceneGraph";
import type { PlayerOption } from "../../components/OptionsContext";
import type { DialogNode } from "../../components/DialogContext";
import type { NPCState } from "../../components/LoopStateContext";

export type EventCtx = {
  scene: SceneId;
  timeMinutes: number;
  flags: Record<string, any>;
  inventory: string[];
  npcState: NPCState;
};

export type EventHelpers = {
  advanceTime: (mins: number) => void;
  setFlags: (updater: (prev: any) => any) => void;

  addItem: (item: string) => void;
  removeItem: (item: string) => void;

  setNpcState: (updater: (prev: NPCState) => NPCState) => void;

  startDialog: (nodeId: string) => void;
};

export type EventModule = {
  id: string;
  getOptions: (ctx: EventCtx, h: EventHelpers) => PlayerOption[];
  nodes?: Record<string, DialogNode>;
};
