// filepath: app/game/navMeshs/types.ts
import { SceneId } from "../sceneGraph";

export type SceneChangeZone = {
  id: string;
  targetSceneId: SceneId;
  name: string;
  points: Pt[];
};

export type WalkCollisionData = {
  version: 1;
  walkables: Polygon[];
  colliders: Polygon[];
  collisionPoints: CollisionPoint[];
  sceneChangeZones: SceneChangeZone[];
};

export type Pt = { x: number; y: number };

export type Polygon = {
  id: string;
  name: string;
  points: Pt[];
};

type CollisionPoint = {
  id: string;
  name: string;
  p: Pt; 
};


