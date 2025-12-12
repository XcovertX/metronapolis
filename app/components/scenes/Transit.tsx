// app/components/scenes/Transit.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function Transit() {
  const { advanceTime, goToScene } = useLoopState();

  return (
    <section>
      <h1>Transit Kiosk</h1>
      <p style={{ marginTop: "1rem" }}>
        The transit hub hums with energy and disinterest. Screens cycle through
        delayed schedules. Somewhere beneath all this is a way out of this
        neighborhood—or deeper into whatever broke the day.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What now?</h2>
      <button
        onClick={() => {
          advanceTime(10);
          goToScene("alley");
        }}
      >
        Head back through the alley.
      </button>
    </section>
  );
}
