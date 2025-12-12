// app/components/StoryRoot.tsx
"use client";

import { useLoopState } from "./LoopStateContext";
import HUD from "./HUD";
import DialogWindow from "./DialogWindow";
import DebugOverlay from "./DebugOverlay";
import ExamineWindow from "./ExamineWindow";
import OptionsPanel from "./OptionsPanel";

import AptBedroom from "./scenes/AptBedroom";
import AptLiving from "./scenes/AptLiving";
import AptKitchen from "./scenes/AptKitchen";
import Lobby from "./scenes/Lobby";
import Street from "./scenes/Street";
import Cafe from "./scenes/Cafe";
import Alley from "./scenes/Alley";
import Transit from "./scenes/Transit";
import Rooftop from "./scenes/Rooftop";

export default function StoryRoot() {
  const { scene } = useLoopState();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "3rem 1.5rem",
        maxWidth: 720,
        margin: "0 auto",
        position: "relative",
      }}
    >
      <HUD />
      <DebugOverlay />

      {scene === "apt-bedroom" && <AptBedroom />}
      {scene === "apt-living" && <AptLiving />}
      {scene === "apt-kitchen" && <AptKitchen />}
      {scene === "lobby" && <Lobby />}
      {scene === "street" && <Street />}
      {scene === "cafe" && <Cafe />}
      {scene === "alley" && <Alley />}
      {scene === "transit" && <Transit />}
      {scene === "rooftop" && <Rooftop />}

      <DialogWindow />
      <ExamineWindow />
      <OptionsPanel />
    </main>
  );
}
