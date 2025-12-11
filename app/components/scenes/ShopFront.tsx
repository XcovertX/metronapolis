// app/components/scenes/ShopFront.tsx
"use client";

import { useLoopState } from "../LoopStateContext";

export default function ShopFront() {
  const { advanceTime, goToScene, setFlags } = useLoopState();

  const stealBike = () => {
    setFlags((prev) => ({ ...prev, bikeStolen: true }));
    advanceTime(5);
    goToScene("boy-street");
  };

  const leaveBike = () => {
    advanceTime(5);
    goToScene("boy-street");
  };

  return (
    <section>
      <h1>Corner Shop – 12th & Relay</h1>
      <p style={{ marginTop: "1rem" }}>
        The shop hums with flickering fluorescents and the low drone of
        refrigeration units dying in slow motion. A kid skids to a stop, throws
        a dented bike against the rack, and rushes inside clutching a handful
        of worn credits.
      </p>
      <p>
        The bike sits there. Rusted chain, one mismatched pedal. Locked with a
        cable that looks older than the kid.
      </p>
      <p>
        Your Retinaband ticks five more minutes into the void. Nobody’s watching
        you. Not really.
      </p>

      <h2 style={{ marginTop: "2rem" }}>What do you do?</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        <button onClick={stealBike}>
          Take the kid&apos;s bike and roll it away.
        </button>
        <button onClick={leaveBike}>
          Leave the bike where it is and move on.
        </button>
      </div>
    </section>
  );
}
