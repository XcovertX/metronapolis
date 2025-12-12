// app/map/mapConfig.ts

export type MapNode = {
  id: string;
  label: string;
  neighbors: string[]; // scene IDs it connects to
  unlocked?: (flags: any) => boolean;
};

export const mapNodes: Record<string, MapNode> = {
  "apt-bedroom": {
    id: "apt-bedroom",
    label: "Bedroom",
    neighbors: ["apt-living"],
  },
  "apt-living": {
    id: "apt-living",
    label: "Living",
    neighbors: ["apt-bedroom", "apt-kitchen", "lobby"],
  },
  "apt-kitchen": {
    id: "apt-kitchen",
    label: "Kitchen",
    neighbors: ["apt-living"],
  },
  lobby: {
    id: "lobby",
    label: "Lobby",
    neighbors: ["apt-living", "street", "rooftop"],
  },
  street: {
    id: "street",
    label: "Street",
    neighbors: ["lobby", "cafe", "alley"],
  },
  cafe: {
    id: "cafe",
    label: "Café",
    neighbors: ["street"],
  },
  alley: {
    id: "alley",
    label: "Alley",
    neighbors: ["street", "transit"],
  },
  transit: {
    id: "transit",
    label: "Transit",
    neighbors: ["alley"],
    unlocked: (flags) => flags.transitUnlocked === true,
  },
  rooftop: {
    id: "rooftop",
    label: "Rooftop",
    neighbors: ["lobby"],
    unlocked: (flags) => flags.rooftopUnlocked === true,
  },
};
