// app/components/scenes/AptBedroom.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function AptBedroom() {
  const { advanceTime, goToScene } = useLoopState();

  const goToLiving = () => {
    advanceTime(5);
    goToScene("apt-living");
  };

  return (
    <section>
      <h1>Apartment – Bedroom</h1>
      <p style={{ marginTop: "1rem" }}>
        You wake up to the hum of cheap circuitry and the dull glow of the city
        bleeding through half-broken blinds. Same ceiling. Same crack in the
        plaster. Same feeling you&apos;ve done this before.
      </p>
      <p>
        The Retinaband in your eye boots up, burning the time into your vision.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What do you do?</h2>
      <button onClick={goToLiving}>Get up and step into the living room.</button>
    </section>
  );
}
