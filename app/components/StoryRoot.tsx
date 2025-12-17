// app/components/StoryRoot.tsx
"use client";

import { useLoopState } from "./LoopStateContext";
import type { SceneId } from "../game/sceneGraph";

import HUD from "./HUD";
import DialogWindow from "./DialogWindow";
import ExamineWindow from "./ExamineWindow";
import OptionsPanel from "./OptionsPanel";
import DebugOverlay from "./DebugOverlay";

// Authored scenes
import AptBedroom from "./scenes/AptBedroom";
import StreetFront from "./scenes/StreetFront";
import StreetAlley from "./scenes/StreetAlley";
// import AptLiving from "./scenes/AptLiving";
// import Lobby from "./scenes/Lobby";
// etc — add these as you flesh them out

// Generic fallback scene
import GraphScene from "./scenes/GraphScene";
import SceneMessageOverlay from "./SceneMessageOverlay";
import CasperWalker from "./CasperWalker";
import AptLivingroom from "./scenes/AptLivingRoom";
// import WebGLStage from "./WebGLStage";
import CasperWalkerThree from "./CasperWalkThree";
import NavMeshEditor from "./NavMeshEditor";

const AUTHORED_SCENES: Partial<Record<SceneId, React.FC>> = {
  "apt-bedroom": AptBedroom,
  "street-front": StreetFront,
  "street-alley": StreetAlley,
  "apt-living": AptLivingroom,
  // "apt-living": AptLiving,
  // "lobby": Lobby,
};

export default function StoryRoot() {
  const { scene } = useLoopState();

  const SceneComponent = AUTHORED_SCENES[scene] ?? GraphScene;

  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Global overlays */}
      <HUD />
      <DebugOverlay />
      <SceneMessageOverlay />

      {/* Scene */}
      <SceneComponent />
      <CasperWalkerThree />
      <NavMeshEditor />
      
      {/* UI layers */}
      <DialogWindow />
      <ExamineWindow />

    </main>
  );
}
