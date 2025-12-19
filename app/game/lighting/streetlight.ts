import type { LightingData } from "./lightingTypes";

export const streetLightLighting: LightingData = {
  version: 1,
  ambient: {
    color: "#ffffff",
    intensity: 0.12,
    enabled: true
  },
  rooms: [
    {
      "id": "streetlight",
      "name": "Street Light",
      "x": 0,
      "y": 0,
      "w": 1200,
      "h": 2600
    }
  ],
  lights: [
    {
      id: "light_d0d93b4843ff78_19b38aca4b9",
      name: "Light 1",
      type: "point",
      x: 664,
      y: 1024,
      z: 6,
      color: "#feb416",
      intensity: 200,
      distance: 1000,
      decay: 0.5,
      enabled: true,
      showBulb: true,
      bulbRadius: 10
    }
  ]
};
