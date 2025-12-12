// app/components/StoryRoot.tsx
"use client";

import { useLoopState } from "./LoopStateContext";
import HUD from "./HUD";
import DialogWindow from "./DialogWindow";
import DebugOverlay from "./DebugOverlay"; 

import StaticCorner from "./scenes/StaticCorner";
import ShopFront from "./scenes/ShopFront";
import BoyStreet from "./scenes/BoyStreet";
import DeathReset from "./scenes/DeathReset";

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
      {/* The HUD stays on top always */}
      <HUD />
      <DebugOverlay />

      {/* Render the active scene */}
      {scene === "static-corner" && <StaticCorner />}
      {scene === "shop-front" && <ShopFront />}
      {scene === "boy-street" && <BoyStreet />}
      {scene === "death-reset" && <DeathReset />}

      {/* ☕ IMPORTANT: DialogWindow overlays ABOVE scenes */}
      <DialogWindow />
    </main>
  );
}
