import type { LightingData } from "./lightingTypes";

export const aptBedroomLighting: LightingData = {
  version: 1,
  ambient: {
    color: "#cf2aae",
    intensity: 0.12,
    enabled: true
  },
  rooms: [
    {
      id: "apt-bedroom",
      name: "Apt-Bedroom",
      x: 0,
      y: 0,
      w: 632,
      h: 632
    }
  ],
  lights: [
    {
      id: "light_e5b0e3a1c702a_19b378e31af",
      name: "Light 2",
      type: "point",
      x: 316,
      y: 316,
      z: -2,
      color: "#c54db9",
      intensity: 210.05,
      distance: 900,
      decay: 0.86,
      enabled: true
    },
    {
      id: "light_7657a3a42ddc2_19b38155508",
      name: "Light 2",
      type: "point",
      x: 232,
      y: 304,
      z: 260,
      color: "#ffd28a",
      intensity: 6,
      distance: 900,
      decay: 2,
      enabled: true,
    }
  ]
};

