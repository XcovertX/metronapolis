// app/components/WebGLStage.tsx
"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as PIXI from "pixi.js";
import { Filter, GlProgram } from "pixi.js";

type Lamp = {
  id: string;
  x: number; // world px (background pixel space)
  y: number; // world px
  radius?: number; // world px
  intensity?: number; // 0..1
};

type WebGLStageProps = {
  /** public/ path like "/rooms/apt-bedroom.png" */
  backgroundSrc: string;

  /** public/ path like "/rooms/apt-bedroom_n.png" (normal map, same size as background) */
  backgroundNormalSrc: string;

  /** public/ path like "/sprites/casper.png" */
  playerSrc: string;

  /** public/ path like "/sprites/casper_n.png" (normal map, same size as player) */
  playerNormalSrc: string;

  /** world coords (pixels in your background image space) */
  playerX: number;
  playerY: number;

  /** optional: scale up pixel art */
  scale?: number;

  /** lamps in the scene (world coords) */
  lamps?: Lamp[];

  /** adds a subtle CRT overlay in WebGL */
  crt?: boolean;

  className?: string;
};

function buildNormalLightFilter(params: {
  normalTexture: PIXI.Texture;
  texWidth: number;
  texHeight: number;
  ambient?: number;
}) {
  const vertex = `
    in vec2 aPosition;
    out vec2 vTextureCoord;

    uniform vec4 uInputSize;
    uniform vec4 uOutputFrame;
    uniform vec4 uOutputTexture;

    void main(void) {
      gl_Position = vec4(aPosition * 2.0 - 1.0, 0.0, 1.0);
      vTextureCoord = aPosition;
    }
  `;

  // One-light normal map shading + radial attenuation.
  // Light is specified in *texture pixel space* (not UV).
  const fragment = `
    precision highp float;

    in vec2 vTextureCoord;

    uniform sampler2D uTexture;
    uniform sampler2D uNormal;

    uniform vec2  uTexSize;        // (w,h) in pixels
    uniform vec2  uLightPosPx;     // (x,y) in pixels
    uniform float uLightRadiusPx;  // radius in pixels
    uniform float uLightIntensity; // 0..1-ish
    uniform float uAmbient;        // 0..1

    void main(void) {
      vec4 base = texture(uTexture, vTextureCoord);

      // If sprite is fully transparent, keep it cheap.
      if (base.a <= 0.0) {
        gl_FragColor = base;
        return;
      }

      // normal map: RGB in [0..1] -> [-1..1]
      vec3 n = texture(uNormal, vTextureCoord).rgb * 2.0 - 1.0;
      n = normalize(n);

      vec2 fragPx = vTextureCoord * uTexSize;
      vec2 d = uLightPosPx - fragPx;
      float dist = length(d);

      // attenuation: 1 at center -> 0 at radius
      float att = 1.0 - smoothstep(0.0, uLightRadiusPx, dist);

      // Light direction: treat the normal map as a surface facing the camera
      // Use z-bias so it still lights when the lamp is near.
      vec3 L = normalize(vec3(d / max(uLightRadiusPx, 1.0), 0.9));

      float diff = max(dot(n, L), 0.0);

      float light = clamp(uAmbient + diff * att * uLightIntensity, 0.0, 2.0);

      vec3 lit = base.rgb * light;
      gl_FragColor = vec4(lit, base.a);
    }
  `;

  const filter = new Filter({
    glProgram: new GlProgram({ vertex, fragment }),
    resources: {
      // Uniform buffer name can be anything; Pixi exposes it under filter.resources.<name>.uniforms
      lightUniforms: {
        uTexSize: { value: [params.texWidth, params.texHeight], type: "vec2<f32>" },
        uLightPosPx: { value: [0, 0], type: "vec2<f32>" },
        uLightRadiusPx: { value: 220, type: "f32" },
        uLightIntensity: { value: 0.6, type: "f32" },
        uAmbient: { value: params.ambient ?? 0.35, type: "f32" },
      },
      // Texture resource for the normal map
      uNormal: params.normalTexture,
    },
  });

  return filter;
}

function setNearest(tex: PIXI.Texture) {
  // Pixi v8: texture.source is the underlying source (Image/Canvas/etc)
  // scaleMode lives there.
  // (Some typings allow string; others use enum. This works in v8 runtime.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src: any = (tex as any).source;
  if (src) src.scaleMode = "nearest";
}

