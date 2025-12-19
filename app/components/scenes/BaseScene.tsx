"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import CasperWalker from "../CasperWalker";
import { useOptions, PlayerOption } from "../OptionsContext";
import { NAVMESH_BY_SCENE } from "@/app/game/navMeshs";
import { LIGHTING_BY_SCENE } from "@/app/game/lighting";
import NavMeshEditor from "../NavMeshEditor";
import LightingEditor from "../LightingEditor";
import { useLoopState } from "../LoopStateContext";
import type { WalkCollisionData, SceneChangeZone } from "@/app/game/navMeshs/types";

type BaseSceneProps = {
  id: string;
  title: string;
  description: string[];
  background?: string;
  options: PlayerOption[];
  bgNative: { w: number; h: number };
  spriteScale?: number;
  startPosition?: { x: number; y: number }
};

export default function BaseScene({
  id,
  title,
  description,
  background,
  options,
  bgNative = { w: 1920, h: 1080 },
  spriteScale = 1,
  startPosition = { x: Math.round(bgNative.w * 0.5), y: Math.round(bgNative.h * 0.5) }
}: BaseSceneProps) {
  const { setOptions, clearOptions } = useOptions();

  const navmesh = NAVMESH_BY_SCENE[id];
  const lighting = LIGHTING_BY_SCENE[id];

  const [showNavMeshEditor, setShowNavMeshEditor] = useState(false);
  const [showLightingEditor, setShowLightingEditor] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);

  const { goToScene } = useLoopState();

  useEffect(() => {
    setOptions(options);
    return () => clearOptions();
  }, [options, setOptions, clearOptions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "1") {
        e.preventDefault();
        setShowNavMeshEditor((p) => !p);
      }
      if (e.ctrlKey && e.key === "2") {
        e.preventDefault();
        setShowLightingEditor((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Editors are global overlays; they use stageRef for correct mapping */}
      {(showNavMeshEditor || showLightingEditor) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}>
          {showNavMeshEditor && (
            <NavMeshEditor
              containerRef={stageRef}
              bgNative={bgNative}
              activeNavmesh={navmesh}
            />
          )}
          {showLightingEditor && (
            <LightingEditor 
              containerRef={stageRef} 
              bgNative={bgNative} 
              activeLighting={lighting}
              initial={lighting}
              onChange={(d) => console.log("lighting draft", d)}
            />
          )}
        </div>
      )}

      {/* Fullscreen letterbox area */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: "black",
          display: "grid",
          placeItems: "center",
        }}
      >
        {/* ✅ Stage is the true scene rect */}
        <div
          ref={stageRef}
          style={{
            position: "relative",
            width: "100vw",
            height: "100vh",
            maxWidth: "100vw",
            maxHeight: "100vh",
            aspectRatio: `${bgNative.w} / ${bgNative.h}`,
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
                imageRendering: "pixelated",
              }}
            />
          )}

          {/* ✅ CasperWalker MUST be inside the stage so it shares the exact rect */}
          {navmesh && (
            <CasperWalker
              containerRef={stageRef}
              bgNative={bgNative}
              navmesh={navmesh}
              lightingData={lighting}
              start={startPosition}
              spriteScale={spriteScale}
              onSceneChange={(targetSceneId, zoneId) => {
                goToScene(targetSceneId);
              }}
            />
          )}
        </div>

        {/* UI pinned to viewport */}
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
            zIndex: 50,
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 20 }}>{title}</h1>
          {description.map((p, i) => (
            <p key={i} style={{ margin: 0, marginTop: 8, fontSize: 15 }}>
              {p}
            </p>
          ))}
        </div>
      </section>
    </>
  );
}