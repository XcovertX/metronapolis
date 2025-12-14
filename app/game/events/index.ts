// app/game/events/index.ts
import type { EventCtx, EventHelpers, EventModule } from "./types";
import type { PlayerOption } from "../../components/OptionsContext";
import type { DialogNode } from "../../components/DialogContext";

import { apartmentCreditsEvent } from "./apartmentCredits";
import { hideEvent } from "./hide";
import { catNpc } from "./npcs/cat";
import { rhea } from "./npcs/rhea";
import { milo } from "./npcs/milo";
import { sable } from "./npcs/sable";
import { switchNpc } from "./npcs/switch";
import { baristaNpc } from "./npcs/vex";

const modules: EventModule[] = [hideEvent, catNpc, rhea, milo, sable, switchNpc, baristaNpc, apartmentCreditsEvent, ];

export function getEventOptions(ctx: EventCtx, helpers: EventHelpers): PlayerOption[] {
  const out: PlayerOption[] = [];
  for (const m of modules) out.push(...m.getOptions(ctx, helpers));
  return out;
}

export const dialogNodes: Record<string, DialogNode> = modules.reduce(
  (acc, m) => Object.assign(acc, m.nodes ?? {}),
  {} as Record<string, DialogNode>
);
