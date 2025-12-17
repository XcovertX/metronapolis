"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { LightingData } from "@/app/game/lighting/lightingTypes";

type Props = {
  lightingData?: LightingData;
  /** show by default */
  defaultVisible?: boolean;
  /** zIndex (should be above your canvas) */
  zIndex?: number;
};

function hexToRgba(hex: string, a: number) {
  // handles #rgb or #rrggbb
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export default function LightingDebugOverlay({
  lightingData,
  defaultVisible = true,
  zIndex = 9997,
}: Props) {
  const [visible, setVisible] = useState(defaultVisible);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Shift+L toggles
      if (e.shiftKey && e.key.toLowerCase() === "l") setVisible((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lights = useMemo(() => {
    if (!lightingData) return [];
    return (lightingData.lights ?? []).filter((l) => l.enabled);
  }, [lightingData]);

  if (!visible || !lightingData) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex }}
      aria-hidden
    >
      <svg className="absolute inset-0 h-full w-full">
        {/* ambient label */}
        <text
          x={14}
          y={20}
          fontFamily="monospace"
          fontSize={12}
          fill="rgba(255,255,255,0.75)"
        >
          Lighting Debug (Shift+L): ambient={lightingData.ambient.enabled ? "on" : "off"}{" "}
          I={lightingData.ambient.intensity.toFixed(2)}
        </text>

        {lights.map((l) => {
          const color = l.color || "#ffd28a";
          const circleStroke = hexToRgba(color, 0.55);
          const circleFill = hexToRgba(color, 0.06);
          const dotFill = hexToRgba(color, 0.9);

          const x = l.x;
          const y = l.y;
          const r = Math.max(0, l.distance || 0);

          // Spot cone preview (if spot)
          const isSpot = l.type === "spot";
          const angleDeg = l.angleDeg ?? 35;
          const angleRad = (angleDeg * Math.PI) / 180;
          const half = angleRad / 2;

          // direction from light to target (or default downwards)
          const tx = l.target?.x ?? x;
          const ty = l.target?.y ?? (y + 200);
          const dx = tx - x;
          const dy = ty - y;
          const d = Math.hypot(dx, dy) || 1;
          const ux = dx / d;
          const uy = dy / d;

          // rotate unit vector by +/- half angle to get cone boundary rays
          const cosA = Math.cos(half);
          const sinA = Math.sin(half);

          const rx1 = ux * cosA - uy * sinA;
          const ry1 = ux * sinA + uy * cosA;

          const rx2 = ux * cosA + uy * sinA;
          const ry2 = -ux * sinA + uy * cosA;

          // cone length = distance (fall back to 600 if not set)
          const coneLen = r > 0 ? r : 600;

          const p1 = { x: x + rx1 * coneLen, y: y + ry1 * coneLen };
          const p2 = { x: x + rx2 * coneLen, y: y + ry2 * coneLen };

          return (
            <g key={l.id}>
              {/* falloff circle */}
              {r > 0 && (
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={circleFill}
                  stroke={circleStroke}
                  strokeWidth={2}
                  strokeDasharray="6 6"
                />
              )}

              {/* spot cone */}
              {isSpot && (
                <>
                  <path
                    d={`M ${x} ${y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Z`}
                    fill={hexToRgba(color, 0.05)}
                    stroke={hexToRgba(color, 0.5)}
                    strokeWidth={2}
                  />
                  {/* target line */}
                  <line
                    x1={x}
                    y1={y}
                    x2={tx}
                    y2={ty}
                    stroke={hexToRgba(color, 0.55)}
                    strokeWidth={2}
                    strokeDasharray="4 6"
                  />
                  {/* target dot */}
                  <circle cx={tx} cy={ty} r={4} fill={hexToRgba(color, 0.75)} />
                </>
              )}

              {/* light position marker */}
              <circle cx={x} cy={y} r={6} fill={dotFill} />
              <circle cx={x} cy={y} r={10} fill="transparent" stroke={hexToRgba(color, 0.55)} />

              {/* label */}
              <text
                x={x + 14}
                y={y - 10}
                fontFamily="monospace"
                fontSize={12}
                fill="rgba(255,255,255,0.9)"
              >
                {l.name}
              </text>
              <text
                x={x + 14}
                y={y + 6}
                fontFamily="monospace"
                fontSize={11}
                fill="rgba(255,255,255,0.7)"
              >
                {l.type} · I{l.intensity.toFixed(1)} · D{Math.round(l.distance)} · Z{Math.round(l.z)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
