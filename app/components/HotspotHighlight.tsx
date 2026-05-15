// app/components/HotspotHighlight.tsx
"use client";

import React from "react";
import type { InteractionMode } from "./InteractionModeContext";

type HotspotHighlightProps = {
  /** Position in image pixels (relative to background image dimensions) */
  x: number;
  y: number;
  /** Size of the hotspot */
  width?: number;
  height?: number;
  /** Interaction mode this hotspot belongs to */
  mode: Exclude<InteractionMode, null>;
  /** Label to show on hover */
  label?: string;
  /** Container dimensions for scaling */
  containerRef: React.RefObject<HTMLDivElement | null>;
  bgNative: { w: number; h: number };
};

const MODE_COLORS = {
  walk: {
    color: "rgba(0,255,210,0.95)",
    glow: "rgba(0,255,210,0.5)",
    border: "rgba(0,255,210,0.8)",
  },
  examine: {
    color: "rgba(255,200,90,0.95)",
    glow: "rgba(255,200,90,0.5)",
    border: "rgba(255,200,90,0.8)",
  },
  talk: {
    color: "rgba(150,200,255,0.95)",
    glow: "rgba(150,200,255,0.5)",
    border: "rgba(150,200,255,0.8)",
  },
  take: {
    color: "rgba(255,150,200,0.95)",
    glow: "rgba(255,150,200,0.5)",
    border: "rgba(255,150,200,0.8)",
  },
};

export default function HotspotHighlight({
  x,
  y,
  width = 80,
  height = 80,
  mode,
  label,
  containerRef,
  bgNative,
}: HotspotHighlightProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [scaledPosition, setScaledPosition] = React.useState({ x: 0, y: 0, w: 0, h: 0 });

  const colors = MODE_COLORS[mode];

  // Calculate scaled position based on container size
  React.useEffect(() => {
    const updatePosition = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Calculate scale factor
      const scaleX = rect.width / bgNative.w;
      const scaleY = rect.height / bgNative.h;

      // Use the smaller scale to maintain aspect ratio
      const scale = Math.min(scaleX, scaleY);

      // Calculate scaled dimensions
      const scaledW = bgNative.w * scale;
      const scaledH = bgNative.h * scale;

      // Calculate offset to center the image
      const offsetX = (rect.width - scaledW) / 2;
      const offsetY = (rect.height - scaledH) / 2;

      // Convert image coordinates to screen coordinates
      const screenX = x * scale + offsetX;
      const screenY = y * scale + offsetY;
      const screenW = width * scale;
      const screenH = height * scale;

      setScaledPosition({ x: screenX, y: screenY, w: screenW, h: screenH });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [x, y, width, height, containerRef, bgNative]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "absolute",
        left: scaledPosition.x - scaledPosition.w / 2,
        top: scaledPosition.y - scaledPosition.h / 2,
        width: scaledPosition.w,
        height: scaledPosition.h,
        pointerEvents: "none",
        transition: "all 0.3s ease-out",
        zIndex: 20,
      }}
    >
      {/* Pulsing glow effect */}
      <div
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          opacity: isHovered ? 0.8 : 0.4,
          animation: "pulse 2s ease-in-out infinite",
          filter: "blur(8px)",
        }}
      />

      {/* Border ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `2px solid ${colors.border}`,
          opacity: isHovered ? 1 : 0.6,
          boxShadow: `0 0 20px ${colors.glow}, inset 0 0 20px ${colors.glow}`,
          transition: "all 0.3s ease-out",
        }}
      />

      {/* Inner dot */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: isHovered ? "30%" : "20%",
          height: isHovered ? "30%" : "20%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          backgroundColor: colors.color,
          boxShadow: `0 0 15px ${colors.glow}`,
          transition: "all 0.3s ease-out",
        }}
      />

      {/* Label on hover */}
      {label && isHovered && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            padding: "6px 12px",
            borderRadius: "6px",
            backgroundColor: "rgba(0,0,0,0.9)",
            border: `1px solid ${colors.border}`,
            color: colors.color,
            fontSize: "12px",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 500,
            boxShadow: `0 0 15px ${colors.glow}`,
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          {label}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
