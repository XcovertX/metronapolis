import type { LightingData } from "./lightingTypes";

export const aptLivingroomLighting: LightingData = {
  version: 1,
  ambient: { color: "#ffffff", intensity: 0.12, enabled: true },
  rooms: [
    { id: "apt-livingroom", name: "Apt-Livingroom", x: 0, y: 0, w: 1024, h: 768 },
  ],
  lights: [
    {
      id: "lamp1",
      name: "Warm Lamp",
      type: "point",
      x: 1330,
      y: 550,
      z: 50,
      color: "#4cd5fb",
      intensity: 200,
      distance: 500,
      decay: 1,
      enabled: true,
      roomId: "apt-livingroom",
    },
  ],
};
