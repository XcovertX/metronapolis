import { WalkCollisionData } from "@/app/components/NavMeshEditor"
import { aptBedroomNavmesh } from "./apt-bedroom";
import { aptLivingroomNavmesh } from "./apt-livingroom";

export const NAVMESH_BY_SCENE: Record<string, WalkCollisionData> = {
  "apt-bedroom": aptBedroomNavmesh,
  "apt-livingroom": aptLivingroomNavmesh,
};
