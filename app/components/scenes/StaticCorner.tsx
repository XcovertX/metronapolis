// app/components/scenes/StaticCorner.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function StaticCorner() {
  const { advanceTime, goToScene } = useLoopState();

  const goToShop = () => {
    advanceTime(5); // 11:55 → 12:00
    goToScene("shop-front");
  };

  const recklessStep = () => {
    advanceTime(5);
    goToScene("death-reset");
  };

  return (
    <section>
      <h1>Static Corner, Metronapolis</h1>
      <p style={{ marginTop: "1rem" }}>
        Rain beads on the cracked pavement. Neon drips down the shopfronts like
        cheap makeup after a long night. The same flickering streetlight. The
        same cat watching from the same dumpster. Same corner. Same headache.
      </p>
      <p>
        Everyone else calls this intersection Sector 12–North. You call it the
        place you keep waking up.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What do you do?</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        <button onClick={goToShop}>
          Walk toward the corner shop.
        </button>
        <button onClick={recklessStep}>
          Step out into traffic without looking.
        </button>
      </div>
    </section>
  );
}
