// app/components/scenes/Street.tsx
"use client";

import { useEffect } from "react";
import { useLoopState } from "../LoopStateContext";
import { useOptions } from "../OptionsContext";

export default function Street() {
  const { advanceTime, goToScene } = useLoopState();
  const { setOptions, clearOptions } = useOptions();

  useEffect(() => {
    const toCafe = () => {
      advanceTime(5);
      goToScene("cafe");
    };
    const toAlley = () => {
      advanceTime(5);
      goToScene("alley");
    };
    const toLobby = () => {
      advanceTime(5);
      goToScene("lobby");
    };

    const opts = [
      {
        id: "street-cafe",
        label: "Head toward the corner café.",
        onSelect: toCafe,
      },
      {
        id: "street-alley",
        label: "Cut through the alley.",
        onSelect: toAlley,
      },
      {
        id: "street-lobby",
        label: "Go back into the building.",
        onSelect: toLobby,
      },
    ];

    setOptions(opts);
    return () => clearOptions();
  }, [advanceTime, goToScene, setOptions, clearOptions]);

  return (
    <section>
      <h1>Street Outside the Building</h1>
      <p style={{ marginTop: "1rem" }}>
        Rain polishes the asphalt into a smeared mirror of neon and exhaust.
        Cars hiss by. Somewhere a siren wails, comfortably distant… for now.
      </p>
    </section>
  );
}
