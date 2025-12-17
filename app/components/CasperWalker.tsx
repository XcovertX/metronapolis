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
  start?: Point; // screen px (top-left origin)
  speedPxPerSec?: number;
  walkFps?: number;
  frameCount?: number;
  frameW?: number;
  frameH?: number;
  standingFrameIndex?: number;

  /** Legacy single lamp (optional fallback) */
  lamp?: Lamp;

  /** ✅ Scene lighting authored by your LightingEditor (screen px, top-left origin) */
  lightingData?: LightingData;

  /** Optional override navmesh (otherwise uses imported JSON) */
  navmesh?: WalkCollisionData;

  /** Debug: render bulb markers for each light */
  showLightMarkers?: boolean;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function screenPxToWorldPx(sx: number, sy: number, w: number, h: number) {
  return { x: sx - w / 2, y: h / 2 - sy };
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
      // detach on unmount
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

        // point light
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

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const xNdc = (e.clientX / size.width) * 2 - 1;
      const yNdc = -(e.clientY / size.height) * 2 + 1;

      const w = new THREE.Vector3(xNdc, yNdc, 0).unproject(ortho);
      const dest = { x: w.x, y: w.y };

      // refuse targets not walkable
      if (!isWalkable(dest, navWorld)) return;

      setTarget(dest);
      setFrame(0);
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [ortho, size.width, size.height, navWorld]);

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

  const lampInScreen: Lamp = props.lamp ?? {
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
        <OrthoPixelCamera />
        <Scene
          sheetSrc={sheetSrc}
          normalSrc={normalSrc}
          startScreen={props.start ?? { x: 1280, y: 520 }}
          lampScreen={lampInScreen}
          navmeshScreen={navmesh}
          lightingScreen={props.lightingData}
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
  startScreen,
  lampScreen,
  navmeshScreen,
  lightingScreen,
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
  startScreen: Point;
  lampScreen: Lamp;
  navmeshScreen: WalkCollisionData;
  lightingScreen?: LightingData;
  showLightMarkers: boolean;
  speedPxPerSec: number;
  walkFps: number;
  frameCount: number;
  frameW: number;
  frameH: number;
  standingFrameIndex: number;
}) {
  const { size } = useThree();
  

  const startWorld = useMemo(
    () => screenPxToWorldPx(startScreen.x, startScreen.y, size.width, size.height),
    [startScreen, size.width, size.height]
  );

  const lampWorld = useMemo(() => {
    const p = screenPxToWorldPx(lampScreen.x, lampScreen.y, size.width, size.height);
    return { ...lampScreen, x: p.x, y: p.y };
  }, [lampScreen, size.width, size.height]);

  const navWorld = useMemo<WalkCollisionData>(() => {
    const convPoly = (poly: Polygon): Polygon => ({
      ...poly,
      points: poly.points.map((pt) => screenPxToWorldPx(pt.x, pt.y, size.width, size.height)),
    });

    return {
      ...navmeshScreen,
      walkables: navmeshScreen.walkables.map(convPoly),
      colliders: navmeshScreen.colliders.map(convPoly),
      collisionPoints: navmeshScreen.collisionPoints.map((cp) => ({
        ...cp,
        p: screenPxToWorldPx(cp.p.x, cp.p.y, size.width, size.height),
      })),
    };
  }, [navmeshScreen, size.width, size.height]);

  // ✅ Convert lighting from screen px -> world px
  const lightingWorld = useMemo<LightingData | undefined>(() => {
    if (!lightingScreen) return undefined;

    return {
      ...lightingScreen,
      rooms: lightingScreen.rooms.map((r) => ({
        ...r,
        // rooms are only for organization; keep in screen-space if you want
        // but we’ll convert anyway in case you draw them as overlays later
        x: screenPxToWorldPx(r.x, r.y, size.width, size.height).x,
        y: screenPxToWorldPx(r.x, r.y, size.width, size.height).y,
        w: r.w,
        h: r.h,
      })),
      lights: lightingScreen.lights.map((l) => {
        const p = screenPxToWorldPx(l.x, l.y, size.width, size.height);
        const tgt = l.target
          ? screenPxToWorldPx(l.target.x, l.target.y, size.width, size.height)
          : undefined;

        return {
          ...l,
          x: p.x,
          y: p.y,
          target: tgt ? { x: tgt.x, y: tgt.y } : undefined,
        };
      }),
    };
  }, [lightingScreen, size.width, size.height]);

  console.log("lightingWorld?", !!lightingWorld, lightingWorld?.lights?.length);

  return (
    <>
      {/* ✅ Prefer lightingData; fallback to your old single-lamp + ambient */}
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
      />
    </>
  );
}

function OrthoPixelCamera() {
  const { size } = useThree();
  return (
    <OrthographicCamera
      makeDefault
      position={[0, 0, 1000]}
      near={-2000}
      far={2000}
      left={-size.width / 2}
      right={size.width / 2}
      top={size.height / 2}
      bottom={-size.height / 2}
      zoom={1}
    />
  );
}
