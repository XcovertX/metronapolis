// app/components/scenes/Alley.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function Alley() {
  const { advanceTime, goToScene } = useLoopState();

  return (
    <section>
      <h1>Service Alley</h1>
      <p style={{ marginTop: "1rem" }}>
        The alley crouches between buildings like a bad secret: stacked crates,
        humming vents, and the faint buzz of a faulty security cam watching
        absolutely no one.
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
          Go back to the street.
        </button>
        <button
          onClick={() => {
            advanceTime(10);
            goToScene("transit");
          }}
        >
          Follow the alley toward the transit hub.
        </button>
      </div>
    </section>
  );
}
