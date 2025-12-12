// app/components/scenes/Rooftop.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function Rooftop() {
  const { advanceTime, goToScene } = useLoopState();

  return (
    <section>
      <h1>Building Rooftop</h1>
      <p style={{ marginTop: "1rem" }}>
        The rooftop lifts you above the noise, but not the problems. Metronapolis
        stretches out in every direction, a mess of light and shadow pretending
        to be a city.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What now?</h2>
      <button
        onClick={() => {
          advanceTime(5);
          goToScene("lobby");
        }}
      >
        Head back down to the lobby.
      </button>
    </section>
  );
}
