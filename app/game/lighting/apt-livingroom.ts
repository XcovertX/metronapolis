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
      "id": "lamp1",
      "name": "Warm Lamp",
      "type": "point",
      "x": 1050,
      "y": 550,
      "z": 100,
      "color": "#4cd5fb",
      "intensity": 100,
      "distance": 500,
      "decay": 1,
      "enabled": true,
      "roomId": "apt-livingroom"
    },
    {
      "id": "light_7935018d027a08_19b37925802",
      "name": "Light 2",
      "type": "point",
      "x": 448,
      "y": 1240,
      "z": 260,
      "color": "#ffd28a",
      "intensity": 50,
      "distance": 900,
      "decay": 0.3,
      "enabled": true,
    }
  ]
};