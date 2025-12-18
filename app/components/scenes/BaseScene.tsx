"use client";

import Image from "next/image";
import { useLoopState } from "../LoopStateContext";
import { useOptions, PlayerOption } from "../OptionsContext";
import CasperWalker from "../CasperWalker";
import { useState, useEffect } from "react";
import { NAVMESH_BY_SCENE } from "@/app/game/navMeshs";
import { LIGHTING_BY_SCENE } from "@/app/game/lighting";
import LightingDebugOverlay from "../LightingDebugOverlay";
import NavMeshEditor from "../NavMeshEditor";
import LightingEditor from "../LightingEditor";

type BaseSceneProps = {
  id: string;
  title: string;
  description: string[];
  background?: string; // path to pixel art
  options: PlayerOption[];
};

export default function BaseScene({
  id,
  title,
  description,
  background,
  options
}: BaseSceneProps) {

  const { setOptions, clearOptions } = useOptions();

  const navmesh = NAVMESH_BY_SCENE[id];
  const lighting = LIGHTING_BY_SCENE[id];

  const [showLightingDebug, setShowLightingDebug] = useState(false);
  const [showNavMeshEditor, setShowNavMeshEditor] = useState(false);
  const [showLightingEditor, setShowLightingEditor] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+L toggles LightingDebugOverlay
      if (e.ctrlKey && e.key.toLowerCase() === "3") {
        e.preventDefault();
        setShowLightingDebug((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setOptions(options);
    return () => clearOptions();
  }, [options, setOptions, clearOptions]);

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
      {navmesh && <CasperWalker navmesh={navmesh} lightingData={lighting} />}
      {showLightingDebug && <LightingDebugOverlay lightingData={lighting} />}
      {(showNavMeshEditor || showLightingEditor) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {showNavMeshEditor && <NavMeshEditor activeNavmesh={navmesh}/>}
          {showLightingEditor && <LightingEditor />}
        </div>
      )}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {background && (
          <Image
            src={background}
            alt={title}
            fill
            priority
            style={{
              objectFit: "contain",
              backgroundColor: "black",
              imageRendering: "pixelated",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            width: 340,
            background: "rgba(0,0,0,0.55)",
            padding: "1rem 1.25rem",
            borderRadius: 8,
            border: "1px solid rgba(0,255,255,0.3)",
            backdropFilter: "blur(3px)",
            color: "#f5f5f5",
            fontFamily: "system-ui, sans-serif",
            boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 20 }}>{title}</h1>
          {description.map((p, i) => (
            <p key={i} style={{ margin: 0, marginTop: 8, fontSize: 15 }}>{p}</p>
          ))}
        </div>
      </section>
    </>
  );
}
