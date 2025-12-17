// app/components/CasperWalker.tsx
"use client";

import * as THREE from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, useTexture } from "@react-three/drei";
import type { LightingData, LightDef } from "../game/lighting/lightingTypes";

// ✅ CHANGE THIS PATH to wherever you saved the editor JSON:
import navmeshJson from "@/app/game/navMeshs/navmesh.json";

type Point = { x: number; y: number };

type Lamp = {
  x: number;
  y: number;
  z?: number;
  color?: string;
  intensity?: number;
  distance?: number;
  decay?: number;
};

type Polygon = { id: string; name: string; points: Point[] };
type WalkCollisionData = {
  version: 1;
  walkables: Polygon[];
  colliders: Polygon[];
  collisionPoints: { id: string; name: string; p: Point }[];
};

type CasperWalkerProps = {
  sheetSrc?: string;
  normalSrc?: string;

  /**
   * ✅ This is now your *design-space* start, in px of the reference scene size.
   * (Top-left origin, like your editor.)
   */
  containerStart?: Point;

  /**
   * ✅ Design/reference size (the pixel size your navmesh + lighting were authored in).
   * If omitted, defaults to 1920x1080.
   *
   * Tip: set this to your background image size / editor canvas size.
   */
  containerDimensions?: { width: number; height: number };

  speedPxPerSec?: number;
  walkFps?: number;
  frameCount?: number;
  frameW?: number;
  frameH?: number;
  standingFrameIndex?: number;

  /**
   * ✅ Design-space landing spot (same coordinate system as editor)
   */
  landingSpot?: Point;

  /** Legacy single lamp (optional fallback) */
  lamp?: Lamp;

  /** ✅ Scene lighting authored by your LightingEditor (design px, top-left origin) */
  lightingData?: LightingData;

  /** Optional override navmesh (otherwise uses imported JSON) */
  navmesh?: WalkCollisionData;

  /** Debug: render bulb markers for each light */
  showLightMarkers?: boolean;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/**
 * ✅ Convert DESIGN screen px (top-left) -> WORLD px (center origin)
 * using the fixed design/reference dimensions, NOT the live canvas size.
 */
function designPxToWorldPx(sx: number, sy: number, designW: number, designH: number) {
  return { x: sx - designW / 2, y: designH / 2 - sy };
}

/** point-in-polygon (ray cast) */
function pointInPoly(pt: Point, poly: Point[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;

    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

function isInsideAny(pt: Point, polys: Polygon[]) {
  for (const p of polys) {
    if (p.points.length >= 3 && pointInPoly(pt, p.points)) return true;
  }
  return false;
}

/**
 * Walkable rule:
 * - inside at least one walkable polygon
 * - NOT inside any collider polygon
 */
function isWalkable(pt: Point, nav: WalkCollisionData) {
  if (!isInsideAny(pt, nav.walkables)) return false;
  if (isInsideAny(pt, nav.colliders)) return false;
  return true;
}

/** step toward dest, but refuse to move into blocked areas (sub-stepped) */
function stepWithCollision(
  from: Point,
  dest: Point,
  step: number,
  nav: WalkCollisionData,
  maxSubStep = 4
): Point {
  const dx = dest.x - from.x;
  const dy = dest.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return from;

  const total = Math.min(step, dist);
  const n = Math.max(1, Math.ceil(total / maxSubStep));
  const sx = (dx / dist) * (total / n);
  const sy = (dy / dist) * (total / n);

  let p = { ...from };

  for (let i = 0; i < n; i++) {
    const next = { x: p.x + sx, y: p.y + sy };
    if (!isWalkable(next, nav)) return p;
    p = next;
  }

  return p;
}

/** Legacy single-lamp helper (optional) */
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
        <meshStandardMaterial
          emissive={new THREE.Color(color)}
          emissiveIntensity={2.5}
          color={"#111111"}
          roughness={1}
          metalness={0}
        />
      </mesh>
      <pointLight color={color} intensity={intensity} distance={distance} decay={decay} />
    </group>
  );
}

/** ✅ Proper spotlight target handling */
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
  const spotRef = useRef<THREE.SpotLight>(null);
  const targetObj = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!spotRef.current) return;
    spotRef.current.target = targetObj;
    return () => {
      if (spotRef.current) spotRef.current.target = new THREE.Object3D();
    };
  }, [targetObj]);

  useEffect(() => {
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

/** ✅ Scene lighting from LightingData in WORLD space */
function SceneLighting({
  lightingWorld,
  showMarkers,
}: {
  lightingWorld?: LightingData;
  showMarkers: boolean;
}) {
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
            <pointLight
              position={pos}
              color={color}
              intensity={l.intensity}
              distance={l.distance}
              decay={l.decay}
            />
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

function CasperSprite({
  sheetSrc,
  normalSrc,
  startWorld,
  speedPxPerSec,
  walkFps,
  frameCount,
  frameW,
  frameH,
  standingFrameIndex,
  navWorld,
  landingWorld,
}: {
  sheetSrc: string;
  normalSrc: string;
  startWorld: Point;
  speedPxPerSec: number;
  walkFps: number;
  frameCount: number;
  frameW: number;
  frameH: number;
  standingFrameIndex: number;
  navWorld: WalkCollisionData;
  landingWorld?: Point | null;
}) {
  const [pos, setPos] = useState<Point>(startWorld);
  const [target, setTarget] = useState<Point | null>(null);
  const [frame, setFrame] = useState<number>(standingFrameIndex);
  const [facing, setFacing] = useState<1 | -1>(1);

  const meshRef = useRef<THREE.Mesh>(null);
  const [diffuse, normal] = useTexture([sheetSrc, normalSrc]);

  useMemo(() => {
    diffuse.magFilter = THREE.NearestFilter;
    diffuse.minFilter = THREE.NearestFilter;
    diffuse.generateMipmaps = false;

    normal.magFilter = THREE.NearestFilter;
    normal.minFilter = THREE.NearestFilter;
    normal.generateMipmaps = false;

    diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
    normal.wrapS = normal.wrapT = THREE.RepeatWrapping;

    diffuse.repeat.set(1 / frameCount, 1);
    normal.repeat.set(1 / frameCount, 1);

    diffuse.needsUpdate = true;
    normal.needsUpdate = true;
  }, [diffuse, normal, frameCount]);

  const { camera, size } = useThree();
  const ortho = camera as THREE.OrthographicCamera;

  // ✅ Click -> world uses the camera; world units are now DESIGN-locked via camera frustum + zoom.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const xNdc = (e.clientX / size.width) * 2 - 1;
      const yNdc = -(e.clientY / size.height) * 2 + 1;

      const w = new THREE.Vector3(xNdc, yNdc, 0).unproject(ortho);
      const dest = { x: w.x, y: w.y };

      if (!isWalkable(dest, navWorld)) return;

      setTarget(dest);
      setFrame(0);
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [ortho, size.width, size.height, navWorld]);

  useEffect(() => {
    if (!landingWorld) return;
    setTarget(null);
    setPos(landingWorld);
    setFrame(standingFrameIndex);

    if (meshRef.current) {
      meshRef.current.position.set(landingWorld.x, landingWorld.y, 0);
    }
  }, [landingWorld?.x, landingWorld?.y, standingFrameIndex]);

  const lastTRef = useRef<number>(0);
  const animAccRef = useRef<number>(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const last = lastTRef.current || t;
    const dt = clamp(t - last, 0, 0.05);
    lastTRef.current = t;

    const walking = !!target;

    if (!walking) {
      if (frame !== standingFrameIndex) setFrame(standingFrameIndex);
    } else {
      setPos((p) => {
        const dest = target!;
        const dx = dest.x - p.x;
        const dy = dest.y - p.y;

        if (Math.abs(dx) > 2) setFacing(dx >= 0 ? 1 : -1);

        const dist = Math.hypot(dx, dy);
        const stopDist = 2;

        if (dist <= stopDist) {
          setTarget(null);
          setFrame(standingFrameIndex);
          return dest;
        }

        const step = speedPxPerSec * dt;
        const next = stepWithCollision(p, dest, step, navWorld);

        if (next.x === p.x && next.y === p.y) {
          setTarget(null);
          setFrame(standingFrameIndex);
          return p;
        }

        return next;
      });

      animAccRef.current += dt;
      const frameInterval = 1 / walkFps;

      if (animAccRef.current >= frameInterval) {
        animAccRef.current -= frameInterval;
        setFrame((f) => {
          const walkMax = Math.max(0, standingFrameIndex - 1);
          return (f + 1) % (walkMax + 1);
        });
      }
    }

    if (meshRef.current) {
      meshRef.current.position.set(pos.x, pos.y, 0);
      meshRef.current.scale.set(facing, 1, 1);

      diffuse.offset.x = frame / frameCount;
      normal.offset.x = frame / frameCount;
    }
  });

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(frameW, frameH);
    g.translate(0, frameH / 2, 0); // pivot at feet
    return g;
  }, [frameW, frameH]);

  return (
    <mesh ref={meshRef} geometry={geom}>
      <meshStandardMaterial
        map={diffuse}
        normalMap={normal}
        transparent
        roughness={0.85}
        metalness={0.0}
        emissive={"#000000"}
        emissiveIntensity={0.0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function CasperWalker(props: CasperWalkerProps) {
  const sheetSrc = props.sheetSrc ?? "/sprites/casper-walk.png";
  const normalSrc = props.normalSrc ?? "/sprites/casper-walk_n.png";

  // ✅ DESIGN SIZE (reference space)
  const designW = props.containerDimensions?.width ?? 1920;
  const designH = props.containerDimensions?.height ?? 1080;

  const lampInDesign: Lamp = props.lamp ?? {
    x: 520,
    y: 260,
    z: 260,
    intensity: 10,
    distance: 1200,
    decay: 2,
    color: "#ffd28a",
  };

  const navmesh = props.navmesh ?? (navmeshJson as WalkCollisionData);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 30, pointerEvents: "none" }}>
      <Canvas orthographic gl={{ antialias: false, alpha: true }}>
        <OrthoDesignCamera designW={designW} designH={designH} />
        <Scene
          sheetSrc={sheetSrc}
          normalSrc={normalSrc}
          designW={designW}
          designH={designH}
          startDesign={props.containerStart ?? { x: 1280, y: 520 }}
          landingDesign={props.landingSpot}
          lampDesign={lampInDesign}
          navmeshDesign={navmesh}
          lightingDesign={props.lightingData}
          showLightMarkers={props.showLightMarkers ?? false}
          speedPxPerSec={props.speedPxPerSec ?? 260}
          walkFps={props.walkFps ?? 12}
          frameCount={props.frameCount ?? 8}
          frameW={props.frameW ?? 256}
          frameH={props.frameH ?? 256}
          standingFrameIndex={props.standingFrameIndex ?? 7}
        />
      </Canvas>
    </div>
  );
}

