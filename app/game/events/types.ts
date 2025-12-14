// app/game/events/types.ts
import type { SceneId } from "../sceneGraph";
import type { PlayerOption } from "../../components/OptionsContext";
import type { DialogNode } from "../../components/DialogContext";
import type { NPCState } from "../../components/LoopStateContext";
import { InventoryItem } from "../items/types";

export type EventCtx = {
  scene: SceneId;
  timeMinutes: number;
  flags: Record<string, any>;
  inventory: InventoryItem[];
  npcState: NPCState;
  credits: number;
};

export type EventHelpers = {
  advanceTime: (mins: number) => void;
  setFlags: (updater: (prev: any) => any) => void;

  addItem: (item: InventoryItem) => void;
  removeItem: (item: string) => void;

  setNpcState: (updater: (prev: NPCState) => NPCState) => void;

  startDialog: (nodeId: string) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
};

export type EventModule = {
  id: string;
  getOptions: (ctx: EventCtx, h: EventHelpers) => PlayerOption[];
  nodes?: Record<string, DialogNode>;
};
