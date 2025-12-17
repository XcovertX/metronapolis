export type Pt = { x: number; y: number };
export type LightType = "point" | "spot";

export type Room = {
  id: string;
  name: string;
  // screen px (top-left origin)
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LightDef = {
  id: string;
  name: string;
  type: LightType;

  // screen px (top-left origin)
  x: number;
  y: number;
  z: number;

  color: string;
  intensity: number;
  distance: number;
  decay: number;

  // spot-only
  angleDeg?: number;
  penumbra?: number;
  target?: Pt;

  enabled: boolean;
  roomId?: string;
};

export type LightingData = {
  version: 1;
  ambient: { color: string; intensity: number; enabled: boolean };
  rooms: Room[];
  lights: LightDef[];
};
