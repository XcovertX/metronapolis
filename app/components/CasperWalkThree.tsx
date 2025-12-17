"use client";

import * as THREE from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, useTexture } from "@react-three/drei";

type Point = { x: number; y: number };

type Lamp = {
  /** screen-pixel/world-pixel coords, same space as Casper clicks */
  x: number;
  y: number;
  /** optional height out of the screen */
  z?: number;

  color?: string;        // default "#ffd28a"
  intensity?: number;    // default 2.2
  distance?: number;     // default 900
  decay?: number;        // default 2
};

type CasperWalkerProps = {
  sheetSrc?: string;        // "/sprites/casper-walk.png"
  normalSrc?: string;       // "/sprites/casper-walk_n.png"
  start?: Point;
  speedPxPerSec?: number;
  walkFps?: number;

  frameCount?: number;      // 8
  frameW?: number;          // 256
  frameH?: number;          // 256
  standingFrameIndex?: number; // 7

  lamp?: Lamp;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/**
 * Converts screen pixels -> world units (1 unit == 1 px with our ortho camera).
 */
function useScreenToWorld() {
  const { camera, size } = useThree();
  const ortho = camera as THREE.OrthographicCamera;

  return (clientX: number, clientY: number) => {
    const xNdc = (clientX / size.width) * 2 - 1;
    const yNdc = -(clientY / size.height) * 2 + 1;
    const v = new THREE.Vector3(xNdc, yNdc, 0).unproject(ortho);
    return { x: v.x, y: v.y };
  };
}

function LampLight({ lamp }: { lamp: Lamp }) {
  const color = lamp.color ?? "#ffd28a";
  const intensity = lamp.intensity ?? 2.2;
  const distance = lamp.distance ?? 900;
  const decay = lamp.decay ?? 2;
  const z = lamp.z ?? 220;

  return (
    <group position={[lamp.x, lamp.y, z]}>
      {/* Visible "bulb" so you can confirm position */}
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

      {/* Actual light */}
      <pointLight
        color={color}
        intensity={intensity}
        distance={distance}
        decay={decay}
      />
    </group>
  );
}

function CasperSprite({
  sheetSrc,
  normalSrc,
  start,
  speedPxPerSec,
  walkFps,
  frameCount,
  frameW,
  frameH,
  standingFrameIndex,
}: {
  sheetSrc: string;
  normalSrc: string;
  start: Point;
  speedPxPerSec: number;
  walkFps: number;
  frameCount: number;
  frameW: number;
  frameH: number;
  standingFrameIndex: number;
}) {
  const [pos, setPos] = useState<Point>(start);
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

  const screenToWorld = useScreenToWorld();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const w = screenToWorld(e.clientX, e.clientY);
      setTarget(w);
      setFrame(0);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [screenToWorld]);

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
        const ratio = step / dist;

        return {
          x: p.x + dx * Math.min(1, ratio),
          y: p.y + dy * Math.min(1, ratio),
        };
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
      meshRef.current.position.set(pos.x, pos.y - frameH / 2, 0);
      meshRef.current.scale.set(facing, 1, 1);

      diffuse.offset.x = frame / frameCount;
      normal.offset.x = frame / frameCount;
    }
  });

  const geom = useMemo(() => new THREE.PlaneGeometry(frameW, frameH), [frameW, frameH]);

  return (
    <mesh ref={meshRef} geometry={geom}>
      <meshStandardMaterial
        map={diffuse}
        normalMap={normal}
        transparent
        // make normals easier to "read" under the lamp
        roughness={0.85}
        metalness={0.0}
        // optional tiny self glow (helps separate from background)
        emissive={"#000000"}
        emissiveIntensity={0.0}
      />
    </mesh>
  );
}

function screenPxToWorldPx(sx: number, sy: number, w: number, h: number) {
  return {
    x: sx - w / 2,
    y: h / 2 - sy, // invert Y
  };
}

export default function CasperWalkerThree(props: CasperWalkerProps) {
  const sheetSrc = props.sheetSrc ?? "/sprites/casper-walk.png";
  const normalSrc = props.normalSrc ?? "/sprites/casper-walk_n.png";

  const lampInScreen: Lamp = props.lamp ?? {
    x: 520, y: 260, z: 260, intensity: 100, distance: 2000, decay: 1, color: "#ffd28a",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 30, pointerEvents: "none" }}>
      <Canvas orthographic gl={{ antialias: false, alpha: true }}>
        <OrthoPixelCamera />
        <Scene
          sheetSrc={sheetSrc}
          normalSrc={normalSrc}
          startScreen={props.start ?? { x: 280, y: 420 }}
          lampScreen={lampInScreen}
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
  ...rest
}: {
  sheetSrc: string;
  normalSrc: string;
  startScreen: Point;
  lampScreen: Lamp;
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

  return (
    <>
      <ambientLight intensity={0.12} />
      <LampLight lamp={lampWorld} />

      <CasperSprite
        sheetSrc={sheetSrc}
        normalSrc={normalSrc}
        start={startWorld}   // ✅ now consistent with clicks/world
        {...rest}
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
