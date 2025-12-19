// app/components/CasperWalker.tsx
"use client";

import * as THREE from "three";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrthographicCamera, useTexture } from "@react-three/drei";
import type { LightingData, LightDef } from "../game/lighting/lightingTypes";
import Background from "three/src/renderers/common/Background.js";

/** ----- Types ----- */
type Point = { x: number; y: number };

type Polygon = { id: string; name: string; points: Point[] };
export type WalkCollisionData = {
  version: 1;
  walkables: Polygon[];
  colliders: Polygon[];
  collisionPoints: { id: string; name: string; p: Point }[];
};

type Lamp = {
  x: number;
  y: number;
  z?: number;
  color?: string;
  intensity?: number;
  distance?: number;
  decay?: number;
};

type CasperWalkerProps = {
  containerRef: React.RefObject<HTMLElement | null>;
  bgNative: { w: number; h: number };
  navmesh: WalkCollisionData;
  lightingData?: LightingData;
  start?: Point;

  sheetSrc?: string;
  normalSrc?: string;

  speedPxPerSec?: number;
  walkFps?: number;

  frameCount?: number;
  frameW?: number;
  frameH?: number;
  standingFrameIndex?: number;

  lamp?: Lamp;
  showLightMarkers?: boolean;
  zIndex?: number;
};

/** ----- helpers ----- */
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** IMAGE-native px (top-left) -> WORLD (center origin, +Y up) */
function imgPxToWorld(p: Point, bg: { w: number; h: number }): Point {
  return { x: p.x - bg.w / 2, y: bg.h / 2 - p.y };
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

function isWalkable(pt: Point, nav: WalkCollisionData) {
  if (!isInsideAny(pt, nav.walkables)) return false;
  if (isInsideAny(pt, nav.colliders)) return false;
  return true;
}

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

/** ----- Lighting components ----- */
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

/** ----- Casper sprite ----- */
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
  setTargetRef,
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
  setTargetRef: React.MutableRefObject<((p: Point) => void) | null>;
}) {
  const [pos, setPos] = useState<Point>(startWorld);
  const [target, setTarget] = useState<Point | null>(null);
  const [frame, setFrame] = useState<number>(standingFrameIndex);
  const [facing, setFacing] = useState<1 | -1>(1);

  useEffect(() => {
    setPos((p) => (target ? p : startWorld));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWorld.x, startWorld.y]);

  useEffect(() => {
    setTargetRef.current = (dest: Point) => {
      if (!isWalkable(dest, navWorld)) return;
      setTarget(dest);
      setFrame(0);
    };
    return () => {
      setTargetRef.current = null;
    };
  }, [setTargetRef, navWorld]);

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
    <>
      <mesh ref={meshRef} geometry={geom} raycast={null as any}>
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
    </>
  );
}

/** ----- Main export ----- */
export default function CasperWalker(props: CasperWalkerProps) {
  const sheetSrc = props.sheetSrc ?? "/sprites/casper-walk.png";
  const normalSrc = props.normalSrc ?? "/sprites/casper-walk_n.png";

  const speedPxPerSec = props.speedPxPerSec ?? 260;
  const walkFps = props.walkFps ?? 12;
  const frameCount = props.frameCount ?? 8;
  const frameW = props.frameW ?? 256;
  const frameH = props.frameH ?? 256;
  const standingFrameIndex = props.standingFrameIndex ?? 7;

  const lampImg: Lamp = props.lamp ?? {
    x: Math.round(props.bgNative.w * 0.35),
    y: Math.round(props.bgNative.h * 0.25),
    z: 260,
    intensity: 10,
    distance: 1200,
    decay: 2,
    color: "#ffd28a",
  };

  const startImg = props.start ?? {
    x: Math.round(props.bgNative.w * 0.5),
    y: Math.round(props.bgNative.h * 0.55),
  };

  // ✅ Measure the stage, and drive Canvas sizing from it.
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [stagePx, setStagePx] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = props.containerRef.current;
    if (!el) return;

    const read = () => {
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      setStagePx((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };

    read();

    const ro = new ResizeObserver(read);
    ro.observe(el);

    // one extra frame after layout settles (fixes “aspectRatio just applied” cases)
    const raf = requestAnimationFrame(read);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [props.containerRef]);

  
  useEffect(() => {
    const el = props.containerRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, [props.containerRef]);

  const ready = stageSize.w > 2 && stageSize.h > 2;
  if (!ready) return null;

  // ✅ zoom computed from REAL stage pixels (not R3F's first-tick size)
  const zoom = Math.min(stageSize.w / props.bgNative.w, stageSize.h / props.bgNative.h);
  console.log("CasperWalker: stageSize=", stageSize, " zoom=", zoom, );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: props.zIndex ?? 30,
        pointerEvents: "auto",
      }}
    >
      <Canvas
        orthographic
        gl={{ antialias: false, alpha: true }}
        // ✅ force correct initial sizing (prevents the first-frame distortion)
        style={{ width: stageSize.w, height: stageSize.h}}
      >
        <OrthoBgCamera stageSize={stageSize} zoom={zoom} />

        <Scene
          bgNative={props.bgNative}
          sheetSrc={sheetSrc}
          normalSrc={normalSrc}
          startImg={startImg}
          navmeshImg={props.navmesh}
          lightingImg={props.lightingData}
          lampImg={lampImg}
          showLightMarkers={props.showLightMarkers ?? false}
          speedPxPerSec={speedPxPerSec}
          walkFps={walkFps}
          frameCount={frameCount}
          frameW={frameW}
          frameH={frameH}
          standingFrameIndex={standingFrameIndex}
        />
      </Canvas>
    </div>
  );
}

