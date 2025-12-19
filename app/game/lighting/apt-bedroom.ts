import type { LightingData } from "./lightingTypes";

export const aptBedroomLighting: LightingData = {
  version: 1,
  ambient: { color: "#ffffff", intensity: 0.12, enabled: true },
  rooms: [
    { id: "apt-bedroom", name: "Apt-Bedroom", x: 0, y: 0, w: 1024, h: 768 },
  ],
  lights: [
    {
      "id": "light_e5b0e3a1c702a_19b378e31af",
      "name": "Light 2",
      "type": "point",
      "x": 224,
      "y": 368,
      "z": 60,
      "color": "#ffd28a",
      "intensity": 210.05,
      "distance": 900,
      "decay": 0.86,
      "enabled": true,
    }
  ],
};
