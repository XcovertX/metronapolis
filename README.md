# Metronapolis

A narrative-driven interactive game built with Next.js, React, and PixiJS. Navigate through a mysterious urban environment, interact with NPCs, solve puzzles, and uncover the story through exploration and dialogue.

## Features

- **Interactive Scenes**: Explore multiple interconnected locations including apartments, streets, and alleys
- **Dynamic Lighting System**: Real-time lighting effects with normal maps for enhanced atmosphere
- **NPC Interactions**: Engage with various characters including Rhea, Malik, and others through branching dialogue
- **Navigation System**: Advanced pathfinding with custom navigation meshes
- **Time-Based Events**: Dynamic world that changes based on time progression
- **Inventory System**: Collect and use items to progress through the story
- **Examine Mode**: Investigate objects and environments for clues
- **Minimap**: Navigate the world with an interactive minimap
- **Hide Mechanics**: Stealth gameplay elements with designated hiding spots

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **Graphics**: PixiJS 8 for 2D rendering
- **3D Support**: Three.js with React Three Fiber
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript 5
- **Linting**: ESLint with Next.js config

## Project Structure

```
metronapolis/
├── app/
│   ├── components/          # React components
│   │   ├── scenes/         # Scene components (Alley, Apartment, Streets)
│   │   ├── Casper.tsx      # Player character
│   │   ├── DialogWindow.tsx
│   │   ├── ExamineWindow.tsx
│   │   ├── HUD.tsx
│   │   ├── InventoryPopup.tsx
│   │   └── ...
│   ├── dialog/             # Dialogue trees and conditions
│   ├── game/
│   │   ├── events/         # Game events and interactions
│   │   ├── items/          # Item definitions
│   │   ├── lighting/       # Lighting configurations
│   │   ├── navMeshs/       # Navigation mesh data
│   │   ├── npcs/           # NPC definitions
│   │   ├── sceneGraph.ts   # Scene connectivity
│   │   ├── timeEngine.ts   # Time management system
│   │   └── ...
│   └── map/                # Map configuration
├── public/
│   ├── assets/             # Game assets (tiles, minimap)
│   ├── rooms/              # Room backgrounds and normal maps
│   └── sprites/            # Character sprites and animations
└── ...
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/metronapolis.git
cd metronapolis
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Game Systems

### Scene Management
The game uses a graph-based scene system where locations are connected through exits. Navigate between scenes using the scene graph defined in [`sceneGraph.ts`](app/game/sceneGraph.ts).

### Dialogue System
Branching dialogue with conditional logic supports complex narrative structures. Dialogue trees are defined per character in the [`app/dialog/`](app/dialog/) directory.

### Navigation Meshes
Custom navigation meshes enable realistic pathfinding for both the player and NPCs. Edit meshes using the built-in [`NavMeshEditor`](app/components/NavMeshEditor.tsx).

### Lighting System
Dynamic lighting with normal map support creates atmospheric scenes. Configure lighting per scene in [`app/game/lighting/`](app/game/lighting/).

### Time Engine
The time system drives event scheduling and world state changes. Time rules are defined in [`timeRules.ts`](app/game/timeRules.ts).

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Debug Tools

The game includes several debug overlays:
- **Debug Overlay**: Toggle with the debug panel to view game state
- **Lighting Editor**: Adjust lighting parameters in real-time
- **NavMesh Editor**: Visualize and edit navigation meshes

## License

This project is licensed under the MIT License - see the [`LICENSE`](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