function Scene({
  sheetSrc,
  normalSrc,
  designW,
  designH,
  startDesign,
  landingDesign,
  lampDesign,
  navmeshDesign,
  lightingDesign,
  showLightMarkers,
  speedPxPerSec,
  walkFps,
  frameCount,
  frameW,
  frameH,
  standingFrameIndex,
}: {
  sheetSrc: string;
  normalSrc: string;
  designW: number;
  designH: number;
  startDesign: Point;
  landingDesign?: Point;
  lampDesign: Lamp;
  navmeshDesign: WalkCollisionData;
  lightingDesign?: LightingData;
  showLightMarkers: boolean;
  speedPxPerSec: number;
  walkFps: number;
  frameCount: number;
  frameW: number;
  frameH: number;
  standingFrameIndex: number;
}) {
  const startWorld = useMemo(
    () => designPxToWorldPx(startDesign.x, startDesign.y, designW, designH),
    [startDesign, designW, designH]
  );

  const lampWorld = useMemo(() => {
    const p = designPxToWorldPx(lampDesign.x, lampDesign.y, designW, designH);
    return { ...lampDesign, x: p.x, y: p.y };
  }, [lampDesign, designW, designH]);

  const landingWorld = useMemo(() => {
    if (!landingDesign) return null;
    return designPxToWorldPx(landingDesign.x, landingDesign.y, designW, designH);
  }, [landingDesign, designW, designH]);

  const navWorld = useMemo<WalkCollisionData>(() => {
    const convPoly = (poly: Polygon): Polygon => ({
      ...poly,
      points: poly.points.map((pt) => designPxToWorldPx(pt.x, pt.y, designW, designH)),
    });

    return {
      ...navmeshDesign,
      walkables: navmeshDesign.walkables.map(convPoly),
      colliders: navmeshDesign.colliders.map(convPoly),
      collisionPoints: navmeshDesign.collisionPoints.map((cp) => ({
        ...cp,
        p: designPxToWorldPx(cp.p.x, cp.p.y, designW, designH),
      })),
    };
  }, [navmeshDesign, designW, designH]);

  const lightingWorld = useMemo<LightingData | undefined>(() => {
    if (!lightingDesign) return undefined;

    return {
      ...lightingDesign,
      rooms: lightingDesign.rooms.map((r) => {
        const p = designPxToWorldPx(r.x, r.y, designW, designH);
        return { ...r, x: p.x, y: p.y, w: r.w, h: r.h };
      }),
      lights: lightingDesign.lights.map((l) => {
        const p = designPxToWorldPx(l.x, l.y, designW, designH);
        const tgt = l.target
          ? designPxToWorldPx(l.target.x, l.target.y, designW, designH)
          : undefined;

        return {
          ...l,
          x: p.x,
          y: p.y,
          target: tgt ? { x: tgt.x, y: tgt.y } : undefined,
        };
      }),
    };
  }, [lightingDesign, designW, designH]);

  return (
    <>
      {lightingWorld ? (
        <SceneLighting lightingWorld={lightingWorld} showMarkers={showLightMarkers} />
      ) : (
        <>
          <ambientLight intensity={0.12} />
          <LampLight lamp={lampWorld} />
        </>
      )}

      <CasperSprite
        sheetSrc={sheetSrc}
        normalSrc={normalSrc}
        startWorld={startWorld}
        speedPxPerSec={speedPxPerSec}
        walkFps={walkFps}
        frameCount={frameCount}
        frameW={frameW}
        frameH={frameH}
        standingFrameIndex={standingFrameIndex}
        navWorld={navWorld}
        landingWorld={landingWorld}
      />
    </>
  );
}

/**
 * ✅ The magic:
 * - Fixed design frustum (designW/designH)
 * - Zoom scales uniformly to "contain" inside the live canvas
 * Result: world coordinates remain stable; only visual scale changes.
 */
function OrthoDesignCamera({ designW, designH }: { designW: number; designH: number }) {
  const { size } = useThree();

  // contain scale: fit whole design space inside current canvas
  const zoom = useMemo(() => {
    const sx = size.width / designW;
    const sy = size.height / designH;
    return Math.min(sx, sy);
  }, [size.width, size.height, designW, designH]);

  return (
    <OrthographicCamera
      makeDefault
      position={[0, 0, 1000]}
      near={-2000}
      far={2000}
      left={-designW / 2}
      right={designW / 2}
      top={designH / 2}
      bottom={-designH / 2}
      zoom={zoom}
    />
  );
}
