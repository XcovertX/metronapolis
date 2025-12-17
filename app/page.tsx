// app/page.tsx
// app/page.tsx
"use client";

import { LoopStateProvider } from "./components/LoopStateContext";
import { DialogProvider } from "./components/DialogContext";
import { ExamineProvider } from "./components/ExamineContext";
import { OptionsProvider } from "./components/OptionsContext";
import StoryRoot from "./components/StoryRoot";
import { dialogNodes } from "./game/events"; // ✅ use merged event nodes
import { ExamineModeProvider } from "./components/ExamineModeContext";
import { InteractionModeProvider } from "./components/InteractionModeContext";

import NavMeshEditor from "./components/NavMeshEditor";
import LightingEditor from "./components/LightingEditor";
import React, { useEffect, useState } from "react";

export default function Page() {
  const [showNavMeshEditor, setShowNavMeshEditor] = useState(false);
  const [showLightingEditor, setShowLightingEditor] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+1 toggles NavMeshEditor
      if (e.ctrlKey && e.key === "1") {
        e.preventDefault();
        setShowNavMeshEditor((prev) => !prev);
      }
      // Ctrl+2 toggles LightingEditor
      if (e.ctrlKey && e.key === "2") {
        e.preventDefault();
        setShowLightingEditor((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <LoopStateProvider>
        <ExamineModeProvider>
          <DialogProvider nodes={dialogNodes}>
            <ExamineProvider>
              <InteractionModeProvider>
                <OptionsProvider>
                  <StoryRoot />
                </OptionsProvider>
              </InteractionModeProvider>
            </ExamineProvider>
          </DialogProvider>
        </ExamineModeProvider>
      </LoopStateProvider>
      {(showNavMeshEditor || showLightingEditor) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {showNavMeshEditor && <NavMeshEditor />}
          {showLightingEditor && <LightingEditor />}
        </div>
      )}
    </>
  );
}