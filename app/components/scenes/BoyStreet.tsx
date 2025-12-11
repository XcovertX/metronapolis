// app/components/scenes/BoyStreet.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function BoyStreet() {
  const { flags, advanceTime, goToScene } = useLoopState();
  const { bikeStolen } = flags;

  const crossCarelessly = () => {
    advanceTime(5);
    goToScene("death-reset");
  };

  const keepWalking = () => {
    advanceTime(5);
    goToScene("static-corner"); // wrap around the block; still same loop
  };

  return (
    <section>
      <h1>Relay Street – Midday Crowd</h1>

      {!bikeStolen ? (
        <>
          <p style={{ marginTop: "1rem" }}>
            The crowd parts just enough for the kid to rocket past you on his
            bike, tires hissing on wet asphalt. He nearly clips your knee and
            doesn&apos;t bother to apologize. Just laughs and vanishes into the
            traffic.
          </p>
          <p>
            You watch him go. For a second you imagine what would&apos;ve
            happened if that bike never left the rack.
          </p>
        </>
      ) : (
        <>
          <p style={{ marginTop: "1rem" }}>
            The kid stands in the middle of the sidewalk, eyes red, cheeks wet,
            staring at an empty patch of railing like it insulted his mother.
          </p>
          <p>
            He catches your eye for half a heartbeat. You look away first.
            Always easier that way.
          </p>
          <p>
            “Someone took it,” he mutters to no one in particular. “Wasn&apos;t
            even worth stealing.”
          </p>
        </>
      )}

      <p>
        Traffic roars. Your Retinaband pulses softly at the edge of your vision,
        digits burning the same five-minute intervals into your skull.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What do you do?</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        <button onClick={crossCarelessly}>
          Cross the street without waiting for a gap.
        </button>
        <button onClick={keepWalking}>
          Drift with the crowd and circle the block.
        </button>
      </div>
    </section>
  );
}
