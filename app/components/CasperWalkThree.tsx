"use client";

import * as THREE from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, useTexture } from "@react-three/drei";

// ✅ CHANGE THIS PATH to wherever you saved the editor JSON:
import navmeshJson from "@/app/game/navmesh.json";

type Point = { x: number; y: number };

type Lamp = {
  /** screen-pixel coords (top-left origin) */
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
  lamp?: Lamp;

  /** Optional override navmesh (otherwise uses imported JSON) */
  navmesh?: WalkCollisionData;
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
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;

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

/** step toward dest, but refuse to move into blocked areas */
function stepWithCollision(
  from: Point,
  dest: Point,
  step: number,
  nav: WalkCollisionData,
  maxSubStep = 4 // <= smaller = more accurate, more CPU
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
    if (!isWalkable(next, nav)) {
      // blocked mid-way; stop at last valid point
      return p;
    }
    p = next;
  }

  return p;
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

  // ✅ Click-to-move in WORLD space (center-origin)
  const { camera, size } = useThree();
  const ortho = camera as THREE.OrthographicCamera;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;

      // screen -> NDC
      const xNdc = (e.clientX / size.width) * 2 - 1;
      const yNdc = -(e.clientY / size.height) * 2 + 1;

      // NDC -> world
      const w = new THREE.Vector3(xNdc, yNdc, 0).unproject(ortho);
      const dest = {
        x: w.x,
        y: w.y,
      };
      console.log("click dest", dest, {
        walkables: navWorld.walkables.length,
        colliders: navWorld.colliders.length,
        walkable: isWalkable(dest, navWorld),
      });

      // ✅ refuse targets that aren't walkable
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

        // ✅ collision-aware step
        const next = stepWithCollision(p, dest, step, navWorld);

        // blocked -> stop
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
    // ✅ put (0,0) at the FEET (bottom center)
    g.translate(0, frameH / 2, 0);
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

export default function CasperWalkerThree(props: CasperWalkerProps) {
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

  const navmesh = (props.navmesh ?? (navmeshJson as WalkCollisionData));

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
  speedPxPerSec,
  walkFps,
  frameCount,
  frameW,
  frameH,
  standingFrameIndex,
}: {
  sheetSrc: string;
  normalSrc: string;
  startScreen: Point;      // screen px
  lampScreen: Lamp;        // screen px
  navmeshScreen: WalkCollisionData; // screen px
  speedPxPerSec: number;
  walkFps: number;
  frameCount: number;
  frameW: number;
  frameH: number;
  standingFrameIndex: number;
}) {
  const { size } = useThree();

  // Convert start & lamp from screen px -> world px
  const startWorld = useMemo(
    () => screenPxToWorldPx(startScreen.x, startScreen.y, size.width, size.height),
    [startScreen, size.width, size.height]
  );

  const lampWorld = useMemo(() => {
    const p = screenPxToWorldPx(lampScreen.x, lampScreen.y, size.width, size.height);
    return { ...lampScreen, x: p.x, y: p.y };
  }, [lampScreen, size.width, size.height]);

  // ✅ Convert the entire navmesh from screen px -> world px (so collision matches Casper)
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

  return (
    <>
      <ambientLight intensity={0.12} />
      <LampLight lamp={lampWorld} />

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