export default function WebGLStage({
  backgroundSrc,
  backgroundNormalSrc,
  playerSrc,
  playerNormalSrc,
  playerX,
  playerY,
  scale = 3,
  lamps = [{ id: "lamp-1", x: 420, y: 170, radius: 240, intensity: 0.65 }],
  crt = false,
  className,
}: WebGLStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const appRef = useRef<PIXI.Application | null>(null);

  const worldRef = useRef<PIXI.Container | null>(null);

  const bgRef = useRef<PIXI.Sprite | null>(null);
  const playerRef = useRef<PIXI.Sprite | null>(null);

  const bgFilterRef = useRef<PIXI.Filter | null>(null);
  const playerFilterRef = useRef<PIXI.Filter | null>(null);

  // Keep latest lamps in a ref so ticker doesn’t depend on JSON.stringify
  const lampsRef = useRef<Lamp[]>(lamps);
  useEffect(() => {
    lampsRef.current = lamps;
  }, [lamps]);

  useEffect(() => {
    let destroyed = false;

    async function boot() {
      if (!hostRef.current) return;

      // Create app (Pixi v8 init)
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

      // World container scales “world pixels” up to screen pixels
      const world = new PIXI.Container();
      world.scale.set(scale);
      app.stage.addChild(world);
      worldRef.current = world;

      // Load textures
      const [bgTex, bgNTex, plTex, plNTex] = await Promise.all([
        PIXI.Assets.load(backgroundSrc),
        PIXI.Assets.load(backgroundNormalSrc),
        PIXI.Assets.load(playerSrc),
        PIXI.Assets.load(playerNormalSrc),
      ]);

      if (destroyed) return;

      // Pixel-perfect sampling
      setNearest(bgTex);
      setNearest(bgNTex);
      setNearest(plTex);
      setNearest(plNTex);

      // Background sprite
      const bg = new PIXI.Sprite(bgTex);
      bg.x = 0;
      bg.y = 0;
      world.addChild(bg);
      bgRef.current = bg;

      // Player sprite
      const player = new PIXI.Sprite(plTex);
      player.anchor.set(0.5, 1.0); // feet at (x,y)
      player.x = playerX;
      player.y = playerY;
      world.addChild(player);
      playerRef.current = player;

      // Create lighting filters (one per sprite, each with its own normal map)
      const bgFilter = buildNormalLightFilter({
        normalTexture: bgNTex,
        texWidth: bgTex.width,
        texHeight: bgTex.height,
        ambient: 0.28,
      });
      bg.filters = [bgFilter];
      bgFilterRef.current = bgFilter;

      const playerFilter = buildNormalLightFilter({
        normalTexture: plNTex,
        texWidth: plTex.width,
        texHeight: plTex.height,
        ambient: 0.35,
      });
      player.filters = [playerFilter];
      playerFilterRef.current = playerFilter;

      // Optional CRT overlay in WebGL (very lightweight)
      let crtGfx: PIXI.Graphics | null = null;
      if (crt) {
        crtGfx = new PIXI.Graphics();
        crtGfx.alpha = 0.10;
        app.stage.addChild(crtGfx);
      }

      // Ticker: update light position each frame (pick closest lamp to the player)
      app.ticker.add(() => {
        const p = playerRef.current;
        const bgF = bgFilterRef.current as any;
        const plF = playerFilterRef.current as any;
        if (!p || !bgF || !plF) return;

        const ls = lampsRef.current ?? [];

        // Choose a “main” lamp: nearest to player (or fallback to first)
        let lamp = ls[0];
        if (lamp && ls.length > 1) {
          let best = Infinity;
          for (const l of ls) {
            const dx = (l.x ?? 0) - p.x;
            const dy = (l.y ?? 0) - (p.y - 18);
            const d2 = dx * dx + dy * dy;
            if (d2 < best) {
              best = d2;
              lamp = l;
            }
          }
        }

        // Convert world px -> texture px.
        // Background is at (0,0) in world so mapping is direct.
        const lightX = lamp?.x ?? p.x;
        const lightY = lamp?.y ?? (p.y - 18);
        const radius = lamp?.radius ?? 240;
        const intensity = lamp?.intensity ?? 0.65;

        // Background light
        bgF.resources.lightUniforms.uniforms.uLightPosPx = [lightX, lightY];
        bgF.resources.lightUniforms.uniforms.uLightRadiusPx = radius;
        bgF.resources.lightUniforms.uniforms.uLightIntensity = intensity;

        // Player light: make it feel like the lamp is affecting the character too.
        // Map lamp to player texture space by projecting relative vector onto sprite pixels.
        // Simple approximation: use player-local px, centered at player anchor.
        const plLocalX = (lightX - (p.x - plF.resources.lightUniforms.uniforms.uTexSize[0] * 0.5));
        const plLocalY = (lightY - (p.y - plF.resources.lightUniforms.uniforms.uTexSize[1]));
        plF.resources.lightUniforms.uniforms.uLightPosPx = [plLocalX, plLocalY];
        plF.resources.lightUniforms.uniforms.uLightRadiusPx = Math.max(140, radius * 0.6);
        plF.resources.lightUniforms.uniforms.uLightIntensity = Math.min(0.95, intensity + 0.1);

        // CRT scanlines (screen-space)
        if (crtGfx && appRef.current) {
          const w = app.screen.width;
          const h = app.screen.height;
          crtGfx.clear();
          for (let y = 0; y < h; y += 3) {
            crtGfx.rect(0, y, w, 1);
          }
          crtGfx.fill({ color: 0xffffff, alpha: 0.12 });
        }
      });
    }

    boot();

    return () => {
      destroyed = true;

      const app = appRef.current;
      appRef.current = null;
      worldRef.current = null;

      bgRef.current = null;
      playerRef.current = null;

      bgFilterRef.current = null;
      playerFilterRef.current = null;

      if (app) {
        if (app.canvas?.parentNode) app.canvas.parentNode.removeChild(app.canvas);
        app.destroy(true);
      }
    };
    // Boot only when asset identities / scale / crt toggle changes.
  }, [backgroundSrc, backgroundNormalSrc, playerSrc, playerNormalSrc, scale, crt]);

  // Update player position without re-creating the Pixi app
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
      }}
    />
  );
}
