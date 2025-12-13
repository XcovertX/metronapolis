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
            objectFit: "cover",
            imageRendering: "pixelated",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          maxWidth: 600,
          background: "rgba(0,0,0,0.55)",
          padding: "1rem 1.25rem",
          borderRadius: 8,
          border: "1px solid rgba(0,255,255,0.3)",
          backdropFilter: "blur(3px)",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        {description.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}
