// app/components/NpcWalker.tsx
"use client";

import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import type { WalkCollisionData } from "../game/navMeshs/types";
import type { Point } from "./SceneView";
import { useScene } from "./SceneView";

/** ----- helpers ----- */
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function randBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
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

function isInsideAny(pt: Point, polys: any[]) {
  for (const p of polys) {
    if (p.points?.length >= 3 && pointInPoly(pt, p.points)) return true;
  }
  return false;
}

function isWalkable(pt: Point, nav: WalkCollisionData) {
  if (!isInsideAny(pt, nav.walkables as any)) return false;
  if (isInsideAny(pt, nav.colliders as any)) return false;
  return true;
}

function stepWithCollision(from: Point, dest: Point, step: number, nav: WalkCollisionData, maxSubStep = 4): Point {
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

/** Pick a random reachable point by sampling around an origin. */
function pickRandomWalkableNear(
  origin: Point,
  nav: WalkCollisionData,
  radius: number,
  minRadius: number,
  maxTries: number
): Point | null {
  for (let i = 0; i < maxTries; i++) {
    const r = randBetween(minRadius, radius);
    const a = randBetween(0, Math.PI * 2);
    const p = { x: origin.x + Math.cos(a) * r, y: origin.y + Math.sin(a) * r };
    if (isWalkable(p, nav)) return p;
  }
  return null;
}

/** ----- Props ----- */
export type NpcWalkerProps = {
  startWorld: Point;

  /** sprite sheet */
  sheetSrc?: string; // default "/sprites/npc-walk.png"
  normalSrc?: string; // default "/sprites/npc-walk_n.png"

  /** movement */
  speedPxPerSec?: number; // default 220
  walkFps?: number; // default 12

  /** sprite sheet metadata */
  frameCount?: number; // default 8
  frameW?: number; // default 256
  frameH?: number; // default 256
  standingFrameIndex?: number; // default 7

  /** scales ONLY the sprite */
  spriteScale?: number; // default 1
  speedScalesWithSprite?: boolean;

  /** use navmesh collision */
  useNavmesh?: boolean; // default true

  /** how close counts as "arrived" */
  stopDist?: number; // default 2

  /** if false, always face right */
  faceMovement?: boolean; // default true

  /** if true, use MeshBasicMaterial (always visible) */
  unlit?: boolean; // default false (you said lit is working)

  /** ---- Random wandering ---- */
  wander?: boolean; // default true
  /** max wander distance from the start anchor (world units / px) */
  wanderRadius?: number; // default 420
  /** minimum distance for each chosen destination */
  wanderMinStep?: number; // default 120
  /** idle pause at each destination (ms) */
  wanderPauseMs?: number; // default 450
  /** random extra pause added (0..wanderPauseJitterMs) */
  wanderPauseJitterMs?: number; // default 650
  /** tries to find a walkable destination */
  wanderMaxTries?: number; // default 40
};

/** ----- Component ----- */
export default function NpcWalker(props: NpcWalkerProps) {
  const scene = useScene();
  const navWorld = scene.navWorld;

  const sheetSrc = props.sheetSrc ?? "/sprites/npc-walk.png";
  const normalSrc = props.normalSrc ?? "/sprites/npc-walk_n.png";

  const spriteScale = props.spriteScale ?? 1;

  const baseSpeed = props.speedPxPerSec ?? 220;
  const speedPxPerSec = (props.speedScalesWithSprite ?? false) ? baseSpeed * spriteScale : baseSpeed;

  const walkFps = props.walkFps ?? 12;
  const frameCount = props.frameCount ?? 8;
  const frameW = props.frameW ?? 256;
  const frameH = props.frameH ?? 256;
  const standingFrameIndex = props.standingFrameIndex ?? 7;

  const useNavmesh = props.useNavmesh ?? true;
  const stopDist = props.stopDist ?? 2;
  const faceMovement = props.faceMovement ?? true;
  const unlit = props.unlit ?? false;

  // wander defaults
  const wander = props.wander ?? true;
  const wanderRadius = props.wanderRadius ?? 420;
  const wanderMinStep = props.wanderMinStep ?? 120;
  const wanderPauseMs = props.wanderPauseMs ?? 450;
  const wanderPauseJitterMs = props.wanderPauseJitterMs ?? 650;
  const wanderMaxTries = props.wanderMaxTries ?? 40;

  // ✅ Always call useTexture the same way
  const [diffuseTex, normalTex] = useTexture([sheetSrc, normalSrc]);
  const diffuse = diffuseTex as THREE.Texture;
  const normal = normalTex as THREE.Texture;

  // texture settings
  useEffect(() => {
    if (!diffuse) return;

    diffuse.magFilter = THREE.NearestFilter;
    diffuse.minFilter = THREE.NearestFilter;
    diffuse.generateMipmaps = false;
    diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.repeat.set(1 / frameCount, 1);
    diffuse.needsUpdate = true;

    if (normal) {
      normal.magFilter = THREE.NearestFilter;
      normal.minFilter = THREE.NearestFilter;
      normal.generateMipmaps = false;
      normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
      normal.repeat.set(1 / frameCount, 1);
      normal.needsUpdate = true;
    }
  }, [diffuse, normal, frameCount]);

  // geometry pivot at feet
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(frameW, frameH);
    g.translate(0, frameH / 2, 0);
    return g;
  }, [frameW, frameH]);

  // authoritative mutable state
  const anchorRef = useRef<Point>({ ...props.startWorld }); // wander is relative to this anchor
  const posRef = useRef<Point>({ ...props.startWorld });
  const targetRef = useRef<Point | null>(null);
  const frameRef = useRef<number>(standingFrameIndex);
  const facingRef = useRef<1 | -1>(1);

  // wander pause scheduling
  const pausedUntilMsRef = useRef<number>(0);

  useEffect(() => {
    anchorRef.current = { ...props.startWorld };
    posRef.current = { ...props.startWorld };
    targetRef.current = null;
    frameRef.current = standingFrameIndex;
  }, [props.startWorld.x, props.startWorld.y, standingFrameIndex]);

  const meshRef = useRef<THREE.Mesh>(null);
  const lastTRef = useRef<number>(0);
  const animAccRef = useRef<number>(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const last = lastTRef.current || t;
    const dt = clamp(t - last, 0, 0.05);
    lastTRef.current = t;

    const nowMs = performance.now();

    // --- wandering: pick a new destination if we don't have one ---
    if (wander && !targetRef.current) {
      // if we are in a pause window, stay idle
      if (nowMs < pausedUntilMsRef.current) {
        frameRef.current = standingFrameIndex;
      } else {
        // choose a random destination within radius of anchor
        const anchor = anchorRef.current;
        const dest = pickRandomWalkableNear(anchor, navWorld, wanderRadius, wanderMinStep, wanderMaxTries);

        if (dest) {
          targetRef.current = dest;
          frameRef.current = 0;
        } else {
          // couldn't find one; try again after a short pause
          pausedUntilMsRef.current = nowMs + 350;
          frameRef.current = standingFrameIndex;
        }
      }
    }

    const pos = posRef.current;
    const target = targetRef.current;

    const walking = !!target;

    // --- movement ---
    if (!walking) {
      frameRef.current = standingFrameIndex;
    } else {
      const dest = target!;
      const dx = dest.x - pos.x;
      const dy = dest.y - pos.y;

      if (faceMovement && Math.abs(dx) > 1) facingRef.current = dx >= 0 ? 1 : -1;

      const dist = Math.hypot(dx, dy);

      if (dist <= stopDist) {
        posRef.current = dest;
        targetRef.current = null;
        frameRef.current = standingFrameIndex;

        // schedule pause before next wander leg
        if (wander) {
          pausedUntilMsRef.current =
            nowMs + wanderPauseMs + (wanderPauseJitterMs > 0 ? Math.random() * wanderPauseJitterMs : 0);
        }
      } else {
        const step = speedPxPerSec * dt;

        let next = dest;
        if (useNavmesh) {
          if (!isWalkable(dest, navWorld)) {
            // target became invalid somehow; drop it and pause
            targetRef.current = null;
            frameRef.current = standingFrameIndex;
            if (wander) pausedUntilMsRef.current = nowMs + 300;
            next = pos;
          } else {
            next = stepWithCollision(pos, dest, step, navWorld);
          }
        } else {
          const d = Math.max(1e-6, dist);
          next = { x: pos.x + (dx / d) * step, y: pos.y + (dy / d) * step };
        }

        // blocked or stuck (navmesh)
        if (useNavmesh && next.x === pos.x && next.y === pos.y) {
          targetRef.current = null;
          frameRef.current = standingFrameIndex;
          if (wander) pausedUntilMsRef.current = nowMs + 350;
        } else {
          posRef.current = next;

          // animation frames while walking
          animAccRef.current += dt;
          const frameInterval = 1 / walkFps;
          if (animAccRef.current >= frameInterval) {
            animAccRef.current -= frameInterval;
            const walkMax = Math.max(0, standingFrameIndex - 1);
            frameRef.current = (frameRef.current + 1) % (walkMax + 1);
          }
        }
      }
    }

    // apply transforms
    const p = posRef.current;
    const frame = frameRef.current;
    const facing = facingRef.current;

    if (meshRef.current) {
      meshRef.current.position.set(p.x, p.y, 0);
      meshRef.current.scale.set(facing * spriteScale, spriteScale, 1);
    }

    if (diffuse) diffuse.offset.x = frame / frameCount;
    if (normal) normal.offset.x = frame / frameCount;
  });

  return (
    <mesh ref={meshRef} geometry={geom} raycast={null as any}>
      {unlit ? (
        <meshBasicMaterial map={diffuse} transparent side={THREE.DoubleSide} />
      ) : (
        <meshStandardMaterial
          map={diffuse}
          normalMap={normal ?? undefined}
          transparent
          roughness={0.85}
          metalness={0}
          side={THREE.DoubleSide}
        />
      )}
    </mesh>
  );
}
