// app/map/mapConfig.ts

export type MapNode = {
  id: string;
  label: string;
  neighbors: string[];
  unlocked?: (flags: any) => boolean;
};

export const mapNodes: Record<string, MapNode> = {
  "static-corner": {
    id: "static-corner",
    label: "Corner",
    neighbors: ["shop-front"],
  },
  "shop-front": {
    id: "shop-front",
    label: "Shop",
    neighbors: ["static-corner", "boy-street"],
  },
  "boy-street": {
    id: "boy-street",
    label: "Street",
    neighbors: ["shop-front", "death-reset"],
  },
  "death-reset": {
    id: "death-reset",
    label: "Impact",
    neighbors: ["static-corner"],
  },
};