function Scene({
  bgNative,
  sheetSrc,
  normalSrc,
  startImg,
  navmeshImg,
  lightingImg,
  lampImg,
  showLightMarkers,
  speedPxPerSec,
  walkFps,
  frameCount,
  frameW,
  frameH,
  standingFrameIndex,
}: {
  bgNative: { w: number; h: number };
  sheetSrc: string;
  normalSrc: string;
  startImg: Point;
  navmeshImg: WalkCollisionData;
  lightingImg?: LightingData;
  lampImg: Lamp;
  showLightMarkers: boolean;
  speedPxPerSec: number;
  walkFps: number;
  frameCount: number;
  frameW: number;
  frameH: number;
  standingFrameIndex: number;
}) {
  const setTargetRef = useRef<((p: Point) => void) | null>(null);

  const startWorld = useMemo(() => imgPxToWorld(startImg, bgNative), [startImg, bgNative]);

  const navWorld = useMemo<WalkCollisionData>(() => {
    const convPoly = (poly: Polygon): Polygon => ({
      ...poly,
      points: poly.points.map((pt) => imgPxToWorld(pt, bgNative)),
    });

    return {
      ...navmeshImg,
      walkables: navmeshImg.walkables.map(convPoly),
      colliders: navmeshImg.colliders.map(convPoly),
      collisionPoints: navmeshImg.collisionPoints.map((cp) => ({
        ...cp,
        p: imgPxToWorld(cp.p, bgNative),
      })),
    };
  }, [navmeshImg, bgNative]);

  const lightingWorld = useMemo<LightingData | undefined>(() => {
    if (!lightingImg) return undefined;

    return {
      ...lightingImg,
      lights: lightingImg.lights.map((l) => {
        const p = imgPxToWorld({ x: l.x, y: l.y }, bgNative);
        const tgt = l.target ? imgPxToWorld(l.target, bgNative) : undefined;
        return {
          ...l,
          x: p.x,
          y: p.y,
          target: tgt ? { x: tgt.x, y: tgt.y } : undefined,
        };
      }),
    };
  }, [lightingImg, bgNative]);

  const lampWorld = useMemo(() => {
    const p = imgPxToWorld({ x: lampImg.x, y: lampImg.y }, bgNative);
    return { ...lampImg, x: p.x, y: p.y };
  }, [lampImg, bgNative]);

  return (
    <>
      {/* Click-catcher: whole image plane */}
      <mesh
        position={[0, 0, -0.01]}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          setTargetRef.current?.({ x: e.point.x, y: e.point.y });
        }}
      >
        <planeGeometry args={[bgNative.w, bgNative.h]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

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
        setTargetRef={setTargetRef}
      />
    </>
  );
}

/** Camera frustum is in BG-native units; zoom provided by stage measurement. */
function OrthoBgCamera({ stageSize, zoom }: { stageSize: { w: number; h: number }; zoom: number }) {
  const camRef = useRef<THREE.OrthographicCamera | null>(null);

  useEffect(() => {
    console.log("bgNative=", stageSize, " zoom=", zoom);
    camRef.current?.updateProjectionMatrix();
  }, [zoom, stageSize.w, stageSize.h]);

  return (
    <OrthographicCamera
      ref={camRef as any}
      makeDefault
      position={[0, 0, 1000]}
      near={-5000}
      far={5000}
      left={-stageSize.w / 2}
      right={stageSize.w / 2}
      top={stageSize.h / 2}
      bottom={-stageSize.h / 2}
      zoom={zoom}
    />
  );
}
