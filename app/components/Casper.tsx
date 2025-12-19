"use client";

import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import type { WalkCollisionData } from "../game/navMeshs/types";
import type { SceneId } from "../game/sceneGraph";
import type { Point, Polygon, SceneChangeZone } from "./SceneView";
import { useScene } from "./SceneView";

/** ----- helpers ----- */
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
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
  if (!isInsideAny(pt, nav.walkables as any)) return false;
  if (isInsideAny(pt, nav.colliders as any)) return false;
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

function findSceneZoneHit(
  pWorld: Point,
  zones: SceneChangeZone[] | undefined
): { zoneId: string; targetSceneId: SceneId } | null {
  if (!zones || zones.length === 0) return null;
  for (const z of zones) {
    if (z.points.length >= 3 && pointInPoly(pWorld, z.points)) {
      return { zoneId: z.id, targetSceneId: z.targetSceneId };
    }
  }
  return null;
}

/** ----- Props ----- */
export type CasperProps = {
  /** world-space start position */
  startWorld: Point;

  /** sprite sheets */
  sheetSrc?: string; // default "/sprites/casper-walk.png"
  normalSrc?: string; // default "/sprites/casper-walk_n.png"

  /** movement */
  speedPxPerSec?: number; // default 260
  speedScalesWithSprite?: boolean; // default false

  /** animation */
  walkFps?: number; // default 12
  frameCount?: number; // default 8
  frameW?: number; // default 256
  frameH?: number; // default 256
  standingFrameIndex?: number; // default 7

  /** scale only sprite */
  spriteScale?: number; // default 1

  /** optional: called when Casper ENTERS a scene-change-zone */
  onSceneChange?: (targetSceneId: SceneId, zoneId: string) => void;

  /** optional: debounce between zone triggers */
  sceneChangeCooldownMs?: number; // default 800
};

/** ----- Component ----- */
export default function Casper(props: CasperProps) {
  const scene = useScene();

  const navWorld = scene.navWorld;
  const sceneZonesWorld = useMemo<SceneChangeZone[]>(
    () => ((navWorld as any).sceneChangeZones ?? []) as SceneChangeZone[],
    [navWorld]
  );

  const sheetSrc = props.sheetSrc ?? "/sprites/casper-walk.png";
  const normalSrc = props.normalSrc ?? "/sprites/casper-walk_n.png";

  const spriteScale = props.spriteScale ?? 1;

  const baseSpeed = props.speedPxPerSec ?? 260;
  const speedPxPerSec =
    (props.speedScalesWithSprite ?? false) ? baseSpeed * spriteScale : baseSpeed;

  const walkFps = props.walkFps ?? 12;
  const frameCount = props.frameCount ?? 8;
  const frameW = props.frameW ?? 256;
  const frameH = props.frameH ?? 256;
  const standingFrameIndex = props.standingFrameIndex ?? 7;

  const cooldownMs = props.sceneChangeCooldownMs ?? 800;

  // authoritative mutable state (prevents stale-closure issues)
  const posRef = useRef<Point>({ ...props.startWorld });
  const targetRef = useRef<Point | null>(null);
  const frameRef = useRef<number>(standingFrameIndex);
  const facingRef = useRef<1 | -1>(1);

  const lastTRef = useRef<number>(0);
  const animAccRef = useRef<number>(0);

  // zone debounce
  const lastZoneRef = useRef<string | null>(null);
  const lastTriggerMsRef = useRef<number>(0);

  // mesh + textures
  const meshRef = useRef<THREE.Mesh>(null);
  const [diffuse, normal] = useTexture([sheetSrc, normalSrc]);

  // init texture settings
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

  // geometry pivot at feet
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(frameW, frameH);
    g.translate(0, frameH / 2, 0);
    return g;
  }, [frameW, frameH]);

  // when startWorld changes, update position (only if we are NOT currently walking)
  useEffect(() => {
    if (!targetRef.current) {
      posRef.current = { ...props.startWorld };
      frameRef.current = standingFrameIndex;
    }
  }, [props.startWorld.x, props.startWorld.y, standingFrameIndex]);

  // consume scene click-to-move target
  useEffect(() => {
    const t = scene.moveTarget;
    if (!t) return;

    if (!isWalkable(t, navWorld)) {
      scene.setMoveTarget(null);
      return;
    }

    targetRef.current = t;
    frameRef.current = 0;

    // optional: clear move target so other systems can set a new one
    scene.setMoveTarget(null);
  }, [scene.moveTarget, navWorld, scene]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const last = lastTRef.current || t;
    const dt = clamp(t - last, 0, 0.05);
    lastTRef.current = t;

    const pos = posRef.current;
    const target = targetRef.current;

    const walking = !!target;

    // --- movement + frame advance ---
    if (!walking) {
      frameRef.current = standingFrameIndex;
    } else {
      const dest = target!;
      const dx = dest.x - pos.x;
      const dy = dest.y - pos.y;

      if (Math.abs(dx) > 2) facingRef.current = dx >= 0 ? 1 : -1;

      const dist = Math.hypot(dx, dy);
      const stopDist = 2;

      if (dist <= stopDist) {
        posRef.current = dest;
        targetRef.current = null;
        frameRef.current = standingFrameIndex;
      } else {
        const step = speedPxPerSec * dt;
        const next = stepWithCollision(pos, dest, step, navWorld);

        if (next.x === pos.x && next.y === pos.y) {
          // blocked
          targetRef.current = null;
          frameRef.current = standingFrameIndex;
        } else {
          posRef.current = next;
        }

        // animation
        animAccRef.current += dt;
        const frameInterval = 1 / walkFps;
        if (animAccRef.current >= frameInterval) {
          animAccRef.current -= frameInterval;
          const walkMax = Math.max(0, standingFrameIndex - 1);
          frameRef.current = (frameRef.current + 1) % (walkMax + 1);
        }
      }
    }

    // --- apply transforms using refs (no stale state) ---
    const p = posRef.current;
    const facing = facingRef.current;
    const frame = frameRef.current;

    if (meshRef.current) {
      meshRef.current.position.set(p.x, p.y, 0);
      meshRef.current.scale.set(facing * spriteScale, spriteScale, 1);
    }

    diffuse.offset.x = frame / frameCount;
    normal.offset.x = frame / frameCount;

    // --- scene-zone ENTER detection ---
    if (props.onSceneChange && sceneZonesWorld.length > 0) {
      const hit = findSceneZoneHit(p, sceneZonesWorld);
      const nowMs = performance.now();

      if (!hit) {
        lastZoneRef.current = null;
      } else {
        const isNewZone = lastZoneRef.current !== hit.zoneId;
        const cooledDown = nowMs - lastTriggerMsRef.current >= cooldownMs;

        if (isNewZone && cooledDown) {
          lastZoneRef.current = hit.zoneId;
          lastTriggerMsRef.current = nowMs;
          props.onSceneChange(hit.targetSceneId, hit.zoneId);
        } else {
          lastZoneRef.current = hit.zoneId;
        }
      }
    }
  });

  return (
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
  );
}
