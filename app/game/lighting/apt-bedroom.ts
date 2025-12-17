import type { LightingData } from "./lightingTypes";

export const aptBedroomLighting: LightingData = {
  version: 1,
  ambient: { color: "#ffffff", intensity: 0.12, enabled: true },
  rooms: [
    { id: "apt-bedroom", name: "Apt-Bedroom", x: 0, y: 0, w: 1024, h: 768 },
  ],
  lights: [
    {
      id: "lamp1",
      name: "Warm Lamp",
      type: "point",
      x: 520,
      y: 260,
      z: 260,
      color: "#ffd28a",
      intensity: 200,
      distance: 5000,
      decay: 1,
      enabled: true,
      roomId: "apt-bedroom",
    },
  ],
};
