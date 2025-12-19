import type { WalkCollisionData } from "./types";
import { aptBedroomNavmesh } from "./apt-bedroom";
import { aptLivingroomNavmesh } from "./apt-livingroom";
import { streetLightNavmesh } from "./streetlight";

export const NAVMESH_BY_SCENE: Record<string, WalkCollisionData> = {
  "apt-bedroom": aptBedroomNavmesh,
  "apt-livingroom": aptLivingroomNavmesh,
  "streetlight": streetLightNavmesh,
};
