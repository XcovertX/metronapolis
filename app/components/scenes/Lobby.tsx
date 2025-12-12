// app/components/scenes/Lobby.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function Lobby() {
  const { advanceTime, goToScene } = useLoopState();

  return (
    <section>
      <h1>Building Lobby</h1>
      <p style={{ marginTop: "1rem" }}>
        The lobby smells like burnt coffee and recycled air. A flickering panel
        pretends to show building alerts, but it hasn&apos;t updated in months.
        Or maybe it&apos;s just stuck in the same day.
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
            goToScene("street");
          }}
        >
          Step out onto the street.
        </button>
        <button
          onClick={() => {
            advanceTime(5);
            goToScene("apt-living");
          }}
        >
          Go back up to the apartment.
        </button>
      </div>
    </section>
  );
}
