import type { LightingData } from "./lightingTypes";
import { aptBedroomLighting } from "./apt-bedroom";
import { aptLivingroomLighting } from "./apt-livingroom";

export const LIGHTING_BY_SCENE: Record<string, LightingData> = {
  "apt-bedroom": aptBedroomLighting,
  "apt-livingroom": aptLivingroomLighting,
};
