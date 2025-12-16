// app/components/WebGLStage.tsx
"use client";

import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import "pixi.js/advanced-blend-modes";



type Lamp = {
  id: string;
  x: number;
  y: number;
  radius?: number;
  intensity?: number; // 0..1
};

type WebGLStageProps = {
  /** public/ path like "/rooms/apt-bedroom.png" */
  backgroundSrc: string;

  /** public/ path like "/sprites/casper.png" */
  playerSrc: string;

  /** world coords (pixels in your background image space) */
  playerX: number;
  playerY: number;

  /** optional: scale up pixel art */
  scale?: number;

  /** lamps in the scene (world coords) */
  lamps?: Lamp[];

  /** set to true if you want a subtle CRT scanline overlay in WebGL */
  crt?: boolean;

  className?: string;
};

function makeRadialLightTexture(size = 256) {
  // Canvas radial gradient → Pixi texture
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D context missing");

  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0.0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(0.6, "rgba(255,255,255,0.18)");
  g.addColorStop(1.0, "rgba(255,255,255,0.0)");

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  return PIXI.Texture.from(c);
}

export default function WebGLStage({
  backgroundSrc,
  playerSrc,
  playerX,
  playerY,
  scale = 3,
  lamps = [{ id: "lamp-1", x: 420, y: 170, radius: 240, intensity: 0.55 }],
  crt = false,
  className,
}: WebGLStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  // Keep refs for fast updates without re-creating app
  const appRef = useRef<PIXI.Application | null>(null);
  const playerRef = useRef<PIXI.Sprite | null>(null);
  const playerLightRef = useRef<PIXI.Sprite | null>(null);

  useEffect(() => {
    let destroyed = false;

    async function boot() {
      if (!hostRef.current) return;

      // Create app
      const app = new PIXI.Application();
      await app.init({
        resizeTo: hostRef.current,
        backgroundAlpha: 0,
        antialias: false,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (destroyed) {
        app.destroy(true);
        return;
      }

      appRef.current = app;
      hostRef.current.appendChild(app.canvas);

      // Root container scales “world pixels” up to screen pixels
      const world = new PIXI.Container();
      world.scale.set(scale);
      app.stage.addChild(world);

      // Load textures
      const bgTex = await PIXI.Assets.load(backgroundSrc);
      const plTex = await PIXI.Assets.load(playerSrc);

      // Pixel-perfect sampling
      bgTex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
      plTex.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

      // Background
      const bg = new PIXI.Sprite(bgTex);
      bg.x = 0;
      bg.y = 0;
      world.addChild(bg);

      // Player
      const player = new PIXI.Sprite(plTex);
      player.anchor.set(0.5, 1.0); // feet at (x,y)
      player.x = playerX;
      player.y = playerY;
      world.addChild(player);
      playerRef.current = player;

      // --- LIGHTING LAYER (simple, effective) ---
      // We’ll draw lights as additive sprites above the scene.
      // Later you can upgrade this to a real shader/normal-map pipeline.

      const lightLayer = new PIXI.Container();
      // additive blend for “glow”
      lightLayer.blendMode = "screen";

      world.addChild(lightLayer);

      const lightTex = makeRadialLightTexture(256);

      // Static lamps
      for (const l of lamps) {
        const s = new PIXI.Sprite(lightTex);
        s.anchor.set(0.5);
        s.x = l.x;
        s.y = l.y;
        const r = l.radius ?? 220;
        s.width = r;
        s.height = r;
        s.alpha = l.intensity ?? 0.5;
        s.blendMode = "screen";
        lightLayer.addChild(s);
      }

      // Player-follow light
      const playerLight = new PIXI.Sprite(lightTex);
      playerLight.anchor.set(0.5);
      playerLight.width = 210;
      playerLight.height = 210;
      playerLight.alpha = 0.35;
      playerLight.blendMode = "screen";
      lightLayer.addChild(playerLight);
      playerLightRef.current = playerLight;

      // Optional CRT scanlines inside WebGL (you already have HUD scanlines too)
      if (crt) {
        const scan = new PIXI.Graphics();
        scan.alpha = 0.12;
        scan.blendMode = "overlay";

        // draw in screen space (not world), so add to app.stage not world
        app.stage.addChild(scan);

        app.ticker.add(() => {
          if (!hostRef.current) return;
          const w = app.screen.width;
          const h = app.screen.height;
          scan.clear();
          // horizontal scanlines
          for (let y = 0; y < h; y += 3) {
            scan.rect(0, y, w, 1);
          }
          scan.fill({ color: 0xffffff, alpha: 0.15 });
        });
      }

      // Update loop
      app.ticker.add(() => {
        const p = playerRef.current;
        const pl = playerLightRef.current;
        if (!p || !pl) return;

        // keep player light slightly above feet
        pl.x = p.x;
        pl.y = p.y - 22;
      });
    }

    boot();

    return () => {
      destroyed = true;
      const app = appRef.current;
      appRef.current = null;
      playerRef.current = null;
      playerLightRef.current = null;

      if (app) {
        // remove canvas
        if (app.canvas?.parentNode) app.canvas.parentNode.removeChild(app.canvas);
        app.destroy(true);
      }
    };
    // IMPORTANT: only boot once per background/player asset combo + scale
  }, [backgroundSrc, playerSrc, scale, crt, JSON.stringify(lamps)]);

  // Update player position without re-creating the app
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    p.x = playerX;
    p.y = playerY;
  }, [playerX, playerY]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        // makes canvas fill
      }}
    />
  );
}
