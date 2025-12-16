"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useLoopState } from "../LoopStateContext";
import { useOptions, PlayerOption } from "../OptionsContext";

type BaseSceneProps = {
  id: string;
  title: string;
  description: string[];
  background?: string; // path to pixel art
  options: PlayerOption[];
};

export default function BaseScene({
  title,
  description,
  background,
  options,
}: BaseSceneProps) {
  const { setOptions, clearOptions } = useOptions();

  useEffect(() => {
    setOptions(options);
    return () => clearOptions();
  }, [options, setOptions, clearOptions]);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {background && (
        <Image
          src={background}
          alt={title}
          fill
          priority
          style={{
            objectFit: "contain",
            backgroundColor: "black",
            imageRendering: "pixelated",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 340,
          background: "rgba(0,0,0,0.55)",
          padding: "1rem 1.25rem",
          borderRadius: 8,
          border: "1px solid rgba(0,255,255,0.3)",
          backdropFilter: "blur(3px)",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: 20 }}>{title}</h1>
        {description.map((p, i) => (
          <p key={i} style={{ margin: 0, marginTop: 8, fontSize: 15 }}>{p}</p>
        ))}
      </div>
    </section>
  );
}
