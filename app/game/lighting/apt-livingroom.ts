import type { LightingData } from "./lightingTypes";

export const aptLivingroomLighting: LightingData = {
  version: 1,
  ambient: { color: "#ffffff", intensity: 0.12, enabled: true },
  "rooms": [
    {
      "id": "apt-livingroom",
      "name": "Apt-Livingroom",
      "x": 0,
      "y": 0,
      "w": 736,
      "h": 1470
    }
  ],
  "lights": [
    {
      "id": "light_f1f75ea9c6aec8_19b37c51be9",
      "name": "Light 3",
      "type": "point",
      "x": 552,
      "y": 712,
      "z": 95,
      "color": "#48fef2",
      "intensity": 500,
      "distance": 4000,
      "decay": 1.5,
      "enabled": true,
    },

  ]
};

