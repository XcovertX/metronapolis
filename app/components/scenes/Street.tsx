// app/components/scenes/Street.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function Street() {
  const { advanceTime, goToScene } = useLoopState();

  return (
    <section>
      <h1>Street Outside the Building</h1>
      <p style={{ marginTop: "1rem" }}>
        Rain polishes the asphalt into a smeared mirror of neon and exhaust.
        Cars hiss by. Somewhere a siren wails, comfortably distant… for now.
      </p>

      <h2 style={{ marginTop: "2rem" }}>Where do you go?</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 8,
        }}
      >
        <button
          onClick={() => {
            advanceTime(5);
            goToScene("cafe");
          }}
        >
          Head toward the corner café.
        </button>
        <button
          onClick={() => {
            advanceTime(5);
            goToScene("alley");
          }}
        >
          Cut through the alley.
        </button>
        <button
          onClick={() => {
            advanceTime(5);
            goToScene("lobby");
          }}
        >
          Go back into the building.
        </button>
      </div>
    </section>
  );
}
