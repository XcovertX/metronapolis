// app/game/sceneGraph.ts

export type Direction = "n" | "e" | "s" | "w" | "up" | "down";

/** Exits for a scene; generic so we can avoid circular SceneId typing */
export type SceneExits<ID extends string = string> = Partial<Record<Direction, ID>>;

export type SceneDef<ID extends string = string> = {
  id: ID;
  title: string;
  /** grid coords for minimap + adjacency */
  x: number;
  y: number;
  z: number; // vertical: basement -1, ground 0, apartment 1, roof 2
  exits: SceneExits<ID>;
  background?: string;
  tags?: string[];
};

export const sceneGraph = {
  // ─────────────────────────────────────────
  // Apartment (z=1)
  // Coordinates: N = y+1, S = y-1, E = x+1, W = x-1
  // ─────────────────────────────────────────
  "apt-bedroom": {
    id: "apt-bedroom",
    title: "Apartment — Bedroom",
    x: -1,
    y: 0,
    z: 1,
    exits: { e: "apt-living" },
    background: "/rooms/apt-bedroom.png",
    tags: ["interior", "apartment"],
  },
  "apt-living": {
    id: "apt-living",
    title: "Apartment — Living Room",
    x: 0,
    y: 0,
    z: 1,
    exits: { w: "apt-bedroom", e: "apt-kitchen", n: "apt-bathroom", s: "apt-hallway" },
    tags: ["interior", "apartment"],
  },
  "apt-kitchen": {
    id: "apt-kitchen",
    title: "Apartment — Kitchen",
    x: 1,
    y: 0,
    z: 1,
    exits: { w: "apt-living", n: "utility-closet" },
    tags: ["interior", "apartment"],
  },
  "apt-bathroom": {
    id: "apt-bathroom",
    title: "Apartment — Bathroom",
    x: 0,
    y: 1,
    z: 1,
    exits: { s: "apt-living" },
    tags: ["interior", "apartment"],
  },
  "apt-hallway": {
    id: "apt-hallway",
    title: "Apartment — Hallway",
    x: 0,
    y: -1,
    z: 1,
    exits: { n: "apt-living", w: "neighbor-door", e: "fire-escape-window", down: "elevator" },
    tags: ["interior", "building"],
  },
// Neighbor apartment (z=1)
"neighbor-door": {
  id: "neighbor-door",
  title: "Neighbor’s Door",
  x: -1,
  y: -1,
  z: 1,
  // add "w" into neighbor apartment
  exits: { e: "apt-hallway", w: "neighbor-foyer" },
  tags: ["interior", "building"],
},

"neighbor-foyer": {
  id: "neighbor-foyer",
  title: "Neighbor — Foyer",
  x: -2,
  y: -1,
  z: 1,
  exits: { e: "neighbor-door", w: "neighbor-living", n: "neighbor-bath" },
  tags: ["interior", "apartment"],
},

"neighbor-living": {
  id: "neighbor-living",
  title: "Neighbor — Living Room",
  x: -3,
  y: -1,
  z: 1,
  exits: { e: "neighbor-foyer", w: "neighbor-bedroom", s: "neighbor-kitchen" },
  tags: ["interior", "apartment"],
},

"neighbor-bedroom": {
  id: "neighbor-bedroom",
  title: "Neighbor — Bedroom",
  x: -4,
  y: -1,
  z: 1,
  exits: { e: "neighbor-living" },
  tags: ["interior", "apartment"],
},

"neighbor-kitchen": {
  id: "neighbor-kitchen",
  title: "Neighbor — Kitchenette",
  x: -3,
  y: -2,
  z: 1,
  exits: { n: "neighbor-living" },
  tags: ["interior", "apartment"],
},

"neighbor-bath": {
  id: "neighbor-bath",
  title: "Neighbor — Bathroom",
  x: -2,
  y: 0,
  z: 1,
  exits: { s: "neighbor-foyer" },
  tags: ["interior", "apartment"],
},
  "fire-escape-window": {
    id: "fire-escape-window",
    title: "Fire Escape Window",
    x: 1,
    y: -1,
    z: 1,
    exits: { w: "apt-hallway", e: "fire-escape-mid" },
    tags: ["transition", "vertical"],
  },
  "utility-closet": {
    id: "utility-closet",
    title: "Utility Closet",
    x: 1,
    y: 1,
    z: 1,
    exits: { s: "apt-kitchen" },
    tags: ["interior", "building"],
  },

  // ─────────────────────────────────────────
  // Building Ground (z=0)
  // Notes:
  // - lobby is directly "below" apt-hallway via up/down ONLY
  // - rear service chain is kept west/south of lobby
  // ─────────────────────────────────────────
  "lobby": {
    id: "lobby",
    title: "Building Lobby",
    x: 0,
    y: -1,
    z: 0,
    exits: {
      e: "elevator",
      w: "security-desk",
      s: "courtyard-int",
    },
    tags: ["interior", "building", "social"],
  },
  "elevator": {
    id: "elevator",
    title: "Elevator (Broken)",
    x: 1,
    y: -1,
    z: 0,
    exits: { w: "lobby", up: "apt-hallway", down: "basement-storage" },
    tags: ["interior", "building"],
  },
  "security-desk": {
    id: "security-desk",
    title: "Security Desk (Unmanned)",
    x: 1,
    y: -2,
    z: 0,
    exits: { e: "lobby", w: "maintenance-office", n: "service-hall" },
    tags: ["interior", "building"],
  },
  "maintenance-office": {
    id: "maintenance-office",
    title: "Maintenance Office",
    x: 0,
    y: -2,
    z: 0,
    exits: { down: "boiler-room", e: "security-desk" },
    tags: ["interior", "building"],
  },
  "service-hall": {
    id: "service-hall",
    title: "Rear Service Hallway",
    x: -1,
    y: -2,
    z: 0,
    exits: { w: "building-laundry", n: "service-door", s: "security-desk" },
    tags: ["interior", "building"],
  },
  "building-laundry": {
    id: "building-laundry",
    title: "Laundry Room (Building)",
    x: -2,
    y: -2,
    z: 0,
    exits: { e: "service-hall" },
    tags: ["interior", "building"],
  },
  "stairwell-mid": {
    id: "stairwell-mid",
    title: "Stairwell — Mid Landing",
    x: -1,
    y: -1,
    z: 0,
    exits: { e: "lobby", s: "service-hall" },
    tags: ["interior", "building", "vertical"],
  },
  "courtyard-int": {
    id: "courtyard-int",
    title: "Courtyard Entrance (Interior Side)",
    x: -1,
    y: -3,
    z: 0,
    exits: { n: "lobby", e: "courtyard-ext", s: "sidewalk-south" }, // door to outside courtyard (east)
    tags: ["transition", "building"],
  },

  // ─────────────────────────────────────────
  // Basement (z=-1)
  // ─────────────────────────────────────────
  "basement-storage": {
    id: "basement-storage",
    title: "Basement Storage",
    x: 0,
    y: -1,
    z: -1,
    exits: { up: "elevator", w: "boiler-room" },
    tags: ["interior", "basement"],
  },
  "boiler-room": {
    id: "boiler-room",
    title: "Basement Boiler Room",
    x: 1,
    y: -1,
    z: -1,
    exits: { up: "maintenance-office", e: "basement-storage" },
    tags: ["interior", "basement"],
  },

  // ─────────────────────────────────────────
  // Fire Escape / Roof (z=1..2)
  // ─────────────────────────────────────────
  "fire-escape-mid": {
    id: "fire-escape-mid",
    title: "Fire Escape Landing",
    x: 2,
    y: -1,
    z: 1,
    exits: { w: "fire-escape-window", up: "fire-escape-top" },
    tags: ["exterior", "vertical"],
  },
  "fire-escape-top": {
    id: "fire-escape-top",
    title: "Fire Escape Top",
    x: 2,
    y: -1,
    z: 2,
    exits: { down: "fire-escape-mid", w: "rooftop-door" },
    tags: ["exterior", "vertical"],
  },
  "rooftop-door": {
    id: "rooftop-door",
    title: "Rooftop Access Door",
    x: 1,
    y: -1,
    z: 2,
    exits: { e: "fire-escape-top", w: "rooftop" },
    tags: ["transition", "roof"],
  },
  "rooftop": {
    id: "rooftop",
    title: "Rooftop — Main",
    x: 0,
    y: -1,
    z: 2,
    exits: { e: "rooftop-door", w: "rooftop-shack" },
    tags: ["exterior", "roof"],
  },
  "rooftop-shack": {
    id: "rooftop-shack",
    title: "Rooftop Utility Shack",
    x: -1,
    y: -1,
    z: 2,
    exits: { e: "rooftop" },
    tags: ["exterior", "roof"],
  },

  // ─────────────────────────────────────────
  // Immediate Exterior (z=0) — STREET HUB
  // Make street-front the central hub at (0,0)
  // ─────────────────────────────────────────
  "street-front": {
    id: "street-front",
    title: "Street — In Front of Building",
    x: 0,
    y: 0,
    z: 0,
    exits: { n: "sidewalk-south", e: "street-alley" },
    tags: ["exterior"],
  },
  "street-alley": {
    id: "street-alley",
    title: "Street — In Front of the Alley",
    x: 0,
    y: 0,
    z: 0,
    exits: { w: "street-front", n: "alley-entrance", e: "street-store", s: "laundromat-front" },
    tags: ["exterior"],
  },
  "street-store": {
    id: "street-store",
    title: "Street — In Front of the Store",
    x: 0,
    y: 0,
    z: 0,
    exits: { w: "street-alley", s: "store-front" },
    tags: ["exterior"],
  },
  "sidewalk-north": {
    id: "sidewalk-north",
    title: "Sidewalk (North)",
    x: 0,
    y: 1,
    z: 0,
    exits: { s: "street-front", n: "store-front", e: "streetlight", w: "laundromat-front" },
    tags: ["exterior"],
  },
  "sidewalk-south": {
    id: "sidewalk-south",
    title: "Sidewalk (South)",
    x: 0,
    y: -1,
    z: 0,
    exits: { n: "courtyard-int", s: "street-front", e: "bike-rack" },
    tags: ["exterior"],
  },

  // Alley chain aligned to the west
  "alley-entrance": {
    id: "alley-entrance",
    title: "Alley Entrance",
    x: -1,
    y: 0,
    z: 0,
    exits: { s: "street-alley", n: "alley-mid" },
    tags: ["exterior"],
  },
  "alley-mid": {
    id: "alley-mid",
    title: "Alley — Midway",
    x: -2,
    y: 0,
    z: 0,
    exits: { s: "alley-entrance", e: "dumpster", n: "dead-end" },
    tags: ["exterior"],
  },
  "dumpster": {
    id: "dumpster",
    title: "Dumpster Corner",
    x: -3,
    y: 0,
    z: 0,
    exits: { w: "alley-mid" },
    tags: ["exterior"],
  },
  "dead-end": {
    id: "dead-end",
    title: "Dead End (Graffiti Wall)",
    x: -4,
    y: 0,
    z: 0,
    exits: { s: "alley-mid", w: "loading-zone" },
    tags: ["exterior"],
  },

  // South-west loading zone aligned under alley-mid
  "loading-zone": {
    id: "loading-zone",
    title: "Loading Zone",
    x: -2,
    y: -1,
    z: 0,
    exits: { s: "service-door", e: "dead-end", w: "service-door" },
    tags: ["exterior"],
  },

  // East-side exterior chain
  "bike-rack": {
    id: "bike-rack",
    title: "Bike Rack Area",
    x: 1,
    y: 0,
    z: 0,
    exits: { w: "sidewalk-south", n: "courtyard-ext" },
    tags: ["exterior"],
  },
  "streetlight": {
    id: "streetlight",
    title: "Streetlight Corner",
    x: 1,
    y: 1,
    z: 0,
    exits: { w: "cafe-front", e: "side-street-east" },
    tags: ["exterior"],
  },

  // Courtyard exterior aligned south of sidewalk-south
  "courtyard-ext": {
    id: "courtyard-ext",
    title: "Courtyard (Exterior)",
    x: 0,
    y: -2,
    z: 0,
    exits: { w: "courtyard-int" },
    tags: ["exterior"],
  },

  // Service door aligned east of sidewalk-south
  "service-door": {
    id: "service-door",
    title: "Service Door (Back of Building)",
    x: 1,
    y: -1,
    z: 0,
    exits: { s: "service-hall", e: "loading-zone" },
    tags: ["transition"],
  },

  // ─────────────────────────────────────────
  // Businesses / Interiors (z=0)
  // Keep them spatially adjacent to their fronts
  // ─────────────────────────────────────────
  "store-front": {
    id: "store-front",
    title: "Corner Store — Front",
    x: 0,
    y: 2,
    z: 0,
    exits: { n: "street-store", s: "store-interior", w: "laundromat-front", e: "cafe-front" },
    tags: ["exterior"],
  },
  "store-interior": {
    id: "store-interior",
    title: "Corner Store — Interior",
    x: 0,
    y: 3,
    z: 0,
    exits: { n: "store-front", s: "store-stock" },
    tags: ["interior", "social"],
  },
  "store-stock": {
    id: "store-stock",
    title: "Stock Room (Store)",
    x: 0,
    y: 4,
    z: 0,
    exits: { n: "store-interior" },
    tags: ["interior"],
  },

  "cafe-front": {
    id: "cafe-front",
    title: "Corner Café — Front",
    x: 1,
    y: 2,
    z: 0,
    exits: { e: "streetlight", w: "store-front", s: "cafe-interior" },
    tags: ["exterior", "social"],
  },
  "cafe-interior": {
    id: "cafe-interior",
    title: "Corner Café — Interior",
    x: 1,
    y: 3,
    z: 0,
    exits: { n: "cafe-front", s: "cafe-back" },
    tags: ["interior", "social"],
  },
  "cafe-back": {
    id: "cafe-back",
    title: "Café Back Room",
    x: 0,
    y: 3,
    z: 0,
    exits: { n: "cafe-interior" },
    tags: ["interior"],
  },

  "laundromat-front": {
    id: "laundromat-front",
    title: "Public Laundromat — Front",
    x: -1,
    y: 2,
    z: 0,
    exits: { n: "street-alley", s: "laundromat-interior", e: "store-front" },
    tags: ["exterior"],
  },
  "laundromat-interior": {
    id: "laundromat-interior",
    title: "Public Laundromat — Interior",
    x: -1,
    y: 3,
    z: 0,
    exits: { n: "laundromat-front"},
    tags: ["interior"],
  },

  "clinic-front": {
    id: "clinic-front",
    title: "Clinic Entrance",
    x: 2,
    y: 2,
    z: 0,
    exits: { w: "side-street-east", e: "clinic-waiting" },
    tags: ["exterior"],
  },
  "clinic-waiting": {
    id: "clinic-waiting",
    title: "Clinic Waiting Room",
    x: 2,
    y: 3,
    z: 0,
    exits: { w: "clinic-front", s: "phone-booth" },
    tags: ["interior"],
  },

  // ─────────────────────────────────────────
  // Transit / Side streets / Edges (z=0)
  // ─────────────────────────────────────────
  "ticket-kiosk": {
    id: "ticket-kiosk",
    title: "Transit Ticket Kiosk",
    x: -2,
    y: 3,
    z: 0,
    exits: { e: "store-interior", w: "transit-platform" },
    tags: ["exterior", "travel"],
  },
  "transit-platform": {
    id: "transit-platform",
    title: "Transit Stop Platform",
    x: -3,
    y: 3,
    z: 0,
    exits: { e: "ticket-kiosk" },
    tags: ["exterior", "travel"],
  },

  "side-street-west": {
    id: "side-street-west",
    title: "Side Street (West)",
    x: -2,
    y: 1,
    z: 0,
    exits: { s: "alley-mid", n: "laundromat-front" },
    tags: ["exterior"],
  },

  "side-street-east": {
    id: "side-street-east",
    title: "Side Street (East)",
    x: 2,
    y: 0,
    z: 0,
    exits: { w: "streetlight", n: "clinic-front", e: "clinic-front" },
    tags: ["exterior"],
  },

  "phone-booth": {
    id: "phone-booth",
    title: "Abandoned Phone Booth",
    x: 3,
    y: 2,
    z: 0,
    exits: { n: "clinic-waiting" },
    tags: ["exterior"],
  },
  "scene:unknown": {
    id: "scene:unknown",
    title: "Unknown Scene",
    x: 0,
    y: 0,
    z: 0,
    exits: {},
  }
} as const satisfies Record<string, SceneDef<string>>;


// Derived types (no circular refs)
export type SceneId = keyof typeof sceneGraph;
export type Scene = SceneDef<SceneId>;

// Helpers
export function getScene(id: SceneId): Scene {
  return sceneGraph[id] as unknown as Scene;
}

export function getExit(id: SceneId, dir: Direction): SceneId | undefined {
  return (sceneGraph[id].exits as SceneExits<SceneId>)[dir];
}

export function getExits(id: SceneId): SceneExits<SceneId> {
  return sceneGraph[id].exits as SceneExits<SceneId>;
}
