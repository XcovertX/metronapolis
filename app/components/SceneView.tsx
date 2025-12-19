"use client";

import * as THREE from "three";
import React, { createContext, useContext, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import type { LightingData, LightDef } from "../game/lighting/lightingTypes";
import type { WalkCollisionData } from "../game/navMeshs/types";
import type { SceneId } from "../game/sceneGraph";

/** ----- Types ----- */
export type Point = { x: number; y: number };
export type Polygon = { id: string; name: string; points: Point[] };

export type SceneChangeZone = {
  id: string;
  name: string;
  points: Point[];
  targetSceneId: SceneId;
};

export type Lamp = {
  x: number;
  y: number;
  z?: number;
  color?: string;
  intensity?: number;
  distance?: number;
  decay?: number;
};

export type SceneViewProps = {
  containerRef: React.RefObject<HTMLElement | null>;
  bgNative: { w: number; h: number };
  navmesh: WalkCollisionData;
  lightingData?: LightingData;
  lamp?: Lamp;
  showLightMarkers?: boolean;
  zIndex?: number;
  onWorldClick?: (pWorld: Point) => void;
  children?: React.ReactNode;
};

/** IMAGE-native px (top-left) -> WORLD (center origin, +Y up) */
export function imgPxToWorld(p: Point, bg: { w: number; h: number }): Point {
  return { x: p.x - bg.w / 2, y: bg.h / 2 - p.y };
}

/** ----- Scene Context ----- */
type SceneCtx = {
  bgNative: { w: number; h: number };
  zoom: number;
  stageSize: { w: number; h: number };

  navWorld: WalkCollisionData;
  lightingWorld?: LightingData;

  moveTarget: Point | null;
  setMoveTarget: (p: Point | null) => void;

  lastWorldClick: Point | null;
  setLastWorldClick: (p: Point | null) => void;
};

const SceneContext = createContext<SceneCtx | null>(null);

export function useScene() {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene() must be used inside <SceneView/>");
  return ctx;
}

/** ----- Lighting ----- */
function SpotLightWithTarget({
  light,
  position,
  target,
  showMarker,
}: {
  light: LightDef;
  position: [number, number, number];
  target: [number, number, number];
  showMarker: boolean;
}) {
  const spotRef = React.useRef<THREE.SpotLight>(null);
  const targetObj = React.useMemo(() => new THREE.Object3D(), []);

  React.useEffect(() => {
    if (!spotRef.current) return;
    spotRef.current.target = targetObj;
    return () => {
      if (spotRef.current) spotRef.current.target = new THREE.Object3D();
    };
  }, [targetObj]);

  React.useEffect(() => {
    targetObj.position.set(target[0], target[1], target[2]);
  }, [target, targetObj]);

  const color = new THREE.Color(light.color);
  const angle = THREE.MathUtils.degToRad(light.angleDeg ?? 35);
  const penumbra = light.penumbra ?? 0.25;

  return (
    <>
      <primitive object={targetObj} />
      <spotLight
        ref={spotRef}
        position={position}
        color={color}
        intensity={light.intensity}
        distance={light.distance}
        decay={light.decay}
        angle={angle}
        penumbra={penumbra}
      />
      {showMarker && (
        <mesh position={position}>
          <sphereGeometry args={[8, 16, 16]} />
          <meshStandardMaterial emissive={color} emissiveIntensity={2} color={"#111"} />
        </mesh>
      )}
    </>
  );
}

function SceneLighting({ lightingWorld, showMarkers }: { lightingWorld?: LightingData; showMarkers: boolean }) {
  if (!lightingWorld) return null;

  const ambEnabled = lightingWorld.ambient?.enabled ?? true;
  const ambIntensity = ambEnabled ? lightingWorld.ambient?.intensity ?? 0.12 : 0;
  const ambColor = lightingWorld.ambient?.color ?? "#ffffff";

  return (
    <>
      <ambientLight color={ambColor} intensity={ambIntensity} />
      {lightingWorld.lights.map((l) => {
        if (!l.enabled) return null;

        const pos: [number, number, number] = [l.x, l.y, l.z];
        const color = new THREE.Color(l.color);

        if (l.type === "spot") {
          const t = l.target ? [l.target.x, l.target.y, 0] : [l.x, l.y - 200, 0];
          return (
            <SpotLightWithTarget
              key={l.id}
              light={l}
              position={pos}
              target={t as [number, number, number]}
              showMarker={showMarkers}
            />
          );
        }

        return (
          <React.Fragment key={l.id}>
            <pointLight position={pos} color={color} intensity={l.intensity} distance={l.distance} decay={l.decay} />
            {showMarkers && (
              <mesh position={pos}>
                <sphereGeometry args={[8, 16, 16]} />
                <meshStandardMaterial emissive={color} emissiveIntensity={2} color={"#111"} />
              </mesh>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

function LampLight({ lamp }: { lamp: Lamp }) {
  const color = lamp.color ?? "#ffd28a";
  const intensity = lamp.intensity ?? 2.2;
  const distance = lamp.distance ?? 900;
  const decay = lamp.decay ?? 2;
  const z = lamp.z ?? 220;

  return (
    <group position={[lamp.x, lamp.y, z]}>
      <mesh>
        <sphereGeometry args={[10, 16, 16]} />
        <meshStandardMaterial emissive={new THREE.Color(color)} emissiveIntensity={2.5} color={"#111"} />
      </mesh>
      <pointLight color={color} intensity={intensity} distance={distance} decay={decay} />
    </group>
  );
}

/** ----- Camera that uses R3F size (no ResizeObserver) ----- */
function OrthoBgCameraAuto({ bgNative }: { bgNative: { w: number; h: number } }) {
  const { size } = useThree();
  const w = Math.max(1, size.width);
  const h = Math.max(1, size.height);

  // fit BG-native into stage px
  const zoom = Math.min(w / bgNative.w, h / bgNative.h);

  return (
    <OrthographicCamera
      makeDefault
      position={[0, 0, 1000]}
      near={-5000}
      far={5000}
      left={-w / 2}
      right={w / 2}
      top={h / 2}
      bottom={-h / 2}
      zoom={zoom}
    />
  );
}

/** ----- Main ----- */
export default function SceneView(props: SceneViewProps) {
  // convert navmesh to world once
  const navWorld = useMemo<WalkCollisionData>(() => {
    const convPoly = (poly: Polygon): Polygon => ({
      ...poly,
      points: poly.points.map((pt) => imgPxToWorld(pt, props.bgNative)),
    });

    const nm: any = props.navmesh;

    return {
      ...props.navmesh,
      walkables: props.navmesh.walkables.map(convPoly),
      colliders: props.navmesh.colliders.map(convPoly),
      collisionPoints: props.navmesh.collisionPoints.map((cp: any) => ({
        ...cp,
        p: imgPxToWorld(cp.p, props.bgNative),
      })),
      sceneChangeZones: (nm.sceneChangeZones ?? []).map((z: any) => ({
        ...z,
        points: z.points.map((pt: Point) => imgPxToWorld(pt, props.bgNative)),
      })),
    };
  }, [props.navmesh, props.bgNative]);

  const lightingWorld = useMemo<LightingData | undefined>(() => {
    if (!props.lightingData) return undefined;

    return {
      ...props.lightingData,
      lights: props.lightingData.lights.map((l) => {
        const p = imgPxToWorld({ x: l.x, y: l.y } as any, props.bgNative);
        const tgt = l.target ? imgPxToWorld(l.target as any, props.bgNative) : undefined;
        return {
          ...l,
          x: p.x,
          y: p.y,
          target: tgt ? { x: tgt.x, y: tgt.y } : undefined,
        };
      }),
    };
  }, [props.lightingData, props.bgNative]);

  const lampImg: Lamp = props.lamp ?? {
    x: Math.round(props.bgNative.w * 0.35),
    y: Math.round(props.bgNative.h * 0.25),
    z: 260,
    intensity: 10,
    distance: 1200,
    decay: 2,
    color: "#ffd28a",
  };

  const lampWorld = useMemo(() => {
    const p = imgPxToWorld({ x: lampImg.x, y: lampImg.y }, props.bgNative);
    return { ...lampImg, x: p.x, y: p.y };
  }, [lampImg, props.bgNative]);

  const [moveTarget, setMoveTarget] = useState<Point | null>(null);
  const [lastWorldClick, setLastWorldClick] = useState<Point | null>(null);

  // zoom + stageSize come from R3F size now, but we still expose them in context.
  // We set placeholder values here; they’re overwritten in a small inner component.
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 1, h: 1 });
  const [zoom, setZoom] = useState<number>(1);

  const ctx: SceneCtx = useMemo(
    () => ({
      bgNative: props.bgNative,
      zoom,
      stageSize,
      navWorld,
      lightingWorld,
      moveTarget,
      setMoveTarget,
      lastWorldClick,
      setLastWorldClick,
    }),
    [props.bgNative, zoom, stageSize, navWorld, lightingWorld, moveTarget, lastWorldClick]
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        zIndex: props.zIndex ?? 30,
        pointerEvents: "auto",
      }}
    >
      <Canvas orthographic gl={{ antialias: false, alpha: true }} style={{ position: "absolute", inset: 0 }}>
        {/* Update stageSize/zoom from R3F size */}
        <SceneSizeReporter bgNative={props.bgNative} setStageSize={setStageSize} setZoom={setZoom} />

        <OrthoBgCameraAuto bgNative={props.bgNative} />

        <SceneContext.Provider value={ctx}>
          {/* Click-catcher */}
          <mesh
            position={[0, 0, -0.01]}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation();

              const p = { x: e.point.x, y: e.point.y };
              setLastWorldClick(p);
              props.onWorldClick?.(p);

              // default click-to-move
              setMoveTarget(p);
            }}
          >
            <planeGeometry args={[props.bgNative.w, props.bgNative.h]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          {/* DEBUG: uncomment if you want a guaranteed visible cube */}
          {/* <mesh position={[0, 0, 20]}><boxGeometry args={[80,80,80]} /><meshBasicMaterial /></mesh> */}

          {lightingWorld ? (
            <SceneLighting lightingWorld={lightingWorld} showMarkers={props.showLightMarkers ?? false} />
          ) : (
            <>
              <ambientLight intensity={0.12} />
              <LampLight lamp={lampWorld} />
            </>
          )}

          {props.children}
        </SceneContext.Provider>
      </Canvas>
    </div>
  );
}

function SceneSizeReporter({
  bgNative,
  setStageSize,
  setZoom,
}: {
  bgNative: { w: number; h: number };
  setStageSize: (s: { w: number; h: number }) => void;
  setZoom: (z: number) => void;
}) {
  const { size } = useThree();

  React.useEffect(() => {
    const w = Math.max(1, size.width);
    const h = Math.max(1, size.height);
    setStageSize({ w, h });
    setZoom(Math.min(w / bgNative.w, h / bgNative.h));
  }, [size.width, size.height, bgNative.w, bgNative.h, setStageSize, setZoom]);

  return null;
}
