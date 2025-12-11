// app/components/scenes/DeathReset.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function DeathReset() {
  const { resetLoop } = useLoopState();

  const handleReset = () => {
    resetLoop();
  };

  return (
    <section>
      <h1>Impact</h1>
      <p style={{ marginTop: "1rem" }}>
        Horn. Light. Then the world folds sideways. Your body doesn&apos;t feel
        like a body anymore, just a smear of momentum and bad decisions.
      </p>
      <p>
        For a moment there&apos;s nothing but white noise and the faint glow of
        your Retinaband burning a timecode you can&apos;t read.
      </p>
      <p>
        Then asphalt. Streetlight. Cat. Same corner. Same aching feeling that
        you&apos;ve died here before.
      </p>

      <button
        style={{ marginTop: "2rem" }}
        onClick={handleReset}
      >
        Wake up on Static Corner again.
      </button>
    </section>
  );
}
